# SoloFlow Mobile (React Native + Expo)

Production-ready mobile client for the SoloFlow backend.

## Tech Stack

- React Native (Expo)
- TypeScript
- React Navigation (Stack + Bottom Tabs)
- Axios
- Context API for authentication
- `expo-secure-store` for JWT storage
- RunAnywhere React Native SDK for on-device AI with tool calling

## Backend Assumptions

The app talks directly to the existing SoloFlow backend and only uses routes actually defined in `backend/app.js`:

- Auth: `POST /login`, `GET /user/:user_id`
- Dashboard/tasks: `GET /:user_id/dashboard`
- Clients: `GET /:user_id/clients`, `POST /:user_id/addclient`
- Projects: `GET /:user_id/projects`, `POST /:user_id/:client_id/addproject`
- Tasks: `POST /:user_id/:client_id/addtask`, `PATCH /:user_id/:task_id/*` (priority, status, price)
- Stats: `/stats/projects-today/:user_id`, `/stats/projects-thisweek/:user_id`, `/stats/projects-thismonth/:user_id`, `/:user_id/statistics`, `/stats/weekly-deadlines/:user_id`
- Invoices/email: `GET /:user_id/:client_id/:project_id/viewinvoice`, `POST /:user_id/:invoice_id/email`

Notification routes from the backend are intentionally **not** used.

## Environment

The app is configured to use localhost only:

- `http://localhost:3000`

This is defined in `src/utils/config.js`.

## Installation

From the `SoloFlow/mobile` directory:

```bash
pnpm install   # or npm install / yarn install
```

Install pods for iOS (if building locally):

```bash
cd ios && pod install && cd ..
```

## Running the App

```bash
expo start
```

Then:

- Press `a` to run on Android
- Press `i` to run on iOS simulator
- Or scan the QR code with Expo Go

Ensure your SoloFlow backend is running at `http://localhost:3000`.

## Architecture Overview

`src/`

- `navigation/` – Root stack + bottom tabs
- `context/` – `AuthContext` with `login`, `logout`, `restoreSession`
- `services/`
  - `api.ts` – Axios instance with JWT and 401 handling
  - `aiToolExecutor.ts` – RunAnywhere tools mapped to real backend routes
- `screens/`
  - `auth/` – Login
  - `dashboard/` – Dashboard cards + charts
  - `clients/` – Client list
  - `projects/` – Project list
  - `tasks/` – Kanban-style task board with status/priority/price updates
  - `invoices/` – Invoice view + email
  - `stats/` – Productivity stats chart
  - `ai/` – AI assistant wired to backend tools

JWT is stored in `expo-secure-store` and attached to every API request; 401 responses automatically clear auth state.

