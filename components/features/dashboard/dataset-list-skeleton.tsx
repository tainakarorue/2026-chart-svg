import { Skeleton } from '@/components/ui/skeleton'

export const DatasetListSkeleton = () => {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-none" />
      ))}
    </div>
  )
}
