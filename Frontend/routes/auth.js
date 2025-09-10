// /home/jiankang/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const axios = require('axios');
const {
    JWT_SECRET,
    LINUX_DO_CLIENT_ID,
    LINUX_DO_CLIENT_SECRET,
    LINUX_DO_REDIRECT_URI,
    LINUX_DO_AUTHORIZE_URL,
    LINUX_DO_TOKEN_URL,
    LINUX_DO_USER_INFO_URL
} = require('../config');
const router = express.Router();
const authenticateToken = require('../authMiddleware');

// 注册
router.post('/register', async (req, res) => {
    // ... (此部分代码不变)
    try {
        const { email, password } = req.body;
        if (!email || !password || password.length < 6) {
            return res.status(400).json({ message: '邮箱或密码格式不正确 (密码至少6位)。' });
        }
        const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (users.length > 0) {
            return res.status(409).json({ message: '该邮箱已被注册。' });
        }
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);
        const [result] = await pool.query('INSERT INTO users (email, password_hash) VALUES (?, ?)', [email, password_hash]);
        res.status(201).json({ message: '注册成功！', userId: result.insertId });
    } catch (error) {
        console.error('注册失败:', error);
        res.status(500).json({ message: '服务器内部错误。' });
    }
});

// 登录
router.post('/login', async (req, res) => {
    // ... (此部分代码不变)
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: '请输入邮箱和密码。' });
        }
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        const user = users[0];
        if (!user) {
            return res.status(401).json({ message: '邮箱或密码错误。' });
        }
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: '邮箱或密码错误。' });
        }
        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ message: '登录成功！', token });
    } catch (error) {
        console.error('登录失败:', error);
        res.status(500).json({ message: '服务器内部错误。' });
    }
});

// 重定向到
router.get('/auth/linuxdo', (req, res) => {
    const params = new URLSearchParams({
        client_id: LINUX_DO_CLIENT_ID,
        redirect_uri: LINUX_DO_REDIRECT_URI,
        response_type: 'code',
        scope: 'read',
    });
    res.redirect(`${LINUX_DO_AUTHORIZE_URL}?${params.toString()}`);
});

//回传
router.get('/auth/linuxdo/callback', async (req, res) => {
    console.log('--- Linux.do callback received ---');
    const { code } = req.query;
    console.log('Received authorization code:', code);

    if (!code) {
        console.error('Authorization code is missing.');
        return res.status(400).json({ message: 'Authorization code is missing.' });
    }

    try {
        // 换取
        console.log('Requesting access token...');
        const tokenResponse = await axios.post(LINUX_DO_TOKEN_URL, new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: LINUX_DO_REDIRECT_URI,
            client_id: LINUX_DO_CLIENT_ID,
            client_secret: LINUX_DO_CLIENT_SECRET,
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const { access_token } = tokenResponse.data;
        console.log('Access token received:', access_token ? 'OK' : 'MISSING');

        // 获取用户信息
        console.log('Requesting user info...');
        const userResponse = await axios.get(LINUX_DO_USER_INFO_URL, {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        });

        const { username, email } = userResponse.data;
        console.log('User info received:', { username, email });

        // 检查用户是否存在
        console.log('Checking if user exists in DB...');
        let [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        let user = users[0];

        // 如果用户不存在，则创建新用户
        if (!user) {
            console.log('User not found, creating new user...');
            const [result] = await pool.query('INSERT INTO users (username, email) VALUES (?, ?)', [username, email]);
            [users] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
            user = users[0];
            console.log('New user created:', user);
        } else {
            console.log('User found in DB:', user);
        }

        // 创建JWT
        console.log('Creating JWT...');
        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });
        console.log('JWT created:', token ? 'OK' : 'FAILED');

        // 重定向到前端的静态回调页面
        console.log('Redirecting to frontend static callback page with token...');
        res.redirect(`https://a.joru.email/callback.html?token=${token}`);
        console.log('--- Redirect sent to callback.html ---');

    } catch (error) {
        console.error('--- Linux.do OAuth failed ---');
        // Log the full error object for more details
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('Error data:', error.response.data);
            console.error('Error status:', error.response.status);
            console.error('Error headers:', error.response.headers);
        } else if (error.request) {
            // The request was made but no response was received
            console.error('Error request:', error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error message:', error.message);
        }
        console.error('Error config:', error.config);
        res.status(500).json({ message: '服务器内部错误。' });
    }
});

// 获取当前登录的用户信息
router.get('/me', authenticateToken, async (req, res) => {
    try {
        // req.user 来自于 authenticateToken 中间件解码的 JWT
        // We select password_hash ONLY to check if it's NULL, to let the frontend know
        // if the user can change their password.
        const [users] = await pool.query('SELECT id, email, username, password_hash FROM users WHERE id = ?', [req.user.userId]);
        const user = users[0];

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json(user);
    } catch (error) {
        console.error('Failed to fetch user profile:', error);
        res.status(500).json({ message: '服务器内部错误。' });
    }
});

// 更改密码
router.post('/change-password', authenticateToken, async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.userId;

    if (!oldPassword || !newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: '密码格式不正确 (新密码至少6位)。' });
    }

    try {
        // 1. 获取当前用户的密码哈希
        const [users] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
        const user = users[0];

        // 如果找不到用户或用户没有密码哈希（例如，通过OAuth注册），则拒绝操作
        if (!user || !user.password_hash) {
            return res.status(403).json({ message: '此账户不支持密码更改。' });
        }

        // 2. 验证旧密码
        const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: '旧密码错误。' });
        }

        // 3. 哈希并更新新密码
        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);
        await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newPasswordHash, userId]);

        res.json({ message: '密码更改成功！' });

    } catch (error) {
        console.error('Change password failed:', error);
        res.status(500).json({ message: '服务器内部错误。' });
    }
});

module.exports = router;
