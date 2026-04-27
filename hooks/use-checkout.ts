'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function useCheckout() {
  const router = useRouter()

  async function redirectToCheckout() {
    const res = await fetch('/api/stripe/checkout', { method: 'POST' })
    const data = await res.json()
    if (data.url) {
      router.push(data.url)
    } else {
      toast.error('チェックアウトの開始に失敗しました')
    }
  }

  async function redirectToPortal() {
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) {
      router.push(data.url)
    } else {
      toast.error('ポータルの開始に失敗しました')
    }
  }

  return { redirectToCheckout, redirectToPortal }
}
