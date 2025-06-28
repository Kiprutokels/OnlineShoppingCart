import productModel from '../models/productModel.js';
import orderModel from '../models/orderModel.js';
import userModel from '../models/userModel.js';

class AdminController {
    // Dashboard Statistics
    async getStats(req, res) {
        try {
            const stats = await Promise.all([
                productModel.getTotalCount(),
                orderModel.getTotalCount(),
                userModel.getActiveCustomerCount(),
                orderModel.getMonthlyRevenue()
            ]);

            res.status(200).json({
                totalProducts: stats[0],
                totalOrders: stats[1],
                totalCustomers: stats[2],
                totalRevenue: stats[3] || 0
            });

        } catch (error) {
            console.error('Get stats error:', error);
            res.status(500).json({
                message: 'Failed to fetch dashboard stats'
            });
        }
    }

    // Product Management
    async getAllProducts(req, res) {
        try {
            const { page = 1, limit = 50, category, status, search } = req.query;
            
            const filters = {};
            if (category) filters.category = category;
            if (status) filters.status = status;
            if (search) filters.search = search;

            const result = await productModel.getAllWithFilters(
                filters,
                parseInt(page),
                parseInt(limit)
            );

            res.status(200).json({
                products: result.products,
                pagination: result.pagination
            });

        } catch (error) {
            console.error('Get all products error:', error);
            res.status(500).json({
                message: 'Failed to fetch products'
            });
        }
    }

    async getProductById(req, res) {
        try {
            const { id } = req.params;
            const product = await productModel.findById(id);

            if (!product) {
                return res.status(404).json({
                    message: 'Product not found'
                });
            }

            res.status(200).json({ product });

        } catch (error) {
            console.error('Get product by ID error:', error);
            res.status(500).json({
                message: 'Failed to fetch product'
            });
        }
    }

