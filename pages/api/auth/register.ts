import type { NextApiRequest, NextApiResponse } from 'next'
import { readDB, writeDB } from '../../../lib/db'
import bcrypt from 'bcryptjs'
import { signToken } from '../../../lib/auth'
import { nanoid } from 'nanoid'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { name, email, password } = req.body
  if (!email || !password || !name) return res.status(400).json({ message: 'Missing fields' })
  const db = readDB()
  const exists = db.users.find((u: any) => u.email === email)
  if (exists) return res.status(409).json({ message: 'User exists' })
  const hashed = bcrypt.hashSync(password, 8)
  const user = { id: nanoid(), name, email, password: hashed }
  db.users.push(user)
  writeDB(db)
  const token = signToken({ id: user.id, email: user.email })
  res.setHeader('Set-Cookie', `token=${token}; HttpOnly; Path=/; Max-Age=${7*24*60*60}`)
  res.status(201).json({ user: { id: user.id, name: user.name, email: user.email } })
}
