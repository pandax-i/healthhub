    const express = require('express');
    const cors = require('cors');

    // 引入路由文件
    const authRoutes = require('./routes/auth');
    const medicationRoutes = require('./routes/medications');
    const stoolRoutes = require('./routes/stool');
    const dailyRoutes = require('./routes/daily');
    const memoRoutes = require('./routes/memos');
    const financeRoutes = require('./routes/finance');

    // 初始化 Express 应用
    const app = express();
    app.use(cors());
    app.use(express.json());

    // 注册路由
    app.use('/api', authRoutes); 
    app.use('/api/medications', medicationRoutes); 
    app.use('/api/stool-logs', stoolRoutes);
    app.use('/api/daily-logs', dailyRoutes);
    app.use('/api/memos', memoRoutes);
    app.use('/api/finance', financeRoutes);

    // 启动服务器
    const PORT = 3000;
    app.listen(PORT, () => {
        console.log(`后端服务已启动 (模块化)，运行在 http://localhost:${PORT}`);
    });