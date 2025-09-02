// routes/medications.js
const express = require('express');
const pool = require('../db');
const authenticateToken = require('../authMiddleware');
const router = express.Router();

router.use(authenticateToken);

// 获取用药记录
router.get('/', async (req, res) => {
    try {
        const [meds] = await pool.query('SELECT * FROM medications WHERE user_id = ? ORDER BY id DESC', [req.user.userId]);
        res.json(meds);
    } catch (error) {
        console.error('获取用药记录失败:', error);
        res.status(500).json({ message: '服务器内部错误。' });
    }
});

// 添加用药记录
router.post('/', async (req, res) => {
    try {
        // 【修改】接收新的 medication_times 字段
        const { name, dosage, frequency, stock, medication_times } = req.body;
        if (!name) {
            return res.status(400).json({ message: '药品名称不能为空。' });
        }
        const [result] = await pool.query(
            'INSERT INTO medications (user_id, name, dosage, frequency, stock, medication_times) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.userId, name, dosage, frequency, stock, medication_times]
        );
        res.status(201).json({ message: '添加成功', id: result.insertId });
    } catch (error) {
        console.error('添加用药记录失败:', error);
        res.status(500).json({ message: '服务器内部错误。' });
    }
});

// 更新用药记录 (这个接口现在主要用于编辑计划，而不是服用)
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, dosage, frequency, stock, medication_times } = req.body;
        await pool.query(
            'UPDATE medications SET name = ?, dosage = ?, frequency = ?, stock = ?, medication_times = ? WHERE id = ? AND user_id = ?',
            [name, dosage, frequency, stock, medication_times, id, req.user.userId]
        );
        res.json({ message: '更新成功' });
    } catch (error) {
        console.error('更新用药记录失败:', error);
        res.status(500).json({ message: '服务器内部错误。' });
    }
});

// 删除用药记录
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM medications WHERE id = ? AND user_id = ?', [id, req.user.userId]);
        res.json({ message: '删除成功' });
    } catch (error) {
        console.error('删除用药记录失败:', error);
        res.status(500).json({ message: '服务器内部错误。' });
    }
});

// 【新增】服用药品并记录时间的接口
router.post('/:id/take', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { id } = req.params;
        const { dosageAmount } = req.body;

        await connection.beginTransaction();

        // 1. 扣减库存
        await connection.query(
            'UPDATE medications SET stock = stock - ? WHERE id = ? AND user_id = ? AND stock >= ?',
            [dosageAmount, id, req.user.userId, dosageAmount]
        );

        // 2. 插入服药记录
        await connection.query(
            'INSERT INTO medication_logs (user_id, medication_id) VALUES (?, ?)',
            [req.user.userId, id]
        );

        await connection.commit();
        res.status(201).json({ message: '服药记录成功' });
    } catch (error) {
        await connection.rollback();
        console.error('服药操作失败:', error);
        res.status(500).json({ message: '服务器内部错误。' });
    } finally {
        connection.release();
    }
});

// 【新增】获取指定药品的服药历史记录
router.get('/:id/logs', async (req, res) => {
    try {
        const { id } = req.params;
        const [logs] = await pool.query(
            'SELECT * FROM medication_logs WHERE medication_id = ? AND user_id = ? ORDER BY taken_at DESC',
            [id, req.user.userId]
        );
        res.json(logs);
    } catch (error) {
        console.error('获取服药历史失败:', error);
        res.status(500).json({ message: '服务器内部错误。' });
    }
});


module.exports = router;
