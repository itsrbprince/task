# TaskPerform — Enterprise Task Performance Management System

A full-stack enterprise task and performance management platform built with **Node.js**, **Express**, **MongoDB**, and a **vanilla JavaScript** SPA frontend.

## Features

- Employee task management with filtering, search, and pagination
- Performance tracking (scores, progress, completion rates)
- Role-based authentication (Admin / Employee) with JWT
- Admin dashboard with overview, employees, departments, and leaderboard
- Multi-file uploads (drag & drop) with secure authenticated downloads
- Sub-tasks, multiple URLs, optional daily goals with auto performance evaluation
- Forgot / reset password and change password (in-app settings)
- Light professional white theme UI
- Task detail viewer with comments and attachments
- Responsive professional enterprise UI

## Tech Stack

| Layer    | Technology                          |
| -------- | ----------------------------------- |
| Backend  | Node.js, Express, Mongoose          |
| Database | MongoDB                             |
| Auth     | JWT (jsonwebtoken), bcryptjs        |
| Uploads  | Multer                              |
| Frontend | HTML, CSS, Vanilla JavaScript (SPA) |

## Project Structure

```
task/
├── server.js                 # Application entry point
├── package.json
├── .env.example
├── scripts/
│   └── seed.js               # Database seed script
├── uploads/                  # File upload storage
├── src/
│   ├── config/db.js
│   ├── models/
│   │   ├── User.js
│   │   └── Task.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── admin.js
│   │   ├── upload.js
│   │   └── validate.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── taskController.js
│   │   └── adminController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── taskRoutes.js
│   │   └── adminRoutes.js
│   └── utils/
│       ├── errors.js
│       └── helpers.js
└── public/
    ├── index.html
    ├── css/styles.css
    └── js/
        ├── api.js
        ├── app.js
        ├── utils.js
        ├── components/
        └── pages/
```

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB running locally or a MongoDB Atlas connection string

### Installation

```bash
# Clone or navigate to project directory
cd task

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your MongoDB URI and JWT secret
```

### Environment Variables

| Variable       | Description                    | Default                                      |
| -------------- | ------------------------------ | -------------------------------------------- |
| `PORT`         | Server port                    | `5000`                                       |
| `MONGODB_URI`  | MongoDB connection string      | `mongodb://localhost:27017/task_performance_db` |
| `JWT_SECRET`   | Secret for signing JWT tokens  | (required — change in production)            |
| `JWT_EXPIRE`   | Token expiration               | `7d`                                         |
| `MAX_FILE_SIZE`| Max upload size in bytes       | `20971520` (20MB)                            |
| `MAX_FILES`    | Max files per upload           | `10`                                         |

### Seed Database

```bash
npm run seed
```

**Demo credentials after seeding:**

| Role     | Email               | Password      |
| -------- | ------------------- | ------------- |
| Admin    | admin@company.com   | admin123      |
| Employee | sarah@company.com   | employee123   |

(All seeded employees use password `employee123`)

### Run Server

```bash
# Development (with nodemon)
npm run dev

# Production
npm start
```

Open **http://localhost:5000** in your browser.

## API Routes

### Authentication

| Method | Route              | Description        |
| ------ | ------------------ | ------------------ |
| POST   | `/api/auth/register` | Register user    |
| POST   | `/api/auth/login`    | Login            |
| POST   | `/api/auth/forgot-password` | Request password reset |
| POST   | `/api/auth/reset-password`  | Reset with token |
| PUT    | `/api/auth/change-password` | Change password (JWT) |
| GET    | `/api/auth/me`       | Current user (JWT) |
| GET    | `/api/auth/employees`| List employees (JWT) |

### Tasks (JWT required)

| Method | Route                                      | Description           |
| ------ | ------------------------------------------ | --------------------- |
| GET    | `/api/tasks`                               | List tasks (filtered) |
| GET    | `/api/tasks/:id`                           | Get task detail       |
| POST   | `/api/tasks`                               | Create task           |
| PUT    | `/api/tasks/:id`                           | Update task           |
| DELETE | `/api/tasks/:id`                           | Delete task           |
| POST   | `/api/tasks/:id/comments`                  | Add comment           |
| POST   | `/api/tasks/:id/attachments`               | Upload files (multipart) |
| DELETE | `/api/tasks/:id/attachments/:attachmentId` | Delete attachment     |
| GET    | `/api/tasks/uploads/:filename`             | Download file (JWT)   |

### Admin (JWT + Admin role)

| Method | Route                         | Description              |
| ------ | ----------------------------- | ------------------------ |
| GET    | `/api/admin/overview`         | Dashboard overview stats |
| GET    | `/api/admin/employees`        | Employee list + stats    |
| GET    | `/api/admin/employees/:id`    | Employee detail          |
| GET    | `/api/admin/departments`      | Department analytics     |
| GET    | `/api/admin/leaderboard`      | Performance leaderboard  |

## File Uploads

- Stored in `/uploads`
- Max 10 files per request, 20MB each
- Allowed types: PDF, DOCX, XLSX, JPG, PNG, ZIP
- Downloads require JWT authentication

## License

MIT
# task