    async createProduct(req, res) {
        try {
            const productData = req.body;

            // Validate required fields
            const requiredFields = ['name', 'category', 'price', 'stock_quantity'];
            const missingFields = requiredFields.filter(field => !productData[field]);

            if (missingFields.length > 0) {
                return res.status(400).json({
                    message: `Missing required fields: ${missingFields.join(', ')}`
                });
            }

            // Validate price and stock
            if (productData.price <= 0) {
                return res.status(400).json({
                    message: 'Price must be greater than 0'
                });
            }

            if (productData.stock_quantity < 0) {
                return res.status(400).json({
                    message: 'Stock quantity cannot be negative'
                });
            }

            // Set status based on stock if not provided
            if (!productData.status) {
                productData.status = productData.stock_quantity > 0 ? 'active' : 'out_of_stock';
            }

            const productId = await productModel.create(productData);
            const newProduct = await productModel.findById(productId);

            res.status(201).json({
                message: 'Product created successfully',
                product: newProduct
            });

        } catch (error) {
            console.error('Create product error:', error);
            
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({
                    message: 'Product with this name already exists'
                });
            }

            res.status(500).json({
                message: 'Failed to create product'
            });
        }
    }

    async updateProduct(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            // Check if product exists
            const existingProduct = await productModel.findById(id);
            if (!existingProduct) {
                return res.status(404).json({
                    message: 'Product not found'
                });
            }

            // Validate price and stock if provided
            if (updateData.price !== undefined && updateData.price <= 0) {
                return res.status(400).json({
                    message: 'Price must be greater than 0'
                });
            }

            if (updateData.stock_quantity !== undefined && updateData.stock_quantity < 0) {
                return res.status(400).json({
                    message: 'Stock quantity cannot be negative'
                });
            }

            // Auto-update status based on stock
            if (updateData.stock_quantity !== undefined) {
                if (updateData.stock_quantity === 0 && existingProduct.status !== 'inactive') {
                    updateData.status = 'out_of_stock';
                } else if (updateData.stock_quantity > 0 && existingProduct.status === 'out_of_stock') {
                    updateData.status = 'active';
                }
            }

            await productModel.update(id, updateData);
            const updatedProduct = await productModel.findById(id);

            res.status(200).json({
                message: 'Product updated successfully',
                product: updatedProduct
            });

        } catch (error) {
            console.error('Update product error:', error);
            res.status(500).json({
                message: 'Failed to update product'
            });
        }
    }

    async deleteProduct(req, res) {
        try {
            const { id } = req.params;

            // Check if product exists
            const product = await productModel.findById(id);
            if (!product) {
                return res.status(404).json({
                    message: 'Product not found'
                });
            }

            await productModel.delete(id);

            res.status(200).json({
                message: 'Product deleted successfully'
            });

        } catch (error) {
            console.error('Delete product error:', error);
            res.status(500).json({
                message: 'Failed to delete product'
            });
        }
    }

    async bulkUpdateProducts(req, res) {
        try {
            const { productIds, updateData } = req.body;

            if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
                return res.status(400).json({
                    message: 'Product IDs array is required'
                });
            }

            const results = await productModel.bulkUpdate(productIds, updateData);

            res.status(200).json({
                message: `Successfully updated ${results.affectedRows} products`,
                affectedRows: results.affectedRows
            });

        } catch (error) {
            console.error('Bulk update products error:', error);
            res.status(500).json({
                message: 'Failed to bulk update products'
            });
        }
    }

    async bulkDeleteProducts(req, res) {
        try {
            const { productIds } = req.body;

            if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
                return res.status(400).json({
                    message: 'Product IDs array is required'
                });
            }

            const results = await productModel.bulkDelete(productIds);

            res.status(200).json({
                message: `Successfully deleted ${results.affectedRows} products`,
                affectedRows: results.affectedRows
            });

        } catch (error) {
            console.error('Bulk delete products error:', error);
            res.status(500).json({
                message: 'Failed to bulk delete products'
            });
        }
    }

    // Order Management (placeholder implementations)
    async getAllOrders(req, res) {
        try {
            const { page = 1, limit = 50, status } = req.query;
            
            // Placeholder - implement when order model is ready
            res.status(200).json({
                orders: [],
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: 0,
                    pages: 0
                },
                message: 'Order management coming soon'
            });

        } catch (error) {
            console.error('Get all orders error:', error);
            res.status(500).json({
                message: 'Failed to fetch orders'
            });
        }
    }

    async getOrderById(req, res) {
        try {
            const { id } = req.params;
            
            // Placeholder implementation
            res.status(200).json({
                order: null,
                message: 'Order management coming soon'
            });

        } catch (error) {
            console.error('Get order by ID error:', error);
            res.status(500).json({
                message: 'Failed to fetch order'
            });
        }
    }

    async updateOrderStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            // Placeholder implementation
            res.status(200).json({
                message: 'Order management coming soon'
            });

        } catch (error) {
            console.error('Update order status error:', error);
            res.status(500).json({
                message: 'Failed to update order status'
            });
        }
    }

    // Customer Management (placeholder implementations)
    async getAllCustomers(req, res) {
        try {
            const { page = 1, limit = 50, status } = req.query;
            
            // Placeholder implementation
            res.status(200).json({
                customers: [],
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: 0,
                    pages: 0
                },
                message: 'Customer management coming soon'
            });

        } catch (error) {
            console.error('Get all customers error:', error);
            res.status(500).json({
                message: 'Failed to fetch customers'
            });
        }
    }

    async getCustomerById(req, res) {
        try {
            const { id } = req.params;
            
            // Placeholder implementation
            res.status(200).json({
                customer: null,
                message: 'Customer management coming soon'
            });

        } catch (error) {
            console.error('Get customer by ID error:', error);
            res.status(500).json({
                message: 'Failed to fetch customer'
            });
        }
    }

    async updateCustomerStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            // Placeholder implementation
            res.status(200).json({
                message: 'Customer management coming soon'
            });

        } catch (error) {
            console.error('Update customer status error:', error);
            res.status(500).json({
                message: 'Failed to update customer status'
            });
        }
    }

    // Analytics (placeholder implementations)
    async getSalesAnalytics(req, res) {
        try {
            const { period = '30d' } = req.query;
            
            // Placeholder implementation
            res.status(200).json({
                analytics: {
                    totalSales: 0,
                    totalRevenue: 0,
                    averageOrderValue: 0,
                    salesGrowth: 0
                },
                message: 'Analytics coming soon'
            });

        } catch (error) {
            console.error('Get sales analytics error:', error);
            res.status(500).json({
                message: 'Failed to fetch sales analytics'
            });
        }
    }

    async getProductAnalytics(req, res) {
        try {
            // Placeholder implementation
            res.status(200).json({
                analytics: {
                    topProducts: [],
                    categoryPerformance: [],
                    stockAlerts: []
                },
                message: 'Analytics coming soon'
            });

        } catch (error) {
            console.error('Get product analytics error:', error);
            res.status(500).json({
                message: 'Failed to fetch product analytics'
            });
        }
    }

    async getCustomerAnalytics(req, res) {
        try {
            // Placeholder implementation
            res.status(200).json({
                analytics: {
                    newCustomers: 0,
                    activeCustomers: 0,
                    customerRetention: 0,
                    topCustomers: []
                },
                message: 'Analytics coming soon'
            });

        } catch (error) {
            console.error('Get customer analytics error:', error);
            res.status(500).json({
                message: 'Failed to fetch customer analytics'
            });
        }
    }
}

export default new AdminController();