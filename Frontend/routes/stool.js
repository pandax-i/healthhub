// routes/stool.js
const express = require('express');
const pool = require('../db');
const authenticateToken = require('../authMiddleware');
const router = express.Router();

router.use(authenticateToken);

// 获取所有排便记录
router.get('/', async (req, res) => {
    try {
        const [logs] = await pool.query('SELECT * FROM stool_logs WHERE user_id = ? ORDER BY log_date DESC, id DESC', [req.user.userId]);
        res.json(logs);
    } catch (error) {
        console.error('获取排便记录失败:', error);
        res.status(500).json({ message: '服务器内部错误。' });
    }
});

// 【新增】获取所有有记录的日期，用于日历标记
router.get('/dates', async (req, res) => {
    try {
        const [results] = await pool.query(
            'SELECT DISTINCT log_date FROM stool_logs WHERE user_id = ?', 
            [req.user.userId]
        );
        // 提取并格式化日期字符串 "YYYY-MM-DD"
        const dates = results.map(r => new Date(r.log_date).toISOString().split('T')[0]);
        res.json(dates);
    } catch (error) {
        console.error('获取排便记录日期失败:', error);
        res.status(500).json({ message: '服务器内部错误。' });
    }
});

// 添加一条新记录
router.post('/', async (req, res) => {
    try {
        const { log_date, stool_type, notes } = req.body;
        if (!log_date) {
            return res.status(400).json({ message: '记录日期不能为空。' });
        }
        const [result] = await pool.query(
            'INSERT INTO stool_logs (user_id, log_date, stool_type, notes) VALUES (?, ?, ?, ?)',
            [req.user.userId, log_date, stool_type, notes]
        );
        // 返回新创建的完整记录
        const [[newLog]] = await pool.query('SELECT * FROM stool_logs WHERE id = ?', [result.insertId]);
        res.status(201).json(newLog);
    } catch (error) {
        console.error('添加排便记录失败:', error);
        res.status(500).json({ message: '服务器内部错误。' });
    }
});

// 【新增】更新一条已存在的记录
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { log_date, stool_type, notes } = req.body;
        if (!log_date) {
            return res.status(400).json({ message: '记录日期不能为空。' });
        }
        await pool.query(
            'UPDATE stool_logs SET log_date = ?, stool_type = ?, notes = ? WHERE id = ? AND user_id = ?',
            [log_date, stool_type, notes, id, req.user.userId]
        );
        const [[updatedLog]] = await pool.query('SELECT * FROM stool_logs WHERE id = ?', [id]);
        res.json(updatedLog);
    } catch (error) {
        console.error('更新排便记录失败:', error);
        res.status(500).json({ message: '服务器内部错误。' });
    }
});


// 删除一条记录
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM stool_logs WHERE id = ? AND user_id = ?', [id, req.user.userId]);
        res.status(204).send();
    } catch (error) {
        console.error('删除排便记录失败:', error);
        res.status(500).json({ message: '服务器内部错误。' });
    }
});


module.exports = router;
