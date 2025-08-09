// pages/api/boards/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { parse } from "cookie";
import { verify } from "jsonwebtoken";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "db.json");

interface DB {
  users: { id: string; name: string; email: string }[];
  boards: {
    id: string;
    title: string;
    description: string;
    completed: boolean;
    userId: string;
    createdAt: string;
  }[];
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

  if (req.method === "DELETE") {
    const { id } = req.query;
    const index = db.boards.findIndex(
      (b) => b.id === id && b.userId === payload.id
    );
    if (index === -1) {
      return res.status(404).json({ message: "Board not found" });
    }
    db.boards.splice(index, 1);
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    return res.status(200).json({ message: "Board deleted" });
  }

  if (req.method === "PATCH") {
    const { id } = req.query;
    const board = db.boards.find(
      (b) => b.id === id && b.userId === payload.id
    );
    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    const { title, description, completed } = req.body;
    if (title !== undefined) board.title = title.trim();
    if (description !== undefined) board.description = description.trim();
    if (completed !== undefined) board.completed = Boolean(completed);

    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    return res.status(200).json(board);
  }

  return res.status(405).json({ message: "Method not allowed" });
}
