import jwt from 'jsonwebtoken'
import { NextApiRequest } from 'next'
import cookie from 'cookie'

const SECRET = process.env.JWT_SECRET || 'dev-secret-key'

export function signToken(payload: object) {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, SECRET)
  } catch (e) {
    return null
  }
}

export function getTokenFromReq(req: NextApiRequest) {
  const header = req.headers.cookie || ''
  const cookies = cookie.parse(header || '')
  return cookies.token || null
}
