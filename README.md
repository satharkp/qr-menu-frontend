# 🍽️ QR-Based Restaurant Management System

A full-stack MERN application that enables restaurants to manage orders, menu, payments, and operations in real-time using QR-based ordering.

---

## 🚀 Features

### 🧑‍💼 Admin Panel
- Manage menu items (create, update, delete)
- Control item availability in real-time
- View analytics (revenue, orders, top-selling items)
- Role-based access control

### 👨‍🍳 Kitchen Panel
- View incoming orders live
- Toggle item availability (Available / Out of Stock)
- Real-time updates across all panels using Socket.io

### 💳 Cashier Panel
- View all transactions (Cash, UPI, Card)
- Mark orders as paid
- Track settlement time and date
- Filter by payment type and status

### 📱 Customer Side
- Scan QR to view menu
- Add items to cart
- Place orders instantly
- View unavailable items with "Out of Stock" indicator

---

## ⚡ Tech Stack

**Frontend:**
- React.js
- Tailwind CSS

**Backend:**
- Node.js
- Express.js

**Database:**
- MongoDB (Atlas)

**Real-Time:**
- Socket.io

**Authentication:**
- JWT (Role-based)

**Payments:**
- Razorpay (Test Mode)

**Deployment:**
- Frontend: Vercel  
- Backend: Render  

---

## 🔥 Key Highlights

- Real-time synchronization between Admin, Kitchen, and Customer panels
- Dynamic menu system with live availability updates
- Analytics dashboard with revenue tracking and date filtering
- Secure role-based authentication
- Optimistic UI updates for smooth user experience

---

## 📦 Installation

### 1. Clone the repository
```bash
git clone https://github.com/satharkp/your-repo-name.git
cd your-repo-name
```

---

### 2. Setup Backend
```bash
cd backend
npm install
npm run dev
```

Create a `.env` file:
```env

PORT=5050
MONGO_URI=mongodb+srv://knaqk:CbULWqpIXT2WRpXL@qr-res.py75zkw.mongodb.net/restaurant?retryWrites=true&w=majority
JWT_SECRET=supersecretkey
RAZORPAY_KEY_ID=rzp_test_SJxoiJjW3BH8yU
```

---

### 3. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

Create a `.env` file:
```env
VITE_API_URL=http://localhost:5050/api
```

---

## 🌐 Live Demo

- Frontend: https://qr-menu-frontend-eta.vercel.app/
- Backend: https://qr-res.onrender.com/api 

---

## 📸 Screenshots

_Add screenshots here (Admin Dashboard, Kitchen Panel, Cashier Panel, Customer Menu)_

---

## 🧠 Future Improvements

- Notifications system (order ready alerts)
- Inventory management
- Multi-restaurant support dashboard
- Dark mode

---

## 👨‍💻 Author

**Abdul Sathar KP**  
📧 satharkp292@gmail.com  
🔗 https://github.com/satharkp  

---

## ⭐ Show your support

If you like this project, give it a ⭐ on GitHub!
