# 🛒 Online Shopping Cart Management System

This is a full-stack web application for managing an online shopping cart, built with Node.js, Express, MySQL, and static HTML/CSS/JS.

## 🚀 Features

- 🔐 User Registration and Login
- 🛍️ Browse and Search Products by Categories
- 🛒 Add to Cart, Remove, and Modify Quantity
- 💳 Secure Checkout and Payments (Mpesa Integration)
- 📦 Order Tracking and History
- 📱 Responsive Design (Mobile & Desktop Friendly)

## 🧱 Built With

- **Backend:** Node.js, Express.js
- **Database:** MySQL
- **Frontend:** Static HTML/CSS (served from `/public`)
- **Payment Integration:** Mpesa Daraja API (optional)
- **Authentication:** JWT (JSON Web Tokens)

## 📁 Project Structure
    project/
    ├── public/ # Static HTML, CSS, JS
    │ ├── index.html
    │ ├── cart.html
    │ └── ...
    ├── routes/ # Express route handlers
    ├── controllers/ # Controller logic
    ├── models/ # DB models and config
    ├── app.js # Main Express app
    ├── package.json
    └── README.md

## ⚙️ Setup Instructions

1. **Clone the repo:**
   
   git clone https://github.com/Kiprutokels/OnlineShoppingCart.git
   cd OnlineShoppingCart


2. **Install dependencies:**

   npm install


3. **Create .env file and configure:**

   .env
    PORT=5000
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=yourpassword
    DB_NAME=shopping_cart_db
    JWT_SECRET=your_jwt_secret


4. **Run the server:**
    npm start

5. **Visit in your browser:**
    http://localhost:5000