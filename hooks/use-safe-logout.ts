'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { authClient } from '@/lib/auth-client'

export function useSafeLogout() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [isLoading, setIsLoading] = useState(false)

  const logout = async () => {
    setIsLoading(true)
    try {
      // 1) サインアウト
      await authClient.signOut()
      // 2) React Query キャッシュ削除
      queryClient.clear()
      // 3) 画面遷移
      toast.success('キャッシュの削除に成功しました')

      router.replace('/sign-in')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('ログアウト中に問題が発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  return { logout, isLoading }
}
