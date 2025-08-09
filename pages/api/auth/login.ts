import type { NextApiRequest, NextApiResponse } from 'next'
import { readDB } from '../../../lib/db'
import bcrypt from 'bcryptjs'
import { signToken } from '../../../lib/auth'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ message: 'Missing fields' })
  const db = readDB()
  const user = db.users.find((u: any) => u.email === email)
  if (!user) return res.status(401).json({ message: 'Invalid credentials' })
  const ok = bcrypt.compareSync(password, user.password)
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' })
  const token = signToken({ id: user.id, email: user.email })
  res.setHeader('Set-Cookie', `token=${token}; HttpOnly; Path=/; Max-Age=${7*24*60*60}`)
  res.status(200).json({ user: { id: user.id, name: user.name, email: user.email } })
}
