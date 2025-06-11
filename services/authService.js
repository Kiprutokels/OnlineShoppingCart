import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';

class AuthService {
    async signup(userData) {
        const { username, email, password } = userData;

        // Check if username already exists
        const existingUsername = await userModel.findByUsername(username);
        if (existingUsername) {
            throw new Error('Username already exists');
        }

        // Check if email already exists
        const existingEmail = await userModel.findByEmail(email);
        if (existingEmail) {
            throw new Error('Email already in use');
        }

        // Hash the password
        const saltRounds = 12;
        const password_hash = await bcrypt.hash(password, saltRounds);

        // Create user
        const userId = await userModel.create({
            username,
            email,
            password_hash
        });

        return {
            userId,
            username,
            email,
            message: 'User created successfully'
        };
    }

    async login(email, password) {
        // Find user by email
        const user = await userModel.findByEmail(email);
        if (!user) {
            throw new Error('Invalid credentials');
        }

        // Check if user is active
        if (!user.is_active) {
            throw new Error('Account is deactivated. Please contact support.');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            throw new Error('Invalid credentials');
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user.user_id,
                email: user.email,
                username: user.username
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        return {
            token,
            user: {
                userId: user.user_id,
                username: user.username,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                emailVerified: user.email_verified
            }
        };
    }

    async verifyToken(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            const user = await userModel.findById(decoded.userId);

            if (!user || !user.is_active) {
                throw new Error('Invalid token');
            }

            return {
                userId: user.user_id,
                username: user.username,
                email: user.email
            };
        } catch (error) {
            throw new Error('Invalid token');
        }
    }

    async changePassword(userId, currentPassword, newPassword) {
        // Get current password hash
        const currentPasswordHash = await userModel.getUserPassword(userId);
        if (!currentPasswordHash) {
            throw new Error('User not found');
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentPasswordHash);
        if (!isCurrentPasswordValid) {
            throw new Error('Current password is incorrect');
        }

        // Hash new password
        const saltRounds = 12;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        const updated = await userModel.updatePassword(userId, newPasswordHash);
        if (!updated) {
            throw new Error('Failed to update password');
        }

        return { message: 'Password updated successfully' };
    }
}

export default new AuthService();