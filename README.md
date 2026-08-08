# CipherChat - E2E Encrypted Messaging Application

An industry-standard fullstack monorepo featuring an Express + Socket.IO backend (`server`) and a Vite + React frontend (`client`).

## 📁 Repository Structure

```
.
├── client/                     # Frontend Application (Vite + React)
│   ├── src/                    # Components, Hooks, Context, Utilities
│   │   ├── components/         # UI Components (ChatWindow, Sidebar, etc.)
│   │   ├── context/            # React Context (AuthContext, ThemeContext)
│   │   ├── hooks/              # Custom Hooks (useCrypto, useSocket, etc.)
│   │   ├── lib/                # Crypto & Helper Libraries
│   │   ├── App.jsx             # Root React Component
│   │   ├── main.jsx            # Application Entrypoint
│   │   └── index.css           # Global Styles & Tailwind Config
│   ├── index.html              # HTML Shell
│   ├── vite.config.js          # Vite Configuration
│   ├── package.json            # Client Dependencies & Scripts
│   └── .env.example            # Client Environment Template
│
├── server/                     # Backend Application (Node.js + Express + Socket.IO)
│   ├── config/                 # Environment Configuration
│   ├── controllers/            # REST API Route Controllers
│   ├── data/                   # Data Storage / Persistence
│   ├── middleware/             # Authentication & Error Middleware
│   ├── routes/                 # Express API Endpoint Routers
│   ├── sockets/                # Real-time Socket.IO Handlers
│   ├── auth.js                 # Authentication Service & Token Handling
│   ├── database.js             # Database Operations & Initialization
│   ├── index.js                # Server Entrypoint
│   ├── package.json            # Server Dependencies & Scripts
│   └── .env.example            # Server Environment Template
│
├── package.json                # Monorepo Workspace Orchestrator
├── .gitignore                  # Monorepo Git Ignore Rules
└── README.md                   # Project Documentation
```

---

## 🚀 Quick Start Guide

### 1. Installation

Install all dependencies across both client and server:
```bash
npm run install:all
```
*(Or run `npm install` in root if using NPM Workspaces)*

### 2. Environment Configuration

- Copy `client/.env.example` to `client/.env`
- Copy `server/.env.example` to `server/.env`

### 3. Development Server

Start both backend server and frontend client concurrently:
```bash
npm run dev
```

Or run them individually:
```bash
# Start Client only (Vite on port 5173)
npm run dev:client

# Start Server only (Express/Socket.IO on port 3000)
npm run dev:server
```

---

## 🛠 Tech Stack

- **Client**: React 18, Vite, Tailwind CSS v4, Lucide React, Socket.IO Client, Web Crypto API
- **Server**: Node.js, Express, Socket.IO, PostgreSQL / Local Storage Fallback, JWT, BcryptJS
