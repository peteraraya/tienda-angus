import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error && error.name !== 'AuthSessionMissingError') {
    throw new Error(`No se pudo verificar la sesión: ${error.message}`)
  }

  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  const isProtectedApi = ['/api/upload', '/api/whatsapp/send'].includes(request.nextUrl.pathname)
  const isAdmin = user?.app_metadata?.role === 'admin'

  if ((isAdminRoute || isProtectedApi) && !isAdmin) {
    if (isProtectedApi) {
      return NextResponse.json(
        { error: user ? 'Acceso restringido al administrador' : 'Autenticación requerida' },
        { status: user ? 403 : 401 }
      )
    }

    const url = request.nextUrl.clone()
    url.pathname = '/login'
    if (user) url.searchParams.set('error', 'admin-required')
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
