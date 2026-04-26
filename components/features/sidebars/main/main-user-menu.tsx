'use client'

import Link from 'next/link'
import {
  ChevronsUpDownIcon,
  LogInIcon,
  LogOutIcon,
  SunIcon,
} from 'lucide-react'
import { useTheme } from 'next-themes'

import { useMounted } from '@/hooks/use-mounted'

import {
  UserAvatar,
  UserAvatarSkeleton,
} from '@/components/features/user/user-avatar'
import { SidebarMenuButton } from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Props {
  user: {
    name: string
    email: string
    image?: string | null
  } | null
  isPending: boolean
  onLogout: () => void
  isLoggingOut: boolean
}

export const MainUserMenu = ({
  user,
  isPending,
  onLogout,
  isLoggingOut,
}: Props) => {
  const { setTheme } = useTheme()
  const mounted = useMounted()

  if (!mounted || isPending) {
    return (
      <SidebarMenuButton className="py-6">
        <UserAvatarSkeleton />
      </SidebarMenuButton>
    )
  }

  if (!user) {
    return (
      <SidebarMenuButton asChild className="py-5">
        <Link href="/sign-in">
          <LogInIcon />
          <span>Sign in</span>
        </Link>
      </SidebarMenuButton>
    )
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild className="py-6">
        <SidebarMenuButton>
          <UserAvatar name={user.name} email={user.email} image={user.image} />
          <ChevronsUpDownIcon className="ml-auto" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 space-y-2">
        <DropdownMenuLabel>
          <UserAvatar name={user.name} email={user.email} image={user.image} />
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout} disabled={isLoggingOut}>
          <LogOutIcon />
          <span>Sign out</span>
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <SunIcon />
            <span>Theme</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => setTheme('light')}>
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                System
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
