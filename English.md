Health Hub - Full-Stack Application
Health Hub is a full-stack web application designed to help users track and manage their health and daily life information in one place. From medication schedules to daily task lists, Health Hub provides a comprehensive suite of tools for a healthier, more organized life.

This repository contains two main parts: the backend service and the frontend application.

Backend Service
The backend is built with Node.js and Express, providing a RESTful API for the frontend application.

Features
Provides RESTful APIs for user authentication (register/login).

Offers data endpoints for all core features: medication, stool logs, daily checklists, memos, and finance tracking.

Uses JSON Web Tokens (JWT) for session management.

Tech Stack
Framework: Node.js, Express.js

Database: MySQL

Core Dependencies: mysql2, jsonwebtoken, bcryptjs, cors

Important: Backend Configuration
To run this backend service, you must manually configure the database connection.

1. Database Configuration

Open the db.js file, find the dbConfig object, and replace the placeholder values with your own database credentials.

// File: /db.js
const dbConfig = {
    host: 'YOUR_DATABASE_HOST',
    port: 3306,
    user: 'YOUR_DATABASE_USERNAME',
    password: 'YOUR_DATABASE_PASSWORD',
    database: 'YOUR_DATABASE_NAME',
};

2. JWT Secret Configuration

Open the config.js file and change the value of JWT_SECRET.

// File: /config.js
module.exports = {
    JWT_SECRET: 'please_change_this_to_a_long_random_string'
};

How to Run Backend
Navigate to the backend project's root directory: cd /home/jiankang

Install all dependencies: npm install

Complete the 'Backend Configuration' steps above.

Start the service: npm start

(Production) Run persistently with PM2: pm2 start npm --name "health-hub-backend" -- start

Frontend Application
The frontend is a modern Single-Page Application (SPA) built with Vue.js 3 and Vite.

Features
Responsive design, compatible with both desktop and mobile devices.

Modular SPA architecture using Vue Router.

Dynamic background wallpaper for an enhanced visual experience.

Complete user interfaces for all core features.

Tech Stack
Framework: Vue.js 3 (Composition API)

Build Tool: Vite

Routing: Vue Router

UI: Tailwind CSS

Important: Frontend Configuration
To connect the frontend to the backend service, you need to configure the API's base URL.

Create a .env.local file in the root of the frontend project directory and add the following line, replacing the IP address with your backend server's address.

VITE_API_BASE_URL=[http://129.204.252.237:3000/api](http://129.204.252.237:3000/api)

The application is configured to automatically use this variable.

How to Run Frontend (Local Development)
Navigate to the frontend project's root directory: cd health-hub-frontend

Install all dependencies: npm install

Start the local development server: npm run dev

How to Build & Deploy Frontend
Run the build command: npm run build

A dist folder will be generated.

Upload the entire content of the dist folder to the root directory of your web server.
