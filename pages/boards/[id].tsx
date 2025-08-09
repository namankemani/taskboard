import { GetServerSideProps } from "next";
import { parse } from "cookie";
import { verify } from "jsonwebtoken";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function BoardPage({ user, board }: any) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [status, setStatus] = useState<"pending" | "completed">("pending");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    const res = await fetch("/api/boards/" + board.id + "/tasks");
    const data = await res.json();
    if (res.ok) setTasks(data);
  }

  async function add(e: any) {
    e.preventDefault();
    const res = await fetch("/api/boards/" + board.id + "/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description: desc, status, dueDate }),
    });
    const t = await res.json();
    if (res.ok) {
      setTasks((prev) => [t, ...prev]);
      setTitle("");
      setDesc("");
      setStatus("pending");
      setDueDate("");
    }
  }

  async function toggle(taskId: string) {
    const t = tasks.find((x) => x.id === taskId);
    const res = await fetch("/api/boards/" + board.id + "/tasks/" + taskId, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: t.status === "pending" ? "completed" : "pending",
      }),
    });
    if (res.ok) fetchTasks();
  }

  async function remove(taskId: string) {
    const res = await fetch("/api/boards/" + board.id + "/tasks/" + taskId, {
      method: "DELETE",
    });
    if (res.ok) setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }

  return (
    <div className="container max-w-3xl mx-auto p-4">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{board.title}</h2>
        <Link href="/boards" className="text-blue-600 hover:underline">
          Back
        </Link>
      </header>

      {/* Add Task Form */}
      <form
        onSubmit={add}
        className="bg-white p-4 rounded-lg shadow space-y-3 mb-8"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
          required
          className="w-full px-3 py-2 border rounded-lg"
        />
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Description (optional)"
          className="w-full px-3 py-2 border rounded-lg"
        />
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "pending" | "completed")}
            className="px-3 py-2 border rounded-lg flex-1"
          >
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="px-3 py-2 border rounded-lg flex-1"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          Add Task
        </button>
      </form>

      {/* Task List */}
      <div className="space-y-3">
        {tasks.map((t) => (
          <div
            key={t.id}
            className="bg-white p-4 rounded-lg shadow flex justify-between items-center"
          >
            <div>
              <strong
                className={
                  t.status === "completed"
                    ? "line-through text-gray-500"
                    : ""
                }
              >
                {t.title}
              </strong>
              {t.description && (
                <p className="text-sm text-gray-600">{t.description}</p>
              )}
              <p className="text-xs text-gray-500">
                Due: {t.dueDate || "No date"} | Created:{" "}
                {new Date(t.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => toggle(t.id)}
                className={`px-3 py-1 rounded-lg text-sm ${
                  t.status === "pending"
                    ? "bg-green-500 text-white"
                    : "bg-yellow-500 text-black"
                }`}
              >
                {t.status === "pending" ? "Complete" : "Undo"}
              </button>
              <button
                onClick={() => remove(t.id)}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {tasks.length === 0 && <p className="text-gray-600">No tasks yet.</p>}
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { req, params } = ctx;
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
    const board = db.boards.find(
      (b: any) => b.id === params?.id && b.userId === user.id
    );
    if (!board) return { notFound: true };
    return { props: { user: { id: user.id, name: user.name }, board } };
  } catch (e) {
    return { redirect: { destination: "/login", permanent: false } };
  }
};
