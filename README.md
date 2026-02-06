# SigmaGPT Frontend

A React + Vite frontend for the SigmaGPT AI chat application.

## 🚀 Features

- **Real-time Chat**: WebSocket-powered conversation with AI
- **Image Upload**: Send images for AI analysis
- **Multi-language**: Support for multiple languages
- **Thread Management**: Organize conversations in threads
- **Responsive Design**: Works on desktop and mobile

## 📋 Prerequisites

- Node.js 18+
- npm or yarn

## 🛠️ Local Development

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd Frontend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:8080
```

### 3. Run Development Server

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

## ☁️ Deployment

### Option 1: Render (Static Site)

1. Create account on [render.com](https://render.com)
2. New → **Static Site**
3. Connect GitHub repository
4. Configure:
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
5. Add Environment Variable:
   - `VITE_API_URL` = `https://your-backend.onrender.com`

### Option 2: Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Deploy:
   ```bash
   vercel
   ```
3. Set environment variable in Vercel dashboard:
   - `VITE_API_URL` = `https://your-backend.onrender.com`

### Option 3: Netlify

1. Create account on [netlify.com](https://netlify.com)
2. Import from Git
3. Configure:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
4. Add environment variable in Site Settings

### Option 4: GitHub Pages

1. Install gh-pages: `npm install --save-dev gh-pages`
2. Add to package.json scripts:
   ```json
   "predeploy": "npm run build",
   "deploy": "gh-pages -d dist"
   ```
3. Run: `npm run deploy`

## 🔒 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://your-api.onrender.com` |

## 📁 Project Structure

```
Frontend/
├── src/
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks
│   ├── services/       # API services
│   ├── layouts/        # Page layouts
│   └── App.jsx         # Main app component
├── public/             # Static assets
├── index.html          # Entry HTML
├── vite.config.js      # Vite configuration
├── package.json        # Dependencies
└── .env.example        # Environment template
```

## 📄 License

This project is private and proprietary.
