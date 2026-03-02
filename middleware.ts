import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Update session and get response
  const response = await updateSession(request)

  // Get the pathname
  const { pathname } = request.nextUrl

  // Define protected routes
  const protectedRoutes = ['/dashboard', '/play', '/progress', '/admin']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  // If it's a protected route, check for session
  if (isProtectedRoute) {
    const supabase = {
      auth: {
        getUser: async () => {
          // The session is already updated above, so we just need to check cookies
          const userCookie = request.cookies.get('sb-user')
          return { data: { user: userCookie ? JSON.parse(userCookie.value) : null } }
        }
      }
    }

    // For actual implementation, we'd need to verify the session properly
    // This is a simplified version - the actual auth check happens in the pages
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
