import type { NextApiRequest, NextApiResponse } from 'next'
import { readDB, writeDB } from '../../../lib/db'
import { getUserFromReq } from '../../../lib/userFromReq'
import { nanoid } from 'nanoid'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = getUserFromReq(req)
  if (!user) return res.status(401).json({ message: 'Unauthorized' })
  const db = readDB()
  if (req.method === 'GET') {
    const boards = db.boards.filter((b:any) => b.userId === user.id)
    return res.status(200).json(boards)
  }
  if (req.method === 'POST') {
    const { title } = req.body
    if (!title) return res.status(400).json({ message: 'Missing title' })
    const board = { id: nanoid(), title, userId: user.id, createdAt: new Date().toISOString() }
    db.boards.push(board)
    writeDB(db)
    return res.status(201).json(board)
  }
  res.status(405).end()
}
