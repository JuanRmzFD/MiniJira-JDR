import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Kanban } from 'lucide-react'
import { sessionStore } from '@/features/auth/store/sessionStore'
import { useLogin } from '@/features/auth/hooks/useLogin'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'

const loginSchema = z.object({
  email:    z.string().min(1, 'El email es requerido').email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
})

type LoginFields = z.infer<typeof loginSchema>

export function LoginPage() {
  const user     = sessionStore((s) => s.user)
  const navigate = useNavigate()
  const { login, isPending } = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFields>({ resolver: zodResolver(loginSchema) })

  useEffect(() => {
    if (user) navigate('/board', { replace: true })
  }, [user, navigate])

  const onSubmit = async (data: LoginFields) => {
    try {
      const loggedUser = await login(data.email, data.password)
      sessionStore.getState().setUser(loggedUser)
      navigate('/board', { replace: true })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al iniciar sesión'
      setError('root', { message })
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ds-surface px-4">
      <Card className="w-full max-w-sm shadow-modal rounded-lg border border-ds-outline-variant bg-ds-surface-container-lowest">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-ds-primary">
            <Kanban className="h-6 w-6 text-ds-on-primary" />
          </div>
          <CardTitle className="text-h2 text-ds-on-surface">Mini Jira</CardTitle>
          <CardDescription className="text-body-sm text-ds-on-surface-variant">
            Herramienta interna de gestión de tickets
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-body-sm font-medium text-ds-on-surface"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@empresa.com"
                autoComplete="email"
                autoFocus
                {...register('email')}
              />
              {errors.email && (
                <p className="text-body-sm text-ds-error">{errors.email.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-body-sm font-medium text-ds-on-surface"
              >
                Contraseña
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-body-sm text-ds-error">{errors.password.message}</p>
              )}
            </div>

            {errors.root && (
              <p className="text-body-sm text-ds-error text-center rounded bg-ds-error-container px-3 py-2">
                {errors.root.message}
              </p>
            )}

            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-ds-primary text-ds-on-primary hover:bg-ds-primary-container text-btn mt-1"
            >
              {isPending ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
