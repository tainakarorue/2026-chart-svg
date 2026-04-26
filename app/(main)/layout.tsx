import { MainSidebarProvider } from '@/components/features/sidebars/main/main-sidebar-provider'

interface Props {
  children: React.ReactNode
}

const Layout = ({ children }: Props) => {
  return (
    <MainSidebarProvider>
      <main className="w-full h-full">{children}</main>
    </MainSidebarProvider>
  )
}

export default Layout
