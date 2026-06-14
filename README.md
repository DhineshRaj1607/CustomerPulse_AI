# CustomerPulse AI

## Project Overview

CustomerPulse AI is a CRM dashboard application built to centralize customer management, segment creation, campaign orchestration, analytics, and email outreach. The project separates frontend and backend logic into dedicated folders for clean development and deployment.

## Features

- Customer management: list, view, create, update, delete
- Segment management: list, view, create, update, delete
- Campaign management: list, view, create, update, delete
- Email campaign sending endpoint
- Analytics summary dashboard
- Responsive UI with modern fonts, charts, and motion effects

## Tech Stack

- Frontend: React, Vite, TypeScript, Tailwind CSS, Framer Motion, Recharts
- Backend: Node.js, Express, MongoDB, Mongoose, dotenv, Nodemailer

## Setup Instructions

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

Create a `.env` file inside the `backend/` folder with:

```env
MONGO_URI=<your-mongodb-connection-string>
PORT=5000
```

## API Endpoints

Base URL: `http://localhost:5000/api`

### Customers
- `GET /api/customers`
- `GET /api/customers/:id`
- `POST /api/customers`
- `PUT /api/customers/:id`
- `DELETE /api/customers/:id`

### Segments
- `GET /api/segments`
- `GET /api/segments/:id`
- `POST /api/segments`
- `PUT /api/segments/:id`
- `DELETE /api/segments/:id`

### Campaigns
- `GET /api/campaigns`
- `GET /api/campaigns/:id`
- `POST /api/campaigns`
- `POST /api/campaigns/send-email`
- `PUT /api/campaigns/:id`
- `DELETE /api/campaigns/:id`

### Analytics
- `GET /api/analytics`

## Deployment URLs

- Frontend local: `http://localhost:5173`
- Backend local: `http://localhost:5000`

> Update these URLs if you deploy the app to a live hosting environment.
