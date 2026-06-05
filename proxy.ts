import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

// NextAuth's `auth` wrapper runs the `authorized` callback to gate routes.
export default auth;

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
