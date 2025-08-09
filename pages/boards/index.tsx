"use client";
import { GetServerSideProps } from "next";
import { parse } from "cookie";
import { verify } from "jsonwebtoken";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/router";

type Board = {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  userId: string;
  createdAt: string;
};

interface BoardsProps {
  user: { id: string; name: string };
  boards: Board[];
}

export default function Boards({ user, boards }: BoardsProps) {
  const router = useRouter();
  const [list, setList] = useState<Board[]>(boards || []);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "GET", credentials: "include" });
    router.push("/login");
  }

  async function createBoard(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title, description }),
      });

      const data = await res.json();
      if (res.ok) {
        setList((prev) => [data, ...prev]);
        setTitle("");
        setDescription("");
      } else {
        setError(data.message || "Failed to create board");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteBoard(id: string) {
    if (!confirm("Are you sure you want to delete this board?")) return;

    try {
      const res = await fetch(`/api/boards/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        setList((prev) => prev.filter((b) => b.id !== id));
      } else {
        const data = await res.json();
        alert(data.message || "Failed to delete board");
      }
    } catch {
      alert("Something went wrong. Please try again.");
    }
  }

  async function markCompleted(id: string) {
    try {
      const res = await fetch(`/api/boards/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ completed: true }),
      });

      if (res.ok) {
        const updated = await res.json();
        setList((prev) => prev.map((b) => (b.id === id ? updated : b)));
      }
    } catch {
      alert("Failed to mark completed");
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 text-black">
      {/* Header */}
      <header className="flex justify-between items-center max-w-5xl mx-auto py-4">
        <h2 className="text-2xl font-bold">Hi {user.name}</h2>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow transition-colors"
        >
          Logout
        </button>
      </header>

      {/* Create Board Form */}
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">Your Boards</h3>
        <form
          onSubmit={createBoard}
          className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-3"
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="New board title"
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Board description"
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg shadow transition-colors"
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </form>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>

      {/* Boards Grid */}
      <div className="max-w-5xl mx-auto grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {list.length > 0 ? (
          list.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-lg shadow hover:shadow-lg p-5 transition-shadow flex flex-col justify-between"
            >
              <div>
                <Link
                  href={`/boards/${b.id}`}
                  className="text-lg font-semibold text-gray-800 hover:text-blue-600"
                >
                  {b.title}
                </Link>
                <p className="text-sm text-gray-500 mt-1">{b.description}</p>
                <p className="text-sm text-gray-400 mt-1">
                  Created: {new Date(b.createdAt).toLocaleDateString()}
                </p>
                <span
                  className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${
                    b.completed
                      ? "bg-green-200 text-green-800"
                      : "bg-yellow-200 text-yellow-800"
                  }`}
                >
                  {b.completed ? "Completed" : "Pending"}
                </span>
              </div>

              <div className="mt-4 flex gap-2">
                {!b.completed && (
                  <button
                    onClick={() => markCompleted(b.id)}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm"
                  >
                    Mark Completed
                  </button>
                )}
                <button
                  onClick={() => deleteBoard(b.id)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-600 col-span-full">No boards yet.</p>
        )}
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { req } = ctx;
  const cookies = parse(req.headers.cookie || "");
  const token = cookies.token || null;

  if (!token) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  try {
    const payload: any = verify(
      token,
      process.env.JWT_SECRET || "dev-secret-key"
    );
    const fs = require("fs");
    const path = require("path");
    const db = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "data", "db.json"), "utf-8")
    );

    const user = db.users.find((u: any) => u.id === payload.id);
    if (!user)
      return { redirect: { destination: "/login", permanent: false } };

    const boards = db.boards.filter((b: any) => b.userId === user.id);
    return { props: { user: { id: user.id, name: user.name }, boards } };
  } catch {
    return { redirect: { destination: "/login", permanent: false } };
  }
};
