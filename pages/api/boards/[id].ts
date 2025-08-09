import type { NextApiRequest, NextApiResponse } from 'next'
import { readDB, writeDB } from '../../../lib/db'
import { getUserFromReq } from '../../../lib/userFromReq'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = getUserFromReq(req)
  if (!user) return res.status(401).json({ message: 'Unauthorized' })
  const db = readDB()
  const { id } = req.query
  const board = db.boards.find((b:any) => b.id === id)
  if (!board || board.userId !== user.id) return res.status(404).json({ message: 'Not found' })
  if (req.method === 'PUT') {
    const { title } = req.body
    board.title = title || board.title
    writeDB(db)
    return res.status(200).json(board)
  }
  if (req.method === 'DELETE') {
    db.boards = db.boards.filter((b:any) => b.id !== id)
    // also remove tasks
    db.tasks = db.tasks.filter((t:any) => t.boardId !== id)
    writeDB(db)
    return res.status(200).json({ ok: true })
  }
  res.status(200).json(board)
}
