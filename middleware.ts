import { default as nextAuthMiddleware } from "next-auth/middleware"

const isPublicRoute = (request) => {
  const publicRoutes = ["/sign-in(.*)", "/sign-up(.*)", "/share/(.*)"]
  return publicRoutes.some((route) => new RegExp(route).test(request.nextUrl.pathname))
}

export default nextAuthMiddleware(async (request) => {
  if (!isPublicRoute(request)) {
    // Handle protected routes here
  }
})

export const config = {
  matcher: [
    "/((?!_next|auth|share|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
