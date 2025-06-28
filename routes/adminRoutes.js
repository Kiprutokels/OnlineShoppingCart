import express from 'express';
import adminController from '../controllers/adminController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import adminMiddleware from '../middleware/adminMiddleware.js';

const router = express.Router();

// All admin routes require authentication and admin privileges
// router.use(authMiddleware);
// router.use(adminMiddleware);

// Dashboard stats
router.get('/stats', adminController.getStats);

// Product management routes
router.get('/products', adminController.getAllProducts);
router.get('/products/:id', adminController.getProductById);
router.post('/products', adminController.createProduct);
router.put('/products/:id', adminController.updateProduct);
router.delete('/products/:id', adminController.deleteProduct);

// Bulk operations
router.post('/products/bulk-update', adminController.bulkUpdateProducts);
router.post('/products/bulk-delete', adminController.bulkDeleteProducts);

// Order management routes (for future implementation)
router.get('/orders', adminController.getAllOrders);
router.get('/orders/:id', adminController.getOrderById);
router.put('/orders/:id/status', adminController.updateOrderStatus);

// Customer management routes (for future implementation)
router.get('/customers', adminController.getAllCustomers);
router.get('/customers/:id', adminController.getCustomerById);
router.put('/customers/:id/status', adminController.updateCustomerStatus);

// Analytics routes (for future implementation)
router.get('/analytics/sales', adminController.getSalesAnalytics);
router.get('/analytics/products', adminController.getProductAnalytics);
router.get('/analytics/customers', adminController.getCustomerAnalytics);

export default router;