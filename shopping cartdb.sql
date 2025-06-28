CREATE DATABASE IF NOT EXISTS shopping_cart_db;
USE shopping_cart_db;

-- ================================================================
-- 1. USERS TABLE
-- ================================================================
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    phone VARCHAR(20),
    date_of_birth DATE,
    gender ENUM('Male', 'Female', 'Other'),
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_username (username)
);

-- ================================================================
-- 2. USER ADDRESSES TABLE
-- ================================================================
CREATE TABLE user_addresses (
    address_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    address_type ENUM('Home', 'Work', 'Other') DEFAULT 'Home',
    street_address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'Kenya',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
);

-- ================================================================
-- 3. CATEGORIES TABLE
-- ================================================================
CREATE TABLE categories (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    category_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_category_id INT NULL,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (parent_category_id) REFERENCES categories(category_id) ON DELETE SET NULL,
    INDEX idx_parent_category (parent_category_id),
    INDEX idx_active (is_active)
);

-- ================================================================
-- 4. BRANDS TABLE
-- ================================================================
CREATE TABLE brands (
    brand_id INT PRIMARY KEY AUTO_INCREMENT,
    brand_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    logo_url VARCHAR(500),
    website_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_active (is_active)
);

-- ================================================================
-- 5. PRODUCTS TABLE
-- ================================================================
CREATE TABLE products (
    product_id INT PRIMARY KEY AUTO_INCREMENT,
    product_name VARCHAR(255) NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    sku VARCHAR(100) UNIQUE NOT NULL,
    category_id INT NOT NULL,
    brand_id INT,
    price DECIMAL(10, 2) NOT NULL,
    compare_price DECIMAL(10, 2), -- Original price for discount display
    cost_price DECIMAL(10, 2), -- For profit calculation
    weight DECIMAL(8, 3), -- in kg
    dimensions VARCHAR(100), -- LxWxH in cm
    color VARCHAR(50),
    size VARCHAR(50),
    material VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    meta_title VARCHAR(255),
    meta_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE RESTRICT,
    FOREIGN KEY (brand_id) REFERENCES brands(brand_id) ON DELETE SET NULL,
    INDEX idx_category (category_id),
    INDEX idx_brand (brand_id),
    INDEX idx_price (price),
    INDEX idx_active (is_active),
    INDEX idx_featured (is_featured),
    INDEX idx_sku (sku),
    FULLTEXT idx_search (product_name, description, short_description)
);

-- ================================================================
-- 6. PRODUCT IMAGES TABLE
-- ================================================================
CREATE TABLE product_images (
    image_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    INDEX idx_product_id (product_id),
    INDEX idx_primary (is_primary)
);

-- ================================================================
-- 7. INVENTORY TABLE
-- ================================================================
CREATE TABLE inventory (
    inventory_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    quantity_in_stock INT NOT NULL DEFAULT 0,
    reserved_quantity INT NOT NULL DEFAULT 0, -- Items in carts but not ordered
    reorder_level INT DEFAULT 10,
    max_stock_level INT DEFAULT 1000,
    warehouse_location VARCHAR(100),
    last_restocked TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    UNIQUE KEY uk_product_inventory (product_id),
    INDEX idx_stock_level (quantity_in_stock),
    INDEX idx_reorder (reorder_level)
);

-- ================================================================
-- 8. SHOPPING CART TABLE
-- ================================================================
CREATE TABLE shopping_carts (
    cart_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    session_id VARCHAR(255), -- For guest users
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL 30 DAY),
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_cart (user_id),
    INDEX idx_session (session_id),
    INDEX idx_expires (expires_at)
);

