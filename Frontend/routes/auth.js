// /home/jiankang/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { JWT_SECRET } = require('../config'); // 【修改】从config文件导入
const router = express.Router();

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

module.exports = router;
