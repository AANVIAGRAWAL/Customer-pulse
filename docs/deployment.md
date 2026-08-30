# Deployment Guide (Render & Vercel split deployment)

This guide covers deploying the CustomerPulse application with a split architecture: **Vercel** for the React frontend, and **Render** for the Flask backend API.

---

## 1. Deploy the Backend on Render (Web Service)

The backend is a Flask API. Render will build and deploy it using the `backend/Dockerfile`.

1. Sign in to your [Render](https://render.com) dashboard.
2. Click **New > Web Service**.
3. Connect your GitHub repository.
4. Configure the service settings:
   - **Name**: `customerpulse-api`
   - **Region**: Choose one closest to you (e.g., `Singapore` or `Oregon`).
   - **Branch**: `main`
   - **Root Directory**: `backend` *(This is CRITICAL: it instructs Render to run everything relative to the `/backend` folder)*.
   - **Runtime**: `Docker` *(Render will look for the `Dockerfile` inside the root directory you specified, which is `backend/Dockerfile`)*.
5. Scroll down to **Environment Variables** and add:
   - `DB_HOST`: The host of your managed MySQL database.
   - `DB_USER`: Database user.
   - `DB_PASSWORD`: Database password.
   - `DB_NAME`: Database name.
   - `DB_PORT`: `3306` (or your database port).
   - `FRONTEND_URL`: `https://your-vercel-app.vercel.app` (You can update this after Vercel gives you a URL, or set to `*` initially).
6. Click **Create Web Service**. Render will build the container and provide you with a live URL (e.g., `https://customerpulse-api.onrender.com`).

---

## 2. Initialize the Database

Before using the application, make sure your cloud MySQL database has the initial schemas applied:
- Execute the SQL schema script located in [`backend/database/schema/01_init.sql`](file:///Users/aanviagrawal/Customer%20pulse/backend/database/schema/01_init.sql) against your hosted database.

---

## 3. Deploy the Frontend on Vercel

The frontend is a React + Vite application.

1. Sign in to your [Vercel](https://vercel.com) dashboard.
2. Click **Add New > Project**.
3. Connect your GitHub repository.
4. Configure the project settings:
   - **Root Directory**: `frontend` *(This is CRITICAL: it instructs Vercel to build and serve from `/frontend`)*.
   - **Framework Preset**: `Vite` (Vercel will detect this automatically).
5. Scroll down to **Environment Variables** and add:
   - `VITE_API_BASE_URL`: Set this to your Render backend API URL + `/api` (e.g., `https://customerpulse-api.onrender.com/api`).
6. Click **Deploy**. Vercel will build the static assets and deploy your app.

---

## 4. Local Development

To run the project locally, open two terminal windows:

### Terminal 1: Backend
```bash
cd backend
# Set up your local .env database credentials, then:
python app.py
```

### Terminal 2: Frontend
```bash
cd frontend
# Set up your local .env pointing to http://127.0.0.1:5000/api, then:
npm run dev
```