-- ================================================================
-- 9. CART ITEMS TABLE
-- ================================================================
CREATE TABLE cart_items (
    cart_item_id INT PRIMARY KEY AUTO_INCREMENT,
    cart_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (cart_id) REFERENCES shopping_carts(cart_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    UNIQUE KEY uk_cart_product (cart_id, product_id),
    INDEX idx_cart_id (cart_id),
    INDEX idx_product_id (product_id),
    
    CHECK (quantity > 0),
    CHECK (unit_price >= 0)
);

-- ================================================================
-- 10. ORDERS TABLE
-- ================================================================
CREATE TABLE orders (
    order_id INT PRIMARY KEY AUTO_INCREMENT,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    order_status ENUM('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded') DEFAULT 'Pending',
    payment_status ENUM('Pending', 'Paid', 'Failed', 'Refunded', 'Partial') DEFAULT 'Pending',
    
    -- Order totals
    subtotal DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    shipping_cost DECIMAL(10, 2) DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    
    -- Shipping information
    shipping_first_name VARCHAR(50),
    shipping_last_name VARCHAR(50),
    shipping_email VARCHAR(100),
    shipping_phone VARCHAR(20),
    shipping_address VARCHAR(255),
    shipping_city VARCHAR(100),
    shipping_state VARCHAR(100),
    shipping_postal_code VARCHAR(20),
    shipping_country VARCHAR(100),
    
    -- Billing information (can be same as shipping)
    billing_first_name VARCHAR(50),
    billing_last_name VARCHAR(50),
    billing_email VARCHAR(100),
    billing_phone VARCHAR(20),
    billing_address VARCHAR(255),
    billing_city VARCHAR(100),
    billing_state VARCHAR(100),
    billing_postal_code VARCHAR(20),
    billing_country VARCHAR(100),
    
    -- Order tracking
    tracking_number VARCHAR(100),
    estimated_delivery DATE,
    actual_delivery_date DATE,
    
    -- Notes
    order_notes TEXT,
    admin_notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    INDEX idx_user_id (user_id),
    INDEX idx_order_number (order_number),
    INDEX idx_status (order_status),
    INDEX idx_payment_status (payment_status),
    INDEX idx_created_date (created_at)
);

-- ================================================================
-- 11. ORDER ITEMS TABLE
-- ================================================================
CREATE TABLE order_items (
    order_item_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(255) NOT NULL, -- Store product name at time of order
    product_sku VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE RESTRICT,
    INDEX idx_order_id (order_id),
    INDEX idx_product_id (product_id),
    
    CHECK (quantity > 0),
    CHECK (unit_price >= 0)
);

-- ================================================================
-- 12. PAYMENTS TABLE
-- ================================================================
CREATE TABLE payments (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    payment_method ENUM('M-Pesa', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Cash on Delivery') NOT NULL,
    payment_provider VARCHAR(50), -- e.g., 'Safaricom', 'Stripe', etc.
    transaction_id VARCHAR(255),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'KES',
    payment_status ENUM('Pending', 'Completed', 'Failed', 'Cancelled', 'Refunded') DEFAULT 'Pending',
    gateway_response TEXT, -- Store full response from payment gateway
    processed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    INDEX idx_order_id (order_id),
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_status (payment_status)
);

-- ================================================================
-- 13. PRODUCT REVIEWS TABLE
-- ================================================================
CREATE TABLE product_reviews (
    review_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    order_id INT, -- Link to actual purchase
    rating INT NOT NULL,
    title VARCHAR(255),
    review_text TEXT,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    helpful_votes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE SET NULL,
    UNIQUE KEY uk_user_product_review (user_id, product_id),
    INDEX idx_product_id (product_id),
    INDEX idx_rating (rating),
    INDEX idx_approved (is_approved),
    
    CHECK (rating >= 1 AND rating <= 5)
);

-- ================================================================
-- 14. COUPONS/DISCOUNTS TABLE
-- ================================================================
CREATE TABLE coupons (
    coupon_id INT PRIMARY KEY AUTO_INCREMENT,
    coupon_code VARCHAR(50) UNIQUE NOT NULL,
    coupon_name VARCHAR(255) NOT NULL,
    description TEXT,
    discount_type ENUM('Percentage', 'Fixed Amount') NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    minimum_order_amount DECIMAL(10, 2) DEFAULT 0,
    maximum_discount_amount DECIMAL(10, 2),
    usage_limit INT, -- NULL = unlimited
    used_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_coupon_code (coupon_code),
    INDEX idx_active (is_active),
    INDEX idx_validity (valid_from, valid_until)
);

-- ================================================================
-- 15. ORDER HISTORY/STATUS TRACKING TABLE
-- ================================================================
CREATE TABLE order_status_history (
    history_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by INT, -- user_id of admin who made the change
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_order_id (order_id)
);

-- ================================================================
-- 16. WISHLIST TABLE
-- ================================================================
CREATE TABLE wishlists (
    wishlist_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_product_wishlist (user_id, product_id),
    INDEX idx_user_id (user_id)
);

-- ================================================================
-- SAMPLE DATA INSERTION
-- ================================================================

-- Insert sample categories
INSERT INTO categories (category_name, description) VALUES
('Electronics', 'Electronic devices and gadgets'),
('Clothing', 'Apparel and fashion items'),
('Footwear', 'Shoes and sandals'),
('Books', 'Books and educational materials'),
('Home & Garden', 'Home improvement and garden items');

-- Insert sample brands
INSERT INTO brands (brand_name, description) VALUES
('Apple', 'Premium technology products'),
('Samsung', 'Electronics and mobile devices'),
('Nike', 'Athletic wear and footwear'),
('Adidas', 'Sports apparel and shoes'),
('Levi\'s', 'Denim and casual wear');

-- Insert sample products (you'll need to adjust category_id and brand_id based on actual IDs)
INSERT INTO products (product_name, description, sku, category_id, brand_id, price, compare_price) VALUES
('iPhone 14 Pro', 'Latest iPhone with advanced features', 'APL-IPH14P-128', 1, 1, 999.00, 1099.00),
('Samsung Galaxy S23', 'Premium Android smartphone', 'SAM-GS23-256', 1, 2, 799.00, 899.00),
('Nike Air Max 270', 'Comfortable running shoes', 'NIK-AM270-42', 3, 3, 150.00, 170.00);

-- Insert inventory for products
INSERT INTO inventory (product_id, quantity_in_stock, reorder_level) VALUES
(1, 50, 10),
(2, 30, 5),
(3, 100, 20);

-- ================================================================
-- USEFUL VIEWS
-- ================================================================

-- View for product catalog with inventory
CREATE VIEW product_catalog AS
SELECT 
    p.product_id,
    p.product_name,
    p.description,
    p.sku,
    p.price,
    p.compare_price,
    c.category_name,
    b.brand_name,
    i.quantity_in_stock,
    (SELECT image_url FROM product_images pi WHERE pi.product_id = p.product_id AND pi.is_primary = TRUE LIMIT 1) as primary_image,
    (SELECT AVG(rating) FROM product_reviews pr WHERE pr.product_id = p.product_id AND pr.is_approved = TRUE) as avg_rating,
    (SELECT COUNT(*) FROM product_reviews pr WHERE pr.product_id = p.product_id AND pr.is_approved = TRUE) as review_count
FROM products p
LEFT JOIN categories c ON p.category_id = c.category_id
LEFT JOIN brands b ON p.brand_id = b.brand_id
LEFT JOIN inventory i ON p.product_id = i.product_id
WHERE p.is_active = TRUE;

-- View for order summary
CREATE VIEW order_summary AS
SELECT 
    o.order_id,
    o.order_number,
    CONCAT(u.first_name, ' ', u.last_name) as customer_name,
    u.email,
    o.order_status,
    o.payment_status,
    o.total_amount,
    o.created_at,
    COUNT(oi.order_item_id) as total_items
FROM orders o
JOIN users u ON o.user_id = u.user_id
LEFT JOIN order_items oi ON o.order_id = oi.order_id
GROUP BY o.order_id;

-- ================================================================
-- STORED PROCEDURES
-- ================================================================

-- Procedure to add item to cart
DELIMITER //
CREATE PROCEDURE AddToCart(
    IN p_user_id INT,
    IN p_product_id INT,
    IN p_quantity INT
)
BEGIN
    DECLARE v_cart_id INT;
    DECLARE v_current_price DECIMAL(10,2);
    DECLARE v_stock_available INT;
    
    -- Get current product price and stock
    SELECT price INTO v_current_price FROM products WHERE product_id = p_product_id AND is_active = TRUE;
    SELECT quantity_in_stock INTO v_stock_available FROM inventory WHERE product_id = p_product_id;
    
    -- Check if enough stock
    IF v_stock_available < p_quantity THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient stock available';
    END IF;
    
    -- Get or create cart
    SELECT cart_id INTO v_cart_id FROM shopping_carts WHERE user_id = p_user_id;
    
    IF v_cart_id IS NULL THEN
        INSERT INTO shopping_carts (user_id) VALUES (p_user_id);
        SET v_cart_id = LAST_INSERT_ID();
    END IF;
    
    -- Add or update cart item
    INSERT INTO cart_items (cart_id, product_id, quantity, unit_price)
    VALUES (v_cart_id, p_product_id, p_quantity, v_current_price)
    ON DUPLICATE KEY UPDATE 
        quantity = quantity + p_quantity,
        unit_price = v_current_price,
        updated_at = CURRENT_TIMESTAMP;
        
END //
DELIMITER ;

-- ================================================================
-- INDEXES FOR PERFORMANCE
-- ================================================================

-- Additional composite indexes for common queries
CREATE INDEX idx_products_category_active ON products(category_id, is_active);
CREATE INDEX idx_products_brand_active ON products(brand_id, is_active);
CREATE INDEX idx_orders_user_status ON orders(user_id, order_status);
CREATE INDEX idx_cart_items_cart_product ON cart_items(cart_id, product_id);

-- ================================================================
-- TRIGGERS
-- ================================================================

-- Trigger to update inventory when order is placed
DELIMITER //
CREATE TRIGGER update_inventory_after_order
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
    UPDATE inventory 
    SET quantity_in_stock = quantity_in_stock - NEW.quantity,
        updated_at = CURRENT_TIMESTAMP
    WHERE product_id = NEW.product_id;
END //
DELIMITER ;