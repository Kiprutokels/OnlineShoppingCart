import jwt from 'jsonwebtoken';

export const getUserIdFromToken = (req) => {
    try {
        // Extract the token from the Authorization header
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            throw new Error('No authorization header');
        }

        // Split the header and get the token (assuming "Bearer <token>")
        const token = authHeader.split(' ')[1];
        
        if (!token) {
            throw new Error('No token provided');
        }

        // Verify and decode the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'authentication_token');
        
        return decoded.userId;
    } catch (error) {
        console.error('Error extracting user ID from token:', error);
        throw new Error('Invalid or expired token');
    }
};

// function to generate a token
export const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET || 'authentication_token', {
        expiresIn: '30d' // Token expires in 30 days
    });
};