# Train Ticket System 🚆

A full-featured **Railway Ticket Management Backend** built with **Node.js, Express, and MongoDB**.  
This backend handles **user & admin management, ticket booking, cancellations, city management, and real-time chat** functionality.

---

## **Features**

- User registration and authentication with role-based access (User/Admin)
- Admin dashboard features:
  - Manage tickets, users, and cities
  - Confirm or cancel ticket bookings
- Ticket booking system:
  - Choose `from` and `to` cities
  - Select travel date and predefined travel times (5am, 10am, 5pm, 10pm)
  - Automatic seat assignment
  - Booking confirmation via email
  - Cancellation & 80% refund support
- City management with seeder for initial data
- Chat system for user-admin communication
- Security & performance:
  - Rate limiting
  - Helmet, XSS protection, Mongo sanitize
  - Request compression
- Logging and error handling for easier debugging

---

