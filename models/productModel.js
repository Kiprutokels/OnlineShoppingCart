import { pool } from '../config/database.js';

class ProductModel {
    // Get all products with filters and pagination
    async getAllWithFilters(filters = {}, page = 1, limit = 50) {
        try {
            let query = `
                SELECT 
                    id,
                    name,
                    image_url,
                    category,
                    subcategory,
                    description,
                    price,
                    is_high_price,
                    is_low_price,
                    is_newest,
                    is_popular,
                    discount_percent,
                    discount_start,
                    discount_end,
                    stock_quantity,
                    status,
                    created_at,
                    updated_at
                FROM products
                WHERE 1=1
            `;
            
            const queryParams = [];
            
            // Apply filters
            if (filters.category) {
                query += ' AND category = ?';
                queryParams.push(filters.category);
            }
            
            if (filters.status) {
                query += ' AND status = ?';
                queryParams.push(filters.status);
            }
            
            if (filters.search) {
                query += ' AND (name LIKE ? OR description LIKE ? OR category LIKE ?)';
                const searchTerm = `%${filters.search}%`;
                queryParams.push(searchTerm, searchTerm, searchTerm);
            }
            
            // Count total records for pagination
            const countQuery = query.replace('SELECT id,name,image_url,category,subcategory,description,price,is_high_price,is_low_price,is_newest,is_popular,discount_percent,discount_start,discount_end,stock_quantity,status,created_at,updated_at', 'SELECT COUNT(*) as total');
            const [countResult] = await pool.execute(countQuery, queryParams);
            const total = countResult[0].total;
            
            // Add pagination
            const offset = (page - 1) * limit;
            query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
            queryParams.push(limit, offset);
            
            const [products] = await pool.execute(query, queryParams);
            
            return {
                products,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            };
            
        } catch (error) {
            console.error('Get all products with filters error:', error);
            throw error;
        }
    }

    // Get product by ID
    async findById(id) {
        try {
            const query = `
                SELECT 
                    id,
                    name,
                    image_url,
                    category,
                    subcategory,
                    description,
                    price,
                    is_high_price,
                    is_low_price,
                    is_newest,
                    is_popular,
                    discount_percent,
                    discount_start,
                    discount_end,
                    stock_quantity,
                    status,
                    created_at,
                    updated_at
                FROM products 
                WHERE id = ?
            `;
            
            const [result] = await pool.execute(query, [id]);
            return result[0] || null;
            
        } catch (error) {
            console.error('Find product by ID error:', error);
            throw error;
        }
    }

    // Create new product
    async create(productData) {
        try {
            const query = `
                INSERT INTO products (
                    name,
                    image_url,
                    category,
                    subcategory,
                    description,
                    price,
                    is_high_price,
                    is_low_price,
                    is_newest,
                    is_popular,
                    discount_percent,
                    discount_start,
                    discount_end,
                    stock_quantity,
                    status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const values = [
                productData.name,
                productData.image_url || null,
                productData.category,
                productData.subcategory || null,
                productData.description || null,
                productData.price,
                productData.is_high_price || false,
                productData.is_low_price || false,
                productData.is_newest || false,
                productData.is_popular || false,
                productData.discount_percent || 0,
                productData.discount_start || null,
                productData.discount_end || null,
                productData.stock_quantity || 0,
                productData.status || 'active'
            ];
            
            const [result] = await pool.execute(query, values);
            return result.insertId;
            
        } catch (error) {
            console.error('Create product error:', error);
            throw error;
        }
    }

    // Update product
    async update(id, updateData) {
        try {
            const fields = [];
            const values = [];
            
            // Build dynamic update query
            const allowedFields = [
                'name', 'image_url', 'category', 'subcategory', 'description',
                'price', 'is_high_price', 'is_low_price', 'is_newest', 'is_popular',
                'discount_percent', 'discount_start', 'discount_end', 'stock_quantity', 'status'
            ];
            
            for (const field of allowedFields) {
                if (updateData[field] !== undefined) {
                    fields.push(`${field} = ?`);
                    values.push(updateData[field]);
                }
            }
            
            if (fields.length === 0) {
                throw new Error('No fields to update');
            }
            
            values.push(id);
            
            const query = `
                UPDATE products 
                SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;
            
            const [result] = await pool.execute(query, values);
            return result.affectedRows > 0;
            
        } catch (error) {
            console.error('Update product error:', error);
            throw error;
        }
    }

    // Delete product
    async delete(id) {
        try {
            const query = 'DELETE FROM products WHERE id = ?';
            const [result] = await pool.execute(query, [id]);
            return result.affectedRows > 0;
            
        } catch (error) {
            console.error('Delete product error:', error);
            throw error;
        }
    }

