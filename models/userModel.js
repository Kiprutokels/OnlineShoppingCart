import { pool } from '../config/database.js';

class UserModel {
    async findByEmail(email) {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        return rows.length ? rows[0] : null;
    }

    async findByUsername(username) {
        const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        return rows.length ? rows[0] : null;
    }

    async create(userData) {
        const { username, email, password_hash } = userData;

        const [result] = await pool.query(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            [username, email, password_hash]
        );

        return result.insertId;
    }

    async findById(userId) {
        const [rows] = await pool.query('SELECT * FROM users WHERE user_id = ?', [userId]);
        return rows.length ? rows[0] : null;
    }

    async getProfile(userId) {
        const [rows] = await pool.query(
            'SELECT user_id, username, email, first_name, last_name, phone, date_of_birth, gender, is_active, email_verified, created_at FROM users WHERE user_id = ?',
            [userId]
        );

        return rows.length ? rows[0] : null;
    }

    async updateProfile(userId, userData) {
        const { first_name, last_name, phone, date_of_birth, gender } = userData;

        const [result] = await pool.query(
            'UPDATE users SET first_name = ?, last_name = ?, phone = ?, date_of_birth = ?, gender = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
            [first_name, last_name, phone, date_of_birth, gender, userId]
        );

        return result.affectedRows > 0;
    }

    async updatePassword(userId, password_hash) {
        const [result] = await pool.query(
            'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
            [password_hash, userId]
        );

        return result.affectedRows > 0;
    }

    async getUserPassword(userId) {
        const [rows] = await pool.query(
            'SELECT password_hash FROM users WHERE user_id = ?',
            [userId]
        );

        return rows.length ? rows[0].password_hash : null;
    }

    async getAllUsers() {
        const [rows] = await pool.query(
            'SELECT user_id, username, email, first_name, last_name, is_active, email_verified, created_at FROM users ORDER BY created_at DESC'
        );

        return rows;
    }

    async updateUserStatus(userId, is_active) {
        const [result] = await pool.query(
            'UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
            [is_active, userId]
        );
        return result.affectedRows > 0;
    }

    async verifyEmail(userId) {
        const [result] = await pool.query(
            'UPDATE users SET email_verified = TRUE, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
            [userId]
        );
        return result.affectedRows > 0;
    }

    async deleteUser(userId) {
        const [result] = await pool.query(
            'DELETE FROM users WHERE user_id = ?',
            [userId]
        );
        return result.affectedRows > 0;
    }

    async getUserName(userId) {
        const [rows] = await pool.query(
            'SELECT username, first_name, last_name FROM users WHERE user_id = ?',
            [userId]
        );

        return rows.length ? rows[0] : null;
    }
}

export default new UserModel();