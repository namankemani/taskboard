# 📝 Todo Application (Next.js + TypeScript + Tailwind)

A simple and modern Todo application built using **Next.js**, **TypeScript**, and **Tailwind CSS**, with user authentication and task management features.

---

## 🚀 Features

- **Authentication**
  - Secure login & signup functionality.
  - Only authenticated users can manage their tasks.
  - email- n@12.com password-123456

- **Boards (Task Lists)**
  - Create, edit, and delete boards.
  - Each board has:
    - **Title** 🏷️
    - **Description** 📄
    - **Status** ✅ Pending / Completed

- **UI**
  - Built with **Tailwind CSS** for a responsive and modern design.
  - Fully mobile-friendly.

- **TypeScript Support**
  - Strong type safety for predictable and maintainable code.

---

## ⚠️ Deployment Notes

### Cause of Error on Vercel
During deployment to **Vercel**, the following error may appear in logs:


This happens because:
- Vercel runs your API routes/functions in a **serverless environment**.
- The file system (`/var/task/`) is **read-only** during runtime.
- Any attempt to write to a local file (like `data/db.json`) will fail.

---

### Why Local Works But Vercel Doesn’t
- **Local development**: You can read/write files freely in your `data/` folder.
- **Vercel**: You can only read files packaged at build time, not modify them.

---

## 💡 Solutions

### 1. Use a Cloud Database (**Recommended**)
Migrate from file-based storage to a persistent cloud database:
- **Supabase** (PostgreSQL)
- **PlanetScale** (MySQL)
- **MongoDB Atlas** (MongoDB)
- **Neon.tech** (PostgreSQL)

This ensures your data persists between deployments and is writable in production.

### 2. Use Vercel KV / Upstash Redis
For small-scale apps, a key-value store is quick to integrate and serverless-friendly.

### 3. Temporary In-Memory Storage (For Testing)
Keep data in memory (inside the API route).  
**Note**: Data will reset whenever the serverless function restarts.

Example:
```ts
let boards: any[] = [];

export default function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json(boards);
  } else if (req.method === 'POST') {
    const newBoard = { id: Date.now(), ...req.body };
    boards.push(newBoard);
    res.status(201).json(newBoard);
  }
}


