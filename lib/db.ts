import fs from 'fs'
import path from 'path'
const DB_PATH = path.join(process.cwd(), 'data', 'db.json')

export function readDB() {
  const raw = fs.readFileSync(DB_PATH, 'utf-8')
  return JSON.parse(raw)
}

export function writeDB(obj: any) {
  fs.writeFileSync(DB_PATH, JSON.stringify(obj, null, 2), 'utf-8')
}

