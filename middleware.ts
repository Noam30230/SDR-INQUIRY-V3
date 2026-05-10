import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const maintenance = process.env.MAINTENANCE_MODE === 'true'

  if (maintenance) {
    // Allow the maintenance page itself and its assets
    if (request.nextUrl.pathname === '/maintenance') return NextResponse.next()

    return NextResponse.redirect(new URL('/maintenance', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)'],
}
