# CodeCollab — Real-Time Collaborative Code Editor

A full-stack collaborative code editor (like Google Docs for code) with live multi-user editing, cursor tracking, OT conflict resolution, and integrated code execution.

## Quick Start (Docker — easiest)

```bash
git clone <your-repo-url>
cd collab-editor

# 1. Copy and configure environment
cp server/.env.example server/.env
# Edit server/.env — set JWT_SECRET and optionally JUDGE0_API_KEY

# 2. Start everything
docker-compose up --build

# App is live at:
#   http://localhost:3000  ← Frontend
#   http://localhost:4000  ← Backend API
```

## Manual Setup (without Docker)

### Prerequisites
- Node.js v20+
- MongoDB (local or Atlas)
- Redis (local or Redis Cloud)

### Backend
```bash
cd server
cp .env.example .env       # Fill in values (see below)
npm install
npm run dev                # Starts on port 4000
```

### Frontend
```bash
cd client
cp .env.example .env       # Set VITE_SERVER_URL=http://localhost:4000
npm install
npm run dev                # Starts on port 3000
```

## Environment Variables

### server/.env

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default: 4000) |
| `MONGO_URI` | Yes | MongoDB connection string |
| `REDIS_URL` | No | Redis URL (in-memory fallback if omitted) |
| `JWT_SECRET` | Yes | Random 64-char string for signing JWTs |
| `JUDGE0_API_KEY` | No | RapidAPI key for code execution |
| `CLIENT_URL` | Yes | Frontend URL for CORS |

**Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Get JUDGE0_API_KEY:**
1. Go to https://rapidapi.com
2. Search "Judge0 CE"
3. Subscribe to free tier
4. Copy `X-RapidAPI-Key`

## Features

- Live multi-user editing with Operational Transformation (OT)
- Color-coded remote cursors with user names
- Syntax highlighting for 14 languages (Monaco Editor / VS Code engine)
- Session-based collaboration — share a link to invite collaborators
- Integrated code execution (Judge0 API)
- Version history with restore
- User presence indicators
- JWT auth + guest mode (no signup required)

## Project Structure

```
collab-editor/
├── client/            React + Vite frontend
│   └── src/
│       ├── components/Editor/    Monaco + cursor overlay
│       ├── components/Toolbar/   Run, share, language picker
│       ├── components/Sidebar/   Users, version history
│       ├── hooks/                useCollaboration (OT + sockets)
│       ├── ot/                   OT client state machine
│       ├── pages/                HomePage, EditorPage, LoginPage
│       └── services/             api.js, socket.js
└── server/            Node.js + Express backend
    └── src/
        ├── models/    User.js, Document.js (Mongoose)
        ├── routes/    auth.js, sessions.js, execute.js
        ├── socket/    collab.js (Socket.IO handler)
        └── ot/        otEngine.js (OT server)
```

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/register | Register with name/email/password |
| POST | /api/auth/login | Login → returns JWT |
| POST | /api/auth/guest | Quick anonymous session |
| POST | /api/sessions | Create new session |
| GET | /api/sessions/:id | Get session info |
| GET | /api/sessions/:id/history | Get version history |
| PATCH | /api/sessions/:id | Update title/language |
| POST | /api/execute | Run code (language + code + stdin) |

## Socket.IO Events

| Event | Direction | Payload |
|---|---|---|
| join-session | Client → Server | { sessionId, user } |
| init-document | Server → Client | { content, revision, users, language } |
| operation | Bidirectional | { sessionId, revision, operation } |
| ack | Server → Client | { revision } |
| cursor-change | Client → Server | { sessionId, cursor } |
| cursor-update | Server → Others | { userId, cursor, color } |
| user-joined | Server → Others | user object |
| user-left | Server → Others | { userId } |
| save-version | Client → Server | { sessionId, label } |

## Deployment

### Railway (recommended)
1. Push to GitHub
2. Create project at railway.app
3. Add Node.js service (server/) + MongoDB plugin + Redis plugin
4. Set env variables in Railway dashboard
5. Add React service (client/) with `VITE_SERVER_URL` set to server URL

### Render
- Backend: New Web Service → server/ → `npm start`
- Frontend: New Static Site → client/ → build command `npm run build`, publish dir `dist`
- Add MongoDB Atlas and Redis Cloud free tiers
