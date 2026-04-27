import { cn } from '@/lib/utils'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useSidebar } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface Props {
  name: string
  email: string
  image?: string | null | undefined
  className?: string
}

export const UserAvatar = ({ name, image, email, className }: Props) => {
  const { open } = useSidebar()
  return (
    <div className="flex items-center gap-2">
      <Avatar className={cn('h-9 w-9', !open && 'h-5 w-5', className)}>
        <AvatarImage src={image || ''} />
        <AvatarFallback className="bg-violet-700 text-white">
          {name[0].toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <Tooltip>
          <TooltipTrigger asChild>
            <span>{name}</span>
          </TooltipTrigger>
          <TooltipContent>
            <span className="text-sm font-medium truncate">{name}</span>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>{email}</span>
          </TooltipTrigger>
          <TooltipContent>
            <span className="text-xs text-muted-foreground truncate">
              {email}
            </span>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}

export const UserAvatarSkeleton = () => {
  return (
    <div className="flex items-center gap-2">
      <Skeleton className="h-9 w-9 rounded-full" />
      <div className="flex flex-col gap-y-1">
        <Skeleton className="w-10 h-3" />
        <Skeleton className="w-20 h-3" />
      </div>
    </div>
  )
}
