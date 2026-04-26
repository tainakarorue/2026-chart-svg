'use client'

import { useCallback, useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type ConfirmDialogProps = {
  title?: React.ReactNode
  description?: React.ReactNode
}

export const useConfirmDialog = ({
  title = 'Caution',
  description = 'Are you sure you want to do this?',
}: ConfirmDialogProps) => {
  const [open, setOpen] = useState(false)
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(
    null
  )
  const [promise, setPromise] = useState<Promise<boolean> | null>(null)

  const confirm = useCallback(() => {
    // 🔒 同時呼び出しガード
    if (promise) return promise

    setOpen(true)

    const p = new Promise<boolean>((resolve) => {
      setResolver(() => resolve)
    })

    setPromise(p)
    return p
  }, [promise])

  const close = (result: boolean) => {
    resolver?.(result)
    setResolver(null)
    setPromise(null)
    setOpen(false)
  }

  const ConfirmDialog = () => (
    <AlertDialog open={open} onOpenChange={(v) => !v && close(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => close(false)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={() => close(true)}>
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

  return {
    confirm,
    ConfirmDialog,
  }
}
