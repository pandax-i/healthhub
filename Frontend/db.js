const mysql = require('mysql2/promise');

// 将数据库配置信息直接写回代码中
const dbConfig = {
host: '123456',// 您的数据库地址
port: 123,// 您的数据库端口
user: '123456',// 您的数据库用户名
password: '123456', // 您的数据库密码
database: '123456',// 您的数据库
waitForConnections: true,
connectionLimit: 10,
queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

module.exports = pool;