// pages/api/boards/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { parse } from "cookie";
import { verify } from "jsonwebtoken";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "db.json");

interface DB {
  users: { id: string; name: string; email: string }[];
  boards: { id: string; title: string; userId: string; createdAt: string }[];
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const cookies = parse(req.headers.cookie || "");
  const token = cookies.token;
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  let payload: any;
  try {
    payload = verify(token, process.env.JWT_SECRET || "dev-secret-key");
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }

  const db: DB = JSON.parse(fs.readFileSync(dbPath, "utf-8"));

  if (req.method === "GET") {
    const boards = db.boards.filter((b) => b.userId === payload.id);
    return res.status(200).json(boards);
  }

  if (req.method === "POST") {
    const { title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }

    const newBoard = {
      id: Date.now().toString(),
      title: title.trim(),
      userId: payload.id,
      createdAt: new Date().toISOString(),
    };

    db.boards.unshift(newBoard);
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    return res.status(201).json(newBoard);
  }

  return res.status(405).json({ message: "Method not allowed" });
}
