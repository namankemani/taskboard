import { GetServerSideProps } from 'next'
import { parse } from 'cookie'
export default function Home() { return null }
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const cookies = parse(ctx.req.headers.cookie || '')
  if (cookies.token) return { redirect: { destination: '/boards', permanent: false } }
  return { redirect: { destination: '/login', permanent: false } }
}
