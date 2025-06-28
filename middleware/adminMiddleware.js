import userModel from '../models/userModel.js';

const adminMiddleware = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        // Get user details to check admin role
        const user = await userModel.findById(userId);

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        // Check if user has admin role
        if (user.role !== 'admin') {
            return res.status(403).json({ 
                message: 'Access denied. Admin privileges required.' 
            });
        }

        // Add admin info to request
        req.admin = {
            userId: user.user_id,
            username: user.username,
            email: user.email,
            role: user.role
        };

        next();

    } catch (error) {
        console.error('Admin middleware error:', error);
        return res.status(500).json({ 
            message: 'Authorization check failed' 
        });
    }
};

export default adminMiddleware;