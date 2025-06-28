import { pool } from '../config/database.js';

class OrderModel {
    // Get total order count
    async getTotalCount() {
        try {
            const query = 'SELECT COUNT(*) as count FROM orders';
            const [result] = await pool.execute(query);
            return result[0].count;
        } catch (error) {
            console.error('Get total order count error:', error);
            return 0;
        }
    }

    // Get monthly revenue
    async getMonthlyRevenue() {
        try {
            const query = `
                SELECT COALESCE(SUM(total_amount), 0) as revenue
                FROM orders 
                WHERE DATE_FORMAT(created_at, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')
                AND status != 'cancelled'
            `;
            const [result] = await pool.execute(query);
            return result[0].revenue;
        } catch (error) {
            console.error('Get monthly revenue error:', error);
            return 0;
        }
    }

    // Get all orders with pagination
    async getAllOrders(page = 1, limit = 10, filters = {}) {
        try {
            const offset = (page - 1) * limit;
            let query = `
                SELECT o.*, u.username, u.email 
                FROM orders o
                LEFT JOIN users u ON o.user_id = u.id
            `;
            let countQuery = 'SELECT COUNT(*) as total FROM orders o';
            let conditions = [];
            let params = [];

            // Apply filters
            if (filters.status) {
                conditions.push('o.status = ?');
                params.push(filters.status);
            }
            if (filters.userId) {
                conditions.push('o.user_id = ?');
                params.push(filters.userId);
            }
            if (filters.dateFrom) {
                conditions.push('o.created_at >= ?');
                params.push(filters.dateFrom);
            }
            if (filters.dateTo) {
                conditions.push('o.created_at <= ?');
                params.push(filters.dateTo);
            }

            if (conditions.length > 0) {
                const whereClause = ' WHERE ' + conditions.join(' AND ');
                query += whereClause;
                countQuery += whereClause;
            }

            query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const [orders] = await pool.execute(query, params);
            const [countResult] = await pool.execute(countQuery, params.slice(0, -2));

            return {
                orders,
                total: countResult[0].total,
                page,
                limit,
                totalPages: Math.ceil(countResult[0].total / limit)
            };
        } catch (error) {
            console.error('Get all orders error:', error);
            throw error;
        }
    }

    // Get order by ID with items
    async getOrderById(orderId) {
        try {
            const orderQuery = `
                SELECT o.*, u.username, u.email, u.phone
                FROM orders o
                LEFT JOIN users u ON o.user_id = u.id
                WHERE o.id = ?
            `;
            const [orderResult] = await pool.execute(orderQuery, [orderId]);

            if (orderResult.length === 0) {
                return null;
            }

            const order = orderResult[0];

            // Get order items
            const itemsQuery = `
                SELECT oi.*, p.name as product_name, p.image as product_image
                FROM order_items oi
                LEFT JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = ?
            `;
            const [items] = await pool.execute(itemsQuery, [orderId]);

            order.items = items;
            return order;
        } catch (error) {
            console.error('Get order by ID error:', error);
            throw error;
        }
    }

    // Create new order
    async createOrder(orderData) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Insert order
            const orderQuery = `
                INSERT INTO orders (
                    user_id, total_amount, status, payment_method, 
                    payment_status, shipping_address, billing_address,
                    notes, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `;
            
            const [orderResult] = await connection.execute(orderQuery, [
                orderData.user_id,
                orderData.total_amount,
                orderData.status || 'pending',
                orderData.payment_method,
                orderData.payment_status || 'pending',
                JSON.stringify(orderData.shipping_address),
                JSON.stringify(orderData.billing_address),
                orderData.notes || null
            ]);

            const orderId = orderResult.insertId;

            // Insert order items
            if (orderData.items && orderData.items.length > 0) {
                const itemsQuery = `
                    INSERT INTO order_items (
                        order_id, product_id, quantity, price, subtotal
                    ) VALUES ?
                `;
                
                const itemsData = orderData.items.map(item => [
                    orderId,
                    item.product_id,
                    item.quantity,
                    item.price,
                    item.quantity * item.price
                ]);

                await connection.query(itemsQuery, [itemsData]);
            }

