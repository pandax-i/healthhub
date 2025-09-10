const mysql = require('mysql2/promise');

// 请在这里填入你自己的数据库配置信息
const dbConfig = {
host: 'your_database_host',
port: 3306, // 你的数据库端口, e.g., 3306
user: 'your_database_user',
password: 'your_database_password', // 您的数据库密码
database: 'your_database_name',
waitForConnections: true,
connectionLimit: 10,
queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

module.exports = pool;