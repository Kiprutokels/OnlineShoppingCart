import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');

        if (!authHeader) {
            return res.status(401).json({ message: 'Access token is required' });
        }

        const token = authHeader.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'Access token is required' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

        // Check if user still exists and is active
        const user = await userModel.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({ message: 'Invalid token - user not found' });
        }

        if (!user.is_active) {
            return res.status(403).json({ message: 'Account is deactivated' });
        }

        // Add user info to request
        req.user = {
            userId: user.user_id,
            username: user.username,
            email: user.email
        };

        next();

    } catch (error) {
        console.error('Auth middleware error:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token' });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }

        return res.status(500).json({ message: 'Authentication failed' });
    }
};

export default authMiddleware;