'use client'

import { useEffect } from 'react'
import { useDashboardStore } from '@/lib/store/dashboard'
import { ChartUploadView } from '@/components/features/charts/views/chart-upload-view'

export function HomeView() {
  const resetFile = useDashboardStore((s) => s.resetFile)

  useEffect(() => {
    resetFile()
  }, [resetFile])

  return <ChartUploadView />
}
