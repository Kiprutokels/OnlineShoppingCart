import authService from '../services/authService.js';
import userModel from '../models/userModel.js';

class AuthController {
    async signup(req, res) {
        try {
            const { username, email, password } = req.body;

            // Validate required fields
            if (!username || !email || !password) {
                return res.status(400).json({
                    message: 'Username, email, and password are required'
                });
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    message: 'Please provide a valid email address'
                });
            }

            // Validate password length
            if (password.length < 6) {
                return res.status(400).json({
                    message: 'Password must be at least 6 characters long'
                });
            }

            // Validate username (no spaces, minimum length)
            if (username.length < 3) {
                return res.status(400).json({
                    message: 'Username must be at least 3 characters long'
                });
            }

            if (username.includes(' ')) {
                return res.status(400).json({
                    message: 'Username cannot contain spaces'
                });
            }

            // Create new user
            const result = await authService.signup({
                username: username.toLowerCase(),
                email: email.toLowerCase(),
                password
            });

            res.status(201).json({
                message: 'Registration successful',
                userId: result.userId,
                username: result.username,
                email: result.email
            });

        } catch (error) {
            console.error('Signup error:', error);

            // Handle specific errors
            if (error.message === 'Username already exists') {
                return res.status(409).json({ message: 'Username already exists' });
            }

            if (error.message === 'Email already in use') {
                return res.status(409).json({ message: 'Email already in use' });
            }

            res.status(500).json({
                message: 'Registration failed. Please try again later.'
            });
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;

            // Validate required fields
            if (!email || !password) {
                return res.status(400).json({
                    message: 'Email and password are required'
                });
            }

            // Authenticate user
            const result = await authService.login(email.toLowerCase(), password);

            res.status(200).json({
                message: 'Login successful',
                token: result.token,
                user: result.user
            });

        } catch (error) {
            console.error('Login error:', error);

            if (error.message === 'Invalid credentials') {
                return res.status(401).json({ message: 'Invalid email or password' });
            }

            if (error.message === 'Account is deactivated. Please contact support.') {
                return res.status(403).json({ message: error.message });
            }

            res.status(500).json({
                message: 'Login failed. Please try again later.'
            });
        }
    }

    async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;
            const userId = req.user.userId; // From auth middleware

            // Validate required fields
            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    message: 'Current password and new password are required'
                });
            }

            // Validate new password length
            if (newPassword.length < 6) {
                return res.status(400).json({
                    message: 'New password must be at least 6 characters long'
                });
            }

            const result = await authService.changePassword(userId, currentPassword, newPassword);

            res.status(200).json(result);

        } catch (error) {
            console.error('Change password error:', error);

            if (error.message === 'Current password is incorrect') {
                return res.status(400).json({ message: error.message });
            }

            if (error.message === 'User not found') {
                return res.status(404).json({ message: error.message });
            }

            res.status(500).json({
                message: 'Failed to change password. Please try again later.'
            });
        }
    }

    async getProfile(req, res) {
        try {
            const userId = req.user.userId;

            const user = await userModel.getProfile(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.status(200).json({
                user: {
                    userId: user.user_id,
                    username: user.username,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    phone: user.phone,
                    dateOfBirth: user.date_of_birth,
                    gender: user.gender,
                    emailVerified: user.email_verified,
                    isActive: user.is_active,
                    createdAt: user.created_at
                }
            });

        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({
                message: 'Failed to get profile. Please try again later.'
            });
        }
    }
}

export default new AuthController();