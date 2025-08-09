import { GetServerSideProps } from 'next'
import { parse } from 'cookie'
import { verify } from 'jsonwebtoken'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function BoardPage({ user, board }: any) {
  const [tasks, setTasks] = useState<any[]>([])
  const [title,setTitle]=useState('')
  const [desc,setDesc]=useState('')
  useEffect(()=>{ fetchTasks() }, [])
  async function fetchTasks(){
    const res = await fetch('/api/boards/'+board.id+'/tasks')
    const data = await res.json()
    if(res.ok) setTasks(data)
  }
  async function add(e:any){
    e.preventDefault()
    const res = await fetch('/api/boards/'+board.id+'/tasks', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({title,description:desc})})
    const t = await res.json()
    if(res.ok){ setTasks(prev=>[t,...prev]); setTitle(''); setDesc('') }
  }
  async function toggle(taskId:string){
    const t = tasks.find(x=>x.id===taskId)
    const res = await fetch('/api/boards/'+board.id+'/tasks/'+taskId, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ status: t.status === 'pending' ? 'completed' : 'pending' })})
    if(res.ok) fetchTasks()
  }
  async function remove(taskId:string){
    const res = await fetch('/api/boards/'+board.id+'/tasks/'+taskId, { method:'DELETE' })
    if(res.ok) setTasks(prev=>prev.filter(t=>t.id!==taskId))
  }
  return <div className='container'>
    <header><h2>{board.title}</h2><div><Link href='/boards'>Back</Link></div></header>
    <form onSubmit={add} style={{maxWidth:600}}>
      <input value={title} onChange={e=>setTitle(e.target.value)} placeholder='Task title' required />
      <br/>
      <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder='Description (optional)'></textarea>
      <br/>
      <button type='submit'>Add Task</button>
    </form>
    <div style={{marginTop:16}}>
      {tasks.map(t=>(
        <div key={t.id} style={{padding:12,background:'#fff',marginBottom:8,borderRadius:6,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <strong style={{textDecoration: t.status==='completed'?'line-through':'none'}}>{t.title}</strong>
            <div style={{fontSize:12,color:'#666'}}>{t.description}</div>
          </div>
          <div>
            <button onClick={()=>toggle(t.id)}>{t.status==='pending' ? 'Complete' : 'Undo'}</button>
            <button onClick={()=>remove(t.id)} style={{marginLeft:8}}>Delete</button>
          </div>
        </div>
      ))}
      {tasks.length===0 && <p>No tasks yet.</p>}
    </div>
  </div>
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { req, params } = ctx
  const cookies = parse(req.headers.cookie || '')
  const token = cookies.token || null
  if (!token) {
    return { redirect: { destination: '/login', permanent: false } }
  }
  try {
    const payload: any = verify(token, process.env.JWT_SECRET || 'dev-secret-key')
    const fs = require('fs')
    const path = require('path')
    const db = JSON.parse(fs.readFileSync(path.join(process.cwd(),'data','db.json'),'utf-8'))
    const user = db.users.find((u:any)=>u.id===payload.id)
    if(!user) return { redirect: { destination: '/login', permanent: false } }
    const board = db.boards.find((b:any)=> b.id === params?.id && b.userId === user.id)
    if(!board) return { notFound: true }
    return { props: { user: { id: user.id, name: user.name }, board } }
  } catch (e) {
    return { redirect: { destination: '/login', permanent: false } }
  }
}