    // Bulk update products
    async bulkUpdate(productIds, updateData) {
        try {
            const fields = [];
            const values = [];
            
            const allowedFields = [
                'category', 'subcategory', 'is_high_price', 'is_low_price', 
                'is_newest', 'is_popular', 'discount_percent', 'status'
            ];
            
            for (const field of allowedFields) {
                if (updateData[field] !== undefined) {
                    fields.push(`${field} = ?`);
                    values.push(updateData[field]);
                }
            }
            
            if (fields.length === 0) {
                throw new Error('No fields to update');
            }
            
            const placeholders = productIds.map(() => '?').join(',');
            values.push(...productIds);
            
            const query = `
                UPDATE products 
                SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
                WHERE id IN (${placeholders})
            `;
            
            const [result] = await pool.execute(query, values);
            return result;
            
        } catch (error) {
            console.error('Bulk update products error:', error);
            throw error;
        }
    }

    // Bulk delete products
    async bulkDelete(productIds) {
        try {
            const placeholders = productIds.map(() => '?').join(',');
            const query = `DELETE FROM products WHERE id IN (${placeholders})`;
            
            const [result] = await pool.execute(query, productIds);
            return result;
            
        } catch (error) {
            console.error('Bulk delete products error:', error);
            throw error;
        }
    }

    // Get total product count
    async getTotalCount() {
        try {
            const query = 'SELECT COUNT(*) as count FROM products';
            const [result] = await pool.execute(query);
            return result[0].count;
            
        } catch (error) {
            console.error('Get total product count error:', error);
            throw error;
        }
    }

    // Get products by category
    async getByCategory(category, limit = 10) {
        try {
            const query = `
                SELECT * FROM products 
                WHERE category = ? AND status = 'active'
                ORDER BY created_at DESC 
                LIMIT ?
            `;
            
            const [result] = await pool.execute(query, [category, limit]);
            return result;
            
        } catch (error) {
            console.error('Get products by category error:', error);
            throw error;
        }
    }

    // Get featured products
    async getFeatured(limit = 10) {
        try {
            const query = `
                SELECT * FROM products 
                WHERE (is_popular = true OR is_newest = true) 
                AND status = 'active'
                ORDER BY created_at DESC 
                LIMIT ?
            `;
            
            const [result] = await pool.execute(query, [limit]);
            return result;
            
        } catch (error) {
            console.error('Get featured products error:', error);
            throw error;
        }
    }

    // Get low stock products
    async getLowStock(threshold = 10) {
        try {
            const query = `
                SELECT * FROM products 
                WHERE stock_quantity <= ? AND stock_quantity > 0
                ORDER BY stock_quantity ASC
            `;
            
            const [result] = await pool.execute(query, [threshold]);
            return result;
            
        } catch (error) {
            console.error('Get low stock products error:', error);
            throw error;
        }
    }

    // Get out of stock products
    async getOutOfStock() {
        try {
            const query = `
                SELECT * FROM products 
                WHERE stock_quantity = 0 OR status = 'out_of_stock'
                ORDER BY updated_at DESC
            `;
            
            const [result] = await pool.execute(query);
            return result;
            
        } catch (error) {
            console.error('Get out of stock products error:', error);
            throw error;
        }
    }

    // Search products
    async search(searchTerm, limit = 20) {
        try {
            const query = `
                SELECT * FROM products 
                WHERE (name LIKE ? OR description LIKE ? OR category LIKE ?)
                AND status = 'active'
                ORDER BY 
                    CASE 
                        WHEN name LIKE ? THEN 1
                        WHEN description LIKE ? THEN 2
                        ELSE 3
                    END,
                    created_at DESC
                LIMIT ?
            `;
            
            const searchPattern = `%${searchTerm}%`;
            const namePattern = `${searchTerm}%`;
            
            const [result] = await pool.execute(query, [
                searchPattern, searchPattern, searchPattern,
                namePattern, searchPattern, limit
            ]);
            
            return result;
            
        } catch (error) {
            console.error('Search products error:', error);
            throw error;
        }
    }

    // Update stock quantity
    async updateStock(id, quantity) {
        try {
            const query = `
                UPDATE products 
                SET stock_quantity = ?,
                    status = CASE 
                        WHEN ? = 0 THEN 'out_of_stock'
                        WHEN ? > 0 AND status = 'out_of_stock' THEN 'active'
                        ELSE status
                    END,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;
            
            const [result] = await pool.execute(query, [quantity, quantity, quantity, id]);
            return result.affectedRows > 0;
            
        } catch (error) {
            console.error('Update stock error:', error);
            throw error;
        }
    }

    // Get product categories
    async getCategories() {
        try {
            const query = `
                SELECT DISTINCT category, COUNT(*) as count
                FROM products 
                WHERE status = 'active'
                GROUP BY category
                ORDER BY category
            `;
            
            const [result] = await pool.execute(query);
            return result;
            
        } catch (error) {
            console.error('Get categories error:', error);
            throw error;
        }
    }
}

export default new ProductModel();