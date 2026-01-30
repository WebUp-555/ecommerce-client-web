# 🛒 E-commerce Platform — Full Stack (Single Repository)

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-Backend-green?style=for-the-badge&logo=node.js" />
  <img src="https://img.shields.io/badge/Express.js-API-black?style=for-the-badge&logo=express" />
  <img src="https://img.shields.io/badge/MongoDB-Database-darkgreen?style=for-the-badge&logo=mongodb" />
  <img src="https://img.shields.io/badge/React-Frontend-blue?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/Razorpay-Payments-1a73e8?style=for-the-badge" />
</p>

<p align="center">
  <strong>End-to-end e-commerce platform built as a single production-ready system</strong><br/>
  Website • Admin • Backend • Payments
</p>

---



## 🧠 System Overview

```txt
Client (Website / Admin Panel)
        ↓
     React + Vite
        ↓
   Express REST API
        ↓
 MongoDB (Users, Cart, Orders)
        ↓
   Razorpay (Test / Live Mode)
✨ Core Capabilities
🔐 Authentication & Security
JWT-based authentication

Protected routes for users & admin

Role-based access control

Centralized error handling

Standard API responses

🛒 Shopping Cart
Persistent cart per user

Add / update / remove items

Server-side price calculation

Prevents client-side manipulation

💳 Payment Integration (Razorpay – Test Mode)
Orders created only from backend

Amount calculated securely from cart

HMAC SHA256 signature verification

Automatic order status updates after payment

Same APIs work in Live Mode by changing keys

Test Mode → Live Mode
(No code changes required)
📦 Order Management
Cart → Order snapshot (price, title, quantity stored)

Secure payment verification

Order lifecycle enforced

Order Status Flow
pending_payment → paid → processing → shipped → delivered
User cancellation supported (valid states only)

Admin cancellation with reason

Terminal states enforced

🧑‍💼 Admin Panel
View all orders (pagination & filters)

Update order status (safe transitions)

Cancel orders

View user & payment details

Delete unpaid / failed orders (optional)

🧰 Tech Stack
Frontend
React (Vite)

State management via store

Razorpay Checkout integration

Protected routes (user/admin)

Backend
Node.js

Express.js

MongoDB + Mongoose

JWT Authentication

Razorpay SDK

Utilities
asyncHandler

ApiError

ApiResponse

🗂️ Monorepo Structure
root/
├── client/        # Website + Admin (React)
├── server/        # Backend (Node + Express)
│   ├── controllers
│   ├── models
│   ├── routes
│   ├── middlewares
│   ├── utils
│   └── config
└── README.md
⚙️ Local Setup
1️⃣ Clone Repository
git clone YOUR_GITHUB_REPO_LINK
cd ecommerce-project
2️⃣ Backend Setup
cd server
npm install
Create .env inside server/

PORT=8000
MONGODB_URI=your_mongodb_uri

JWT_SECRET=your_jwt_secret

RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
Run backend:

npm run dev
3️⃣ Frontend Setup
cd ../client
npm install
npm run dev
🔐 Environment Security
Secrets stored using deployment platform env variables

Razorpay keys never exposed to frontend

Only public key shared for checkout

✔ Safe for Render / Railway / Vercel / VPS

🔄 Razorpay Test → Live
To enable real payments:

RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
✔ Same code
✔ Same flow
✔ Real transactions

🚧 Planned Enhancements
Razorpay Webhooks

Shipment tracking integration

Refund automation

Invoice generation

Email & SMS notifications

🏁 Project Status
✅ End-to-end flow completed
✅ Payment integration working
✅ Admin & user flows separated
✅ Production-ready architecture

