import { NextApiRequest } from 'next'
import cookie from 'cookie'
import { verifyToken } from './auth'
import { readDB } from './db'

export function getUserFromReq(req: NextApiRequest) {
  try {
   
    const cookies = cookie.parse(req.headers.cookie || '')
    const token = cookies.token
    if (!token) return null

   
    const payload: any = verifyToken(token)
    if (!payload?.id) return null

    
    const db = readDB()
    if (!db || !Array.isArray(db.users)) return null


    const user = db.users.find((u: any) => String(u.id) === String(payload.id))
    return user || null
  } catch (err) {
    console.error('Error in getUserFromReq:', err)
    return null
  }
}
