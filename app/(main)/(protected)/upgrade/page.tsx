'use client'

import { CheckIcon } from 'lucide-react'
import { useCheckout } from '@/hooks/use-checkout'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const freePlanFeatures = [
  'データセット保存（最大5件）',
  'グラフの作成・編集',
  'SVGダウンロード',
]

const proPlanFeatures = [
  'データセット保存（無制限）',
  'グラフの作成・編集',
  'SVGダウンロード',
]

export default function UpgradePage() {
  const { redirectToCheckout } = useCheckout()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-16 gap-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">プランを選択</h1>
        <p className="text-muted-foreground text-sm">
          プロプランにアップグレードして、データセットを無制限に保存できます。
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
        {/* Free plan */}
        <Card>
          <CardHeader>
            <CardTitle>フリープラン</CardTitle>
            <CardDescription>無料でご利用いただけます</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-2xl font-bold">
              ¥0<span className="text-sm font-normal text-muted-foreground"> / 月</span>
            </p>
            <ul className="space-y-2 pt-2">
              {freePlanFeatures.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <CheckIcon className="size-4 text-muted-foreground shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" disabled>
              現在のプラン
            </Button>
          </CardFooter>
        </Card>

        {/* Pro plan */}
        <Card className="ring-2 ring-foreground">
          <CardHeader>
            <CardTitle>プロプラン</CardTitle>
            <CardDescription>制限なしで使いたい方へ</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-2xl font-bold">
              ¥550
              <span className="text-sm font-normal text-muted-foreground">
                {' '}/ 月（税込）
              </span>
            </p>
            <ul className="space-y-2 pt-2">
              {proPlanFeatures.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <CheckIcon className="size-4 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={redirectToCheckout}>
              アップグレード
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
