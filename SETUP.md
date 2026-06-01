# 🚀 Murmuze Enhanced — Setup Guide

## What's New in This Version

### 🎥 Video & Voice Calls
Real WebRTC peer-to-peer calls with camera toggle, mute, and call history.

### 💬 Messaging Upgrades
- **Typing indicators** — animated dots when someone is typing
- **Read receipts** — ✓✓ turns blue when message is read
- **Emoji reactions** — hover any message and react with 8 quick emojis
- **Reply to messages** — quote any message when replying
- **Delete messages** — remove your own messages
- **Voice messages** — record & send audio right from browser
- **Polls** — send a live-voting poll to your chat partner
- **Time capsule** — schedule a message to be delivered at a future date
- **Ghost mode** — messages disappear after 60 seconds

### 🎮 Gamification
- **XP system** — earn 5 XP per message sent
- **Levels** — every 100 XP = new level, shown on navbar and profile
- **Streaks** — daily chat streak tracker 🔥
- **Achievements** — 9 unlockable badges (First Message, Night Owl, etc.)
- **Leaderboard** — top chatters ranked by XP in Sidebar → "Top" tab

### 📊 Analytics
- **Chat stats** — total messages, peak hours bar chart, top words
- **Call history** — log of all voice/video calls in Sidebar → "Calls" tab

### 🎨 UI / UX
- **Chat wallpapers** — per-chat background color/gradient (Settings page)
- **Sound notifications** — audio ping on new messages (toggleable)
- **Unread badges** — red count on contacts in sidebar
- **Editable profile** — change name and bio directly on profile page
- **32 themes** — unchanged, still all there

---

## 📦 Prerequisites

- **Node.js** v18 or higher (`node -v` to check)
- **npm** v9 or higher
- **MongoDB** — free Atlas cluster: https://cloud.mongodb.com
- **Cloudinary** — free account: https://cloudinary.com

---

## ⚙️ Environment Setup

### Backend (`/backend/.env`)

Copy `.env.example` to `.env` and fill in:

```bash
cd backend
cp .env.example .env
```

Then edit `.env`:

```
MONGO_URI=mongodb+srv://youruser:yourpass@cluster0.xxx.mongodb.net/murmuze
JWT_SECRET=paste_any_long_random_string_here
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
PORT=5001
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

**How to get each value:**

| Variable | Where to get it |
|---|---|
| `MONGO_URI` | MongoDB Atlas → Connect → Drivers → copy connection string |
| `JWT_SECRET` | Run: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `CLOUDINARY_*` | Cloudinary Dashboard → API Keys |
| `CLIENT_URL` | `http://localhost:5173` in development |

### Frontend (`/frontend/.env`)

```bash
cd frontend
cp .env.example .env
```

Edit `.env`:
```
VITE_API_URL=http://localhost:5001
```

---

## 🏃 Running Locally

### Terminal 1 — Backend

```bash
cd backend
npm install
npm run dev
```

You should see:
```
🚀 Murmuze server running on port 5001
MongoDB connected: cluster0.xxxxx.mongodb.net
```

### Terminal 2 — Frontend

```bash
cd frontend
npm install
npm run dev
```

Open: **http://localhost:5173**

---

## 🌐 Deploying to Production

### Backend → Render (free)

1. Push code to GitHub
2. Go to https://render.com → New Web Service
3. Connect your repo, select `/backend` as root
4. Build command: `npm install`
5. Start command: `npm start`
6. Add all environment variables from `.env` in the Render dashboard
7. Change `CLIENT_URL` to your Vercel frontend URL
8. Change `NODE_ENV` to `production`

### Frontend → Vercel (free)

1. Go to https://vercel.com → New Project
2. Import your GitHub repo
3. Set root directory to `frontend`
4. Add environment variable: `VITE_API_URL=https://your-render-backend.onrender.com`
5. Deploy!

---

## 🎮 Feature Usage Guide

### Video/Voice Calls
- Open any chat → click 📞 (voice) or 📹 (video) in the header
- Receiver gets a pop-up to accept or decline
- During call: mute mic, toggle camera, hang up

### Polls
- In message input → click **+** → **Poll**
- Add question and 2–5 options → Send Poll
- Both users see live vote percentages

### Time Capsule
- Click **+** → **Time Capsule**  
- Write a message and pick a future date/time
- Message auto-delivers at that moment (server checks every 60 seconds)

### Ghost Mode
- Click **+** → **Ghost Mode** (turns yellow when active)
- Next message you send disappears after 60 seconds

### Voice Messages
- Click 🎤 to start recording
- Click ⏹ to stop
- Preview plays, then click ➤ to send

### Reactions
- Hover over any message
- Click 😊 icon → pick an emoji
- Click same emoji again to remove it

### Chat Stats
- In chat header → click 📊
- See message count, peak hour chart, most used words

### Leaderboard
- In sidebar → click **Top** tab
- Shows top 20 users by XP globally

---

## 🛠 Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19 + Vite + Zustand + DaisyUI + TailwindCSS |
| Backend | Node.js + Express 5 + MongoDB + Mongoose |
| Real-time | Socket.io (WebSockets) |
| Video calls | WebRTC (native browser API) |
| Media storage | Cloudinary |
| Auth | JWT + httpOnly cookies |
| Voice recording | Web Audio API + MediaRecorder |

---

## 🐛 Troubleshooting

**"CORS error" in browser console**
→ Make sure `CLIENT_URL` in backend `.env` exactly matches your frontend URL (no trailing slash)

**"Microphone/Camera access denied"**
→ Browser needs HTTPS for WebRTC in production. Vercel + Render both provide HTTPS automatically.

**Video call connects but no video**
→ Both users need to allow camera/mic permission. Check browser address bar for blocked permissions.

**Messages not loading**
→ Check `VITE_API_URL` in frontend `.env` points to the correct backend URL.

**Time capsule not delivering**
→ The server checks every 60 seconds. Wait a bit. Check server logs for errors.

