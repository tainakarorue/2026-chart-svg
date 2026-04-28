'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, Controller } from 'react-hook-form'
import { OctagonAlertIcon } from 'lucide-react'
import { toast } from 'sonner'
import { FcGoogle } from 'react-icons/fc'

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

const formSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
})

type FormValues = z.infer<typeof formSchema>

export const SignInView = () => {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: FormValues) => {
    setError(null)

    await authClient.signIn.email(
      {
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
    <form id="sif-form" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-y-6">
        <div className="flex flex-col items-center text-center gap-2">
          <h1 className="text-3xl font-bold">サインイン</h1>
          <p className="text-muted-foreground text-balance">
            アカウントにサインインしてください
          </p>
        </div>

        <FieldGroup>
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="sif-email">メールアドレス</FieldLabel>
                <Input
                  {...field}
                  id="sif-email"
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
                <FieldLabel htmlFor="sif-password">パスワード</FieldLabel>
                <Input
                  {...field}
                  id="sif-password"
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
          {isSubmitting ? 'サインイン中...' : 'サインイン'}
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
          アカウントをお持ちでない方は
          <br />
          <Link
            href="/sign-up"
            className="underline underline-offset-4 hover:text-primary"
          >
            サインアップ
          </Link>
        </p>
      </div>
    </form>
  )
}
