import type { NextApiRequest, NextApiResponse } from 'next'
import { readDB, writeDB } from '../../../../../lib/db'
import { getUserFromReq } from '../../../../../lib/userFromReq'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = getUserFromReq(req)
  if (!user) return res.status(401).json({ message: 'Unauthorized' })
  const db = readDB()
  const { boardId, taskId } = req.query
  const task = db.tasks.find((t:any) => t.id === taskId && t.boardId === boardId)
  if (!task || task.userId !== user.id) return res.status(404).json({ message: 'Task not found' })
  if (req.method === 'PUT') {
    const { title, description, status, dueDate } = req.body
    task.title = title ?? task.title
    task.description = description ?? task.description
    task.status = status ?? task.status
    task.dueDate = dueDate ?? task.dueDate
    writeDB(db)
    return res.status(200).json(task)
  }
  if (req.method === 'DELETE') {
    db.tasks = db.tasks.filter((t:any)=> t.id !== taskId)
    writeDB(db)
    return res.status(200).json({ ok: true })
  }
  res.status(200).json(task)
}
