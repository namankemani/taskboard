import type { NextApiRequest, NextApiResponse } from 'next'
import { readDB, writeDB } from '../../../../../lib/db'
import { getUserFromReq } from '../../../../../lib/userFromReq'
import { nanoid } from 'nanoid'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = getUserFromReq(req)
  if (!user) return res.status(401).json({ message: 'Unauthorized' })

  const db = readDB()
  const { id: boardId } = req.query
  const boardIdStr = String(boardId)

  const board = db.boards.find((b: any) => String(b.id) === boardIdStr)
  if (!board || board.userId !== user.id) {
    return res.status(404).json({ message: 'Board not found' })
  }

  if (req.method === 'GET') {
    const tasks = db.tasks.filter((t: any) => String(t.boardId) === boardIdStr)
    return res.status(200).json(tasks)
  }

  if (req.method === 'POST') {
    const { title, description, dueDate } = req.body
    if (!title) return res.status(400).json({ message: 'Missing title' })

    const task = {
      id: nanoid(),
      boardId: boardIdStr,
      userId: user.id,
      title,
      description: description || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
      dueDate: dueDate || null,
    }

    db.tasks.push(task)
    writeDB(db)
    return res.status(201).json(task)
  }

  return res.status(405).json({ message: 'Method not allowed' })
}
