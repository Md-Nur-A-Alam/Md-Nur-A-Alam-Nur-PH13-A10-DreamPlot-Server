<div align="center">
  <img src="assets/Home%20page.png" alt="DreamPlot Banner" width="100%" />
  
  <h1>🌟 DreamPlot - Server Architecture & API</h1>
  <p>A highly secure, scalable, and premium backend API powering the transparent property rental and booking marketplace.</p>

  <p>
    <a href="https://md-nur-a-alam-nur-ph-13-a10-dream-p.vercel.app"><img src="https://img.shields.io/badge/Live_Site-Server-green?style=for-the-badge&logo=vercel" alt="Server Live Site" /></a>
    <a href="https://nur-ph-13-a10-dream-plot-client.vercel.app"><img src="https://img.shields.io/badge/Live_Site-Client-blue?style=for-the-badge&logo=vercel" alt="Client Live Site" /></a>
  </p>
</div>

<br />

## 📖 Comprehensive Overview
This repository contains the **backend server** code for DreamPlot. It serves as a secure, high-performance RESTful API connecting Tenants and Property Owners, moderated by an Admin. The system is built with Node.js and Express, connected to a MongoDB database, and integrates Stripe for secure payment processing.

---

## 🏗️ System Architecture

### High-Level Architecture
1. **Client (Next.js)** sends HTTP requests (GET, POST, PATCH, DELETE) to the API.
2. **Express.js API** receives the request.
3. **Middleware Layer** intercepts the request to validate the JWT token (`verifyToken`) and check Role-Based Access Control (`verifyAdmin`, `verifyOwner`, `verifyTenant`).
4. **Controllers/Routers** process the business logic (e.g., creating a booking, confirming a Stripe payment).
5. **MongoDB** executes the database operations via the native MongoDB driver.

### Database Schema (Collections)
- **`user`**: Stores user authentication data and roles (`Admin`, `Owner`, `Tenant`).
- **`properties`**: Stores property details, location, pricing, amenities, images, and approval status.
- **`bookings`**: Tracks booking requests, status (`pending`, `approved`, `rejected`), and payment status.
- **`transactions`**: Audits successful payments linked to properties and tenants.
- **`reviews`**: Stores tenant reviews and ratings for properties.
- **`favorites`**: Tracks properties saved by tenants for later viewing.

---

## 📸 Interactive Showcase
<details open>
<summary><b>🖼️ Click to View Screenshots</b></summary>
<br/>
<table align="center">
  <tr>
    <td align="center"><b>Home Page</b><br><img src="assets/Home%20page.png" width="400" alt="Home"/></td>
    <td align="center"><b>All Services Page</b><br><img src="assets/All%20services%20page.png" width="400" alt="All Services"/></td>
  </tr>
  <tr>
    <td align="center"><b>Tenant Dashboard</b><br><img src="assets/tenant%20dashboard%20page%20and%20private%20nav%20routes.png" width="400" alt="Tenant Dashboard"/></td>
    <td align="center"><b>Owner Dashboard</b><br><img src="assets/Owner%20dashboard%20page%20and%20private%20nav%20routes.png" width="400" alt="Owner Dashboard"/></td>
  </tr>
  <tr>
    <td align="center"><b>Admin Dashboard</b><br><img src="assets/admin%20dashboard%20page%20and%20private%20nav%20routes.png" width="400" alt="Admin Dashboard"/></td>
    <td align="center"><b>Registration Page</b><br><img src="assets/registration%20page%20and%20public%20nav%20routes.png" width="400" alt="Registration Page"/></td>
  </tr>
</table>
</details>

<br />

## 🔌 API Endpoints Summary
> *Note: Protected routes require a valid JWT Bearer token.*

| Endpoint | Method | Role Required | Description |
|----------|--------|---------------|-------------|
| `/jwt` | POST | Public | Generates JWT token |
| `/properties` | GET, POST | Public / Owner | Fetch or create properties |
| `/properties/:id` | PATCH, DELETE | Admin / Owner | Update or remove a property |
| `/bookings` | GET, POST | Admin / Tenant | View all bookings or create one |
| `/create-payment-intent`| POST | Tenant | Initialize Stripe payment |
| `/bookings/confirm-payment`| POST | Tenant | Validate payment & log transaction |
| `/reviews` | GET, POST | Public / Tenant | Fetch and add property reviews |

<br />

## 🛠️ Tech Stack & Dependencies
<p align="center">
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge" alt="Express.js" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens" alt="JWT" />
  <img src="https://img.shields.io/badge/Stripe-626CD9?style=for-the-badge&logo=Stripe&logoColor=white" alt="Stripe" />
</p>

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Native Driver)
- **Security**: `jsonwebtoken` for auth, `cors` for cross-origin requests.
- **Payment Gateway**: `stripe` SDK for secure server-side payment intents.

<br />

## 🚀 Getting Started

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/Md-Nur-A-Alam/Md-Nur-A-Alam-Nur-PH13-A10-DreamPlot-Server.git
cd Md-Nur-A-Alam-Nur-PH13-A10-DreamPlot-Server
```

### 2️⃣ Install Dependencies
```bash
npm install
```

### 3️⃣ Setup Environment Variables
<details>
<summary>Click to view required `.env` configuration</summary>

```env
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
CLIENT_URL=http://localhost:3000
```
</details>

### 4️⃣ Run the Server
```bash
npm run dev
```
The server will be running at `http://localhost:5000`.

<br />

## 👨‍💻 Meet the Developer

<div align="center">
  <img src="assets/developer_Nur.jpeg" alt="Developer Nur" width="150" height="150" style="border-radius:50%; border: 4px solid #626CD9;" />
  <h3>Md Nur A Alam</h3>
  <p>Passionate Full-Stack Developer</p>
  
  <p>
    <a href="https://md-nur-a-alam-portfolio.vercel.app"><img src="https://img.shields.io/badge/Portfolio-255E63?style=for-the-badge&logo=About.me&logoColor=white" alt="Portfolio" /></a>
    <a href="https://www.linkedin.com/in/md-nur-a-alam13/"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" /></a>
    <a href="https://github.com/Md-Nur-A-Alam"><img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" /></a>
  </p>
</div>
