    const jwt = require('jsonwebtoken');
    const { JWT_SECRET } = require('./config');

    const authenticateToken = (req, res, next) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token == null) {
            return res.sendStatus(401); // Unauthorized
        }

        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                console.error('JWT Verification Error:', err);
                return res.sendStatus(403); // Forbidden
            }
            req.user = user;
            next();
        });
    };

    module.exports = authenticateToken;
    
