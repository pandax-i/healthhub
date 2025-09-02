# healthhub
Health Hub (健康枢纽) 是一个全栈Web应用程序，一站式地记录和管理健康与生活信息。从用药计划到每日清单，健康枢纽提供了一套全面的工具，助您开启更有条理的健康生活。
健康生活管理平台 - 前端应用
这是健康生活管理平台的前端应用，基于 Vue.js 3 和 Vite 构建。
功能特性
响应式布局，适配桌面和移动设备。
模块化的单页应用 (SPA) 架构。
动态背景壁纸，提升视觉体验。
完整实现了用药、排便、清单、备忘录、记账等所有核心功能的用户界面。
技术栈
框架: Vue.js 3 (Composition API)
构建工具: Vite
路由: Vue Router
UI: Tailwind CSS
重要：项目配置
为了让前端应用能正确连接到后端服务，您需要配置 API 的基础地址。
请打开 src/views/ 目录下所有视图文件（如 LoginView.vue, MedicationView.vue 等），找到 API_BASE_URL 常量，并将其修改为您后端服务的实际地址。
// 示例文件路径: /src/views/LoginView.vue
const API_BASE_URL = 'http://YOUR_SERVER_IP:3000/api'; // 将 YOUR_SERVER_IP 替换为后端服务器的IP或域名
如何本地开发
克隆或下载此仓库。
进入项目根目录: cd health-hub-frontend
安装所有依赖: npm install
完成上述“项目配置”步骤。
启动本地开发服务器: npm run dev
如何打包部署
执行打包命令: npm run build
打包完成后，会生成一个 dist 文件夹。
将 dist 文件夹内的所有内容上传到您的 Web 服务器的网站根目录。

Health Hub (健康枢纽) - 后端服务
功能特性
提供 RESTful API 用于用户认证（注册/登录）。
为用药、排便、清单、备忘录、记账等所有核心功能提供数据接口。
使用 JWT (JSON Web Tokens) 进行用户会话管理。
技术栈
框架: Node.js, Express.js
数据库: MySQL
核心依赖: mysql2, jsonwebtoken, bcryptjs, cors
重要：项目配置
为了让此后端服务正常运行，您必须手动配置数据库连接信息。
1. 数据库配置
请打开 db.js 文件，找到 dbConfig 对象，然后将占位符替换为您自己的数据库信息。
// 文件路径: /db.js
const dbConfig = {
    host: 'YOUR_DATABASE_HOST',         // 替换为您的数据库地址
    port: 3306,                        // 替换为您的数据库端口
    user: 'YOUR_DATABASE_USERNAME',    // 替换为您的数据库用户名
    password: 'YOUR_DATABASE_PASSWORD',  // 替换为您的数据库密码
    database: 'YOUR_DATABASE_NAME',    // 替换为您的数据库名称
    // ... 其他配置
};
2. JWT 密钥配置
请打开 config.js 文件，修改 JWT_SECRET 的值。这是一个用于加密用户令牌的密钥，请确保它足够复杂和独特。
// 文件路径: /config.js
module.exports = {
    JWT_SECRET: 'please_change_this_to_a_long_random_string' // 替换为您自己的密钥
};
如何运行
克隆或下载此仓库。
进入项目根目录: cd /home/jiankang
安装所有依赖: npm install
完成上述“项目配置”步骤。
启动服务: npm start
(生产环境) 使用 PM2 持久化运行: pm2 start npm --name "health-hub-backend" -- start
