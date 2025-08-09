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
  userId: string;
  createdAt: string;
};

export default function Boards({ user, boards }: { user: any; boards: Board[] }) {
  const router = useRouter();
  const [list, setList] = useState<Board[]>(boards || []);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "GET", credentials: "include" });
    router.push("/login");
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim()) return;

    try {
      const res = await fetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ✅ ensure JWT cookie is sent
        body: JSON.stringify({ title }),
      });

      const data = await res.json();
      console.log("API response:", res.status, data);

      if (res.ok) {
        setList((prev) => [data, ...prev]);
        setTitle("");
      } else {
        setError(data.message || "Failed to create board");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
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
        <form onSubmit={create} className="flex flex-col sm:flex-row gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="New board title"
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow transition-colors"
          >
            Create
          </button>
        </form>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>

      {/* Boards Grid */}
      <div className="max-w-5xl mx-auto grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {list.length > 0 ? (
          list.map((b) => (
            <Link
              key={b.id}
              href={`/boards/${b.id}`}
              className="block bg-white rounded-lg shadow hover:shadow-lg p-5 transition-shadow"
            >
              <h4 className="text-lg font-semibold text-gray-800">{b.title}</h4>
              <p className="text-sm text-gray-500 mt-1">
                Created: {new Date(b.createdAt).toLocaleDateString()}
              </p>
            </Link>
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
  } catch (e) {
    return { redirect: { destination: "/login", permanent: false } };
  }
};
