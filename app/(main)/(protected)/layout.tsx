import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'

interface Props {
  children: React.ReactNode
}

const ProtectedLayout = async ({ children }: Props) => {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/sign-in')
  return <>{children}</>
}

export default ProtectedLayout
