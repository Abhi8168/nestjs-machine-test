### ✅ README.md

```markdown
# NestJS Machine Round Test – Backend API

## 📌 Overview

This is a RESTful API built with **NestJS**, demonstrating:
- JWT-based Authentication with access and refresh tokens
- Task management with user association
- Pagination with deduplication
- Swagger API documentation

---

## 🚀 Features

### 🔐 Authentication
- **Signup** with hashed passwords using `bcrypt`
- **Login** returns:
  - Short-lived **Access Token** (15 min)
  - Long-lived **Refresh Token** (7 days)
- **Token Refresh** endpoint using Refresh Token
- All protected routes require Bearer access token
- Refresh tokens securely stored in DB and invalidated on use

### ✅ Task Management
- Authenticated task creation
- Task listing with pagination
- Duplicate prevention based on `title` or `id`
- Tasks linked to the logged-in user

---

## 📁 Project Structure (Simplified)

```

src/
├── auth/           # Signup, Login, JWT guards
├── guards/         # JWT guards
├── tasks/          # Task module: model, service, controller
├── users/          # User entity and relations
├── common/         # decorators
├── main.ts         # Entry point
├── app.module.ts   # Main app module

````

---

## 🛠️ Setup Instructions

1. **Clone the repo**
   ```bash
   git clone <repo_url>
   cd nest-machine-test
````

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment variables**
   Create a `.env` file in the root:

   ```env
   JWT_ACCESS_SECRET=your_access_secret
   JWT_REFRESH_SECRET=your_refresh_secret
   ACCESS_TOKEN_EXPIRY=15m
   REFRESH_TOKEN_EXPIRY=7d
   DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
   ```

4. **Database setup**
   Using Prisma:

   ```bash
   npx prisma migrate dev
   ```

5. **Start the server**

   ```bash
   npm run start:dev
   ```

6. **Access Swagger**
   [http://localhost:3000/api](http://localhost:3000/api)

---

## 🔑 Authentication Flow

### POST `/auth/signup`

* Body:

  ```json
  {
    "email": "user@example.com",
    "password": "yourpassword"
  }
  ```

### POST `/auth/login`

* Response:

  ```json
  {
    "access_token": "jwt_token",
    "refresh_token": "jwt_refresh_token"
  }
  ```

### POST `/auth/refresh`

* Body:

  ```json
  {
    "refresh_token": "your_refresh_token"
  }
  ```

### Access Token Expiry: `15 minutes`

### Refresh Token Expiry: `7 days`

---

## 📚 Task Routes (Protected)

> All require Bearer Token in `Authorization` header.

### POST `/tasks`

* Create a new task
* Body:

  ```json
  {
    "title": "Task title",
    "description": "Task details"
  }
  ```

### GET `/tasks?page=1&limit=10`

* Get paginated tasks without duplicates (by title or ID)

---

## 🧪 Optional Enhancements (If Implemented)

* ✅ Soft delete functionality


---

## 📖 Swagger Documentation

Visit: [http://localhost:3000/api](http://localhost:3000/api)

> Includes all routes, schemas, and request/response bodies.

---

## 👤 Public vs Authenticated Routes

* **Public**

  * `/auth/signup`
  * `/auth/login`
  * `/auth/refresh`
* **Authenticated**

  * `/tasks` (all routes)

---

## 📝 License

MIT – For internal testing and evaluation purposes.

```

---


```