            await connection.commit();
            return orderId;
        } catch (error) {
            await connection.rollback();
            console.error('Create order error:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    // Update order status
    async updateOrderStatus(orderId, status, notes = null) {
        try {
            const query = `
                UPDATE orders 
                SET status = ?, updated_at = NOW()
                ${notes ? ', notes = ?' : ''}
                WHERE id = ?
            `;
            
            const params = notes ? [status, notes, orderId] : [status, orderId];
            const [result] = await pool.execute(query, params);
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Update order status error:', error);
            throw error;
        }
    }

    // Update payment status
    async updatePaymentStatus(orderId, paymentStatus) {
        try {
            const query = `
                UPDATE orders 
                SET payment_status = ?, updated_at = NOW()
                WHERE id = ?
            `;
            const [result] = await pool.execute(query, [paymentStatus, orderId]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Update payment status error:', error);
            throw error;
        }
    }

    // Get orders by user ID
    async getOrdersByUserId(userId, page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;
            const query = `
                SELECT * FROM orders 
                WHERE user_id = ? 
                ORDER BY created_at DESC 
                LIMIT ? OFFSET ?
            `;
            const countQuery = 'SELECT COUNT(*) as total FROM orders WHERE user_id = ?';

            const [orders] = await pool.execute(query, [userId, limit, offset]);
            const [countResult] = await pool.execute(countQuery, [userId]);

            return {
                orders,
                total: countResult[0].total,
                page,
                limit,
                totalPages: Math.ceil(countResult[0].total / limit)
            };
        } catch (error) {
            console.error('Get orders by user ID error:', error);
            throw error;
        }
    }

    // Get order statistics
    async getOrderStats(dateRange = 30) {
        try {
            const query = `
                SELECT 
                    COUNT(*) as total_orders,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
                    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
                    COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total_amount END), 0) as total_revenue,
                    COALESCE(AVG(CASE WHEN status != 'cancelled' THEN total_amount END), 0) as average_order_value
                FROM orders 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            `;
            
            const [result] = await pool.execute(query, [dateRange]);
            return result[0];
        } catch (error) {
            console.error('Get order stats error:', error);
            throw error;
        }
    }

    // Delete order (soft delete by marking as cancelled)
    async deleteOrder(orderId) {
        try {
            const query = `
                UPDATE orders 
                SET status = 'cancelled', updated_at = NOW()
                WHERE id = ? AND status IN ('pending', 'processing')
            `;
            const [result] = await pool.execute(query, [orderId]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Delete order error:', error);
            throw error;
        }
    }

    // Get recent orders
    async getRecentOrders(limit = 5) {
        try {
            const query = `
                SELECT o.*, u.username, u.email
                FROM orders o
                LEFT JOIN users u ON o.user_id = u.id
                ORDER BY o.created_at DESC
                LIMIT ?
            `;
            const [orders] = await pool.execute(query, [limit]);
            return orders;
        } catch (error) {
            console.error('Get recent orders error:', error);
            return [];
        }
    }

    // Search orders
    async searchOrders(searchTerm, page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;
            const query = `
                SELECT o.*, u.username, u.email
                FROM orders o
                LEFT JOIN users u ON o.user_id = u.id
                WHERE o.id LIKE ? 
                   OR u.username LIKE ? 
                   OR u.email LIKE ?
                   OR o.status LIKE ?
                ORDER BY o.created_at DESC
                LIMIT ? OFFSET ?
            `;
            
            const searchPattern = `%${searchTerm}%`;
            const params = [searchPattern, searchPattern, searchPattern, searchPattern, limit, offset];
            
            const [orders] = await pool.execute(query, params);
            
            const countQuery = `
                SELECT COUNT(*) as total
                FROM orders o
                LEFT JOIN users u ON o.user_id = u.id
                WHERE o.id LIKE ? 
                   OR u.username LIKE ? 
                   OR u.email LIKE ?
                   OR o.status LIKE ?
            `;
            
            const [countResult] = await pool.execute(countQuery, [searchPattern, searchPattern, searchPattern, searchPattern]);

            return {
                orders,
                total: countResult[0].total,
                page,
                limit,
                totalPages: Math.ceil(countResult[0].total / limit)
            };
        } catch (error) {
            console.error('Search orders error:', error);
            throw error;
        }
    }
}

export default new OrderModel();