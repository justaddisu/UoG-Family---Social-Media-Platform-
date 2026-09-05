<div align="center">
<h1>🎓 UoG Family - University of Gondar Social Platform</h1>
</div>

## Project Overview

UoG Family is a full-stack social networking platform built for the University of Gondar community. It is designed to support academic collaboration, community engagement, announcements, and real-time communication between students, alumni, faculty, and staff.

This platform is built as a modern PERN-style application with:
- A React + Vite frontend
- An Express + TypeScript backend
- PostgreSQL database managed with Prisma ORM
- Real-time messaging via Socket.IO
- JWT-based authentication and role-based access control

## Key Features

- User registration and login with academic roles
- Home feed with posts, images, reactions, comments, and bookmarks
- Real-time chat rooms and direct messaging
- Community groups and event management
- Admin dashboard for analytics, user moderation, and platform oversight
- Local image upload support for posts
- Social landing page with home navigation and developer footer links

## Tech Stack

- Node.js + Express
- React 19 + Vite
- TypeScript
- PostgreSQL
- Prisma
- Socket.IO
- Tailwind CSS
- lucide-react icons

## Local Setup

### Prerequisites

- Node.js 18+ installed
- PostgreSQL running locally
- Git installed

### Install dependencies

```bash
npm install
```

### Configure environment variables

Copy `.env.example` to `.env` and update the values as needed:

```bash
cp .env.example .env
```

Required variables:
- `PRODUCT_KEY` — optional runtime product key for secured features
- `APP_URL` — application base URL, e.g. `http://localhost:3000`
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — JWT authentication secret
- `JWT_REFRESH_SECRET` — JWT refresh token secret

Example database URL:

```bash
DATABASE_URL="postgresql://postgres:admin@localhost:5432/uog_family?schema=public"
```

### Run the application

```bash
npm run dev
```

The frontend and backend are served together from the same Vite development server.

## Database Notes

The project uses Prisma for database schema management. After updating `.env`, you can apply the schema and generate Prisma client files with:

```bash
npx prisma db push
npx prisma generate
```

## Testing and API Validation

A smoke-test script is available at `test-api.js` to verify endpoints and authentication flows.

## Repository Structure

- `server.ts` — main backend server entrypoint
- `src/` — React client application
- `prisma/schema.prisma` — database schema definition
- `src/pages/` — application pages (landing, login, register, feed, chat, admin, etc.)
- `src/redux/` — auth state and store configuration
- `src/services/api.ts` — Axios API service wrapper

## Notes

- The app is currently configured for local development and PostgreSQL.
- The footer on the landing page includes developer credits and social links for Addisu Dessalegn.
- If you want to deploy this project, update `APP_URL`, configure production database credentials, and secure all secrets.
- Original work and implementation by Addisu Dessalegn.

## License

This project is available for personal and academic use.

## Product Key / Licensing

This project requires a valid product key for licensed usage.

- Product keys are issued privately per project and per deployment.
- Do not commit product keys to source code, README files, or public repositories.
- Store product keys only in secure secret managers or private environment files.

To request a product key, contact:

- Name: Addisu Dessalegn
- Email: justaddisu@gmail.com
- Phone/WhatsApp: +251 910 170 759
- LinkedIn: https://www.linkedin.com/in/addisu-dessalegn-6a852b11a/
- Portfolio: https://justaddisu.github.io/My-Portfolio
