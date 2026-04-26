import { Card, CardContent } from '@/components/ui/card'

interface Props {
  children: React.ReactNode
}

const Layout = ({ children }: Props) => {
  return (
    <div className="w-full min-h-svh flex flex-col items-center justify-center p-6 md:p-8">
      <Card className="w-full max-w-[320px]">
        <CardContent className="px-6">{children}</CardContent>
      </Card>
    </div>
  )
}

export default Layout
