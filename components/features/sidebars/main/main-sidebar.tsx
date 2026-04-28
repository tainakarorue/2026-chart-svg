'use client'

import Link from 'next/link'
import Image from 'next/image'
import { CrownIcon, FileIcon, Home } from 'lucide-react'

import { authClient } from '@/lib/auth-client'
import { useSafeLogout } from '@/hooks/use-safe-logout'
import { useCheckout } from '@/hooks/use-checkout'
import { useTRPC } from '@/trpc/client'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

import { MainUserMenu } from './main-user-menu'

// Menu items.
const items = [
  {
    title: 'ホーム',
    url: '/',
    icon: Home,
  },
]
const userItems = [
  {
    title: 'ダッシュボード',
    url: '/dashboard',
    icon: FileIcon,
  },
]

export const MainSidebar = () => {
  const { data: session, isPending: userIsPending } = authClient.useSession()
  const { logout, isLoading: logoutIsLoading } = useSafeLogout()
  const { redirectToPortal } = useCheckout()
  const router = useRouter()
  const trpc = useTRPC()
  const { data: subscriptionStatus, isPending: subscriptionIsPending } =
    useQuery(
      trpc.subscription.getStatus.queryOptions(undefined, {
        enabled: !!session?.user,
      }),
    )
  const isProActive = subscriptionStatus?.isActive ?? false

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="py-5">
                    <Link href="/">
                      <Image
                        src="/logos/logo.svg"
                        alt="Logo"
                        width={24}
                        height={24}
                        style={{ width: '32px', height: '32px' }}
                      />
                      <span>To Grapher</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>メニュー</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="py-5">
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {session && (
          <SidebarGroup>
            <SidebarGroupLabel>ユーザー</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {userItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="py-5">
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {session && !subscriptionIsPending && (
          <SidebarGroup>
            <SidebarGroupLabel>プラン</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {isProActive ? (
                  <>
                    <SidebarMenuItem>
                      <SidebarMenuButton className="py-5 pointer-events-none">
                        <CrownIcon />
                        <span>プロプラン</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        className="py-5"
                        onClick={redirectToPortal}
                      >
                        <CrownIcon />
                        <span>サブスクリプション管理</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </>
                ) : (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      className="py-5"
                      onClick={() => router.push('/upgrade')}
                    >
                      <CrownIcon />
                      <span>プロプランにアップグレード</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <MainUserMenu
              user={session?.user ?? null}
              isPending={userIsPending}
              onLogout={logout}
              isLoggingOut={logoutIsLoading}
              isProActive={isProActive}
              isSubscriptionPending={subscriptionIsPending}
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
