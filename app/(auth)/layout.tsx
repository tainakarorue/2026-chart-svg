import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

import { Card, CardContent } from '@/components/ui/card'

interface Props {
  children: React.ReactNode
}

const Layout = async ({ children }: Props) => {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session) redirect('/')

  return (
    <div className="w-full min-h-svh flex flex-col items-center justify-center p-6 md:p-8">
      <Card className="w-full max-w-[320px]">
        <CardContent className="px-6">{children}</CardContent>
      </Card>
    </div>
  )
}

export default Layout
