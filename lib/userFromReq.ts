import { NextApiRequest } from 'next'
import { getTokenFromReq, verifyToken } from './auth'
import { readDB } from './db'

export function getUserFromReq(req: NextApiRequest) {
  const token = getTokenFromReq(req)
  if (!token) return null
  const payload: any = verifyToken(token)
  if (!payload) return null
  const db = readDB()
  const user = db.users.find((u:any) => u.id === payload.id)
  return user || null
}
