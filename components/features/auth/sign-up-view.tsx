'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FcGoogle } from 'react-icons/fc'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, Controller } from 'react-hook-form'
import { OctagonAlertIcon } from 'lucide-react'
import { toast } from 'sonner'

import { authClient } from '@/lib/auth-client'

import {
  Field,
  FieldLabel,
  FieldError,
  FieldGroup,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertTitle } from '@/components/ui/alert'

const formSchema = z
  .object({
    name: z.string().min(1, '名前を入力してください'),
    email: z.string().email('有効なメールアドレスを入力してください'),
    password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'パスワードが一致しません',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof formSchema>

export const SignUpView = () => {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setError(null)

    await authClient.signUp.email(
      {
        name: data.name,
        email: data.email,
        password: data.password,
        callbackURL: '/',
      },
      {
        onSuccess: () => {
          router.push('/')
        },
        onError: ({ error }) => {
          toast.error(error.message)
          setError(error.message)
        },
      },
    )
  }

  const signInGoogle = async () => {
    await authClient.signIn.social(
      {
        provider: 'google',
      },
      {
        onSuccess: () => {
          router.push('/')
        },
        onError: () => {
          toast.error('Something went wrong')
        },
      },
    )
  }

  const isSubmitting = form.formState.isSubmitting

  return (
    <form id="suf-form" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-y-6">
        <div className="flex flex-col items-center text-center gap-2">
          <h1 className="text-3xl font-bold">サインアップ</h1>
          <p className="text-muted-foreground text-balance">
            新しいアカウントを作成してください
          </p>
        </div>

        <FieldGroup>
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="suf-name">名前</FieldLabel>
                <Input
                  {...field}
                  id="suf-name"
                  type="text"
                  placeholder="John Due"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="suf-email">メールアドレス</FieldLabel>
                <Input
                  {...field}
                  id="suf-email"
                  type="email"
                  placeholder="mail@example.com"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="suf-password">パスワード</FieldLabel>
                <Input
                  {...field}
                  id="suf-password"
                  type="password"
                  placeholder="••••••••"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="confirmPassword"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="suf-confirm-password">
                  パスワード（確認）
                </FieldLabel>
                <Input
                  {...field}
                  id="suf-confirm-password"
                  type="password"
                  placeholder="••••••••"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>

        {!!error && (
          <Alert className="bg-rose-100 border-none text-rose-500">
            <OctagonAlertIcon className="size-4" />
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? '作成中...' : 'アカウントを作成'}
        </Button>

        <Button
          onClick={signInGoogle}
          variant="outline"
          className="w-full"
          type="button"
          disabled={isSubmitting}
        >
          <FcGoogle className="size-5 mr-2" />
          Continue with Google
        </Button>

        <p className="text-sm text-muted-foreground text-center">
          アカウントをお持ちの方は
          <br />
          <Link
            href="/sign-in"
            className="underline underline-offset-4 hover:text-primary"
          >
            サインイン
          </Link>
        </p>
      </div>
    </form>
  )
}
