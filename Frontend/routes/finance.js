// routes/finance.js
const express = require('express');
const pool = require('../db');
const authenticateToken = require('../authMiddleware');
const router = express.Router();

router.use(authenticateToken);

// --- 账户管理 ---
router.get('/accounts', async (req, res) => {
    try {
        const [accounts] = await pool.query('SELECT * FROM accounts WHERE user_id = ?', [req.user.userId]);
        const [transactions] = await pool.query('SELECT account_id, transaction_type, SUM(amount) as total FROM transactions WHERE user_id = ? GROUP BY account_id, transaction_type', [req.user.userId]);
        
        const balanceMap = {};
        transactions.forEach(t => {
            if (!balanceMap[t.account_id]) balanceMap[t.account_id] = 0;
            if (t.transaction_type === 'income') {
                balanceMap[t.account_id] += parseFloat(t.total);
            } else {
                balanceMap[t.account_id] -= parseFloat(t.total);
            }
        });

        const accountsWithBalance = accounts.map(acc => ({
            ...acc,
            current_balance: parseFloat(acc.initial_balance) + (balanceMap[acc.id] || 0)
        }));
        
        res.json(accountsWithBalance);
    } catch (error) {
        res.status(500).json({ message: '获取账户失败', error: error.message });
    }
});

router.post('/accounts', async (req, res) => {
    try {
        const { account_name, initial_balance } = req.body;
        const [result] = await pool.query('INSERT INTO accounts (user_id, account_name, initial_balance) VALUES (?, ?, ?)', [req.user.userId, account_name, initial_balance]);
        const [[newAccount]] = await pool.query('SELECT * FROM accounts WHERE id = ?', [result.insertId]);
        res.status(201).json({ ...newAccount, current_balance: parseFloat(newAccount.initial_balance) });
    } catch (error) {
        res.status(500).json({ message: '创建账户失败', error: error.message });
    }
});

// --- 交易记录 ---
router.get('/transactions', async (req, res) => {
    try {
        const [transactions] = await pool.query('SELECT t.*, a.account_name FROM transactions t JOIN accounts a ON t.account_id = a.id WHERE t.user_id = ? ORDER BY t.transaction_date DESC, t.id DESC', [req.user.userId]);
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: '获取交易记录失败', error: error.message });
    }
});

router.post('/transactions', async (req, res) => {
    try {
        const { account_id, transaction_type, amount, category, notes, transaction_date } = req.body;
        const [result] = await pool.query('INSERT INTO transactions (user_id, account_id, transaction_type, amount, category, notes, transaction_date) VALUES (?, ?, ?, ?, ?, ?, ?)', [req.user.userId, account_id, transaction_type, amount, category, notes, transaction_date]);
        const [[newTransaction]] = await pool.query('SELECT * FROM transactions WHERE id = ?', [result.insertId]);
        res.status(201).json(newTransaction);
    } catch (error) {
        res.status(500).json({ message: '创建交易失败', error: error.message });
    }
});

// --- 借还款 ---
router.get('/loans', async (req, res) => {
    try {
        const [loans] = await pool.query('SELECT * FROM loans WHERE user_id = ? ORDER BY loan_date DESC', [req.user.userId]);
        res.json(loans);
    } catch (error) {
        res.status(500).json({ message: '获取借贷记录失败', error: error.message });
    }
});

router.post('/loans', async (req, res) => {
    try {
        const { loan_type, person_name, amount, notes, loan_date } = req.body;
        const [result] = await pool.query('INSERT INTO loans (user_id, loan_type, person_name, amount, notes, loan_date) VALUES (?, ?, ?, ?, ?, ?)', [req.user.userId, loan_type, person_name, amount, notes, loan_date]);
        const [[newLoan]] = await pool.query('SELECT * FROM loans WHERE id = ?', [result.insertId]);
        res.status(201).json(newLoan);
    } catch (error) {
        res.status(500).json({ message: '创建借贷记录失败', error: error.message });
    }
});

router.put('/loans/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const repayment_date = status === 'paid' ? new Date() : null;
        await pool.query('UPDATE loans SET status = ?, repayment_date = ? WHERE id = ? AND user_id = ?', [status, repayment_date, id, req.user.userId]);
        res.json({ message: '借贷状态已更新' });
    } catch (error) {
        res.status(500).json({ message: '更新借贷状态失败', error: error.message });
    }
});


module.exports = router;
