# Deployment Guide for AMBOT

Your application is now configured to use **Cloudinary** for file storage and **Neon PostgreSQL** for the database. This makes it completely "stateless" and ready for modern cloud deployment.

## 1. Prerequisites (You have done these!)
- [x] Cloudinary Account & API Keys
- [x] Neon.tech Database & Connection String
- [x] GitHub Repository (Push your latest code)

## 2. Deploy Backend (API)
We recommend using **Render** or **Railway** for the Node.js backend.

### Option A: Render.com (Recommended)
1. Creating a new **Web Service**.
2. Connect your GitHub repository.
3. Select the `AMBOT_PS1/backend` root directory (if asked for Root Directory).
4. **Build Command:** `npm install`
5. **Start Command:** `node src/server.js`
6. **Environment Variables:**
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: *(Your Neon Connection String)* [Make sure it ends with ?sslmode=require]
   - `CLOUDINARY_CLOUD_NAME`: *(From your .env)*
   - `CLOUDINARY_API_KEY`: *(From your .env)*
   - `CLOUDINARY_API_SECRET`: *(From your .env)*
   - `JWT_SECRET`: *(Generate a random strong string)*
   - `GEMINI_API_KEY`: *(If you are using AI features)*

### Option B: Railway.app
1. New Project -> Deploy from GitHub repo.
2. Select Root Directory as `/backend` in settings if it doesn't auto-detect.
3. Add the same variables as above.

## 3. Deploy Frontend (Next.js)
We recommend **Vercel** for the frontend.

1. Go to [Vercel.com](https://vercel.com) -> "Add New..." -> "Project".
2. Import your Git Repository.
3. **Framework Preset:** Next.js (Auto-detected).
4. **Root Directory:** Edit this to select `frontend` (it is important!).
5. **Environment Variables:**
   - `NEXT_PUBLIC_API_URL`: **Important!** Paste the URL of your deployed Backend (e.g., `https://ambot-backend.onrender.com/api`).
   - *Note: Don't include the trailing slash if possible, but the code handles it.*

## 4. Verification
Once deployed:
1. Open your Vercel URL.
2. Try a clear signup flow.
3. Upload a profile picture (This confirms Cloudinary is working).
4. Check the "Mentors" tab (This confirms Database read/write).

## Local Development
To run locally with production resources:
1. `cd backend` -> `npm run dev`
2. `cd frontend` -> `npm run dev`
3. Open `http://localhost:3000`. 
   
   *Note: Since your `.env` points to Neon DB and Cloudinary, your local localhost app is actually reading/writing REAL production data. Be careful!*
