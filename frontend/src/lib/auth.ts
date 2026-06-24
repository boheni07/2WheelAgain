import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import NaverProvider from "next-auth/providers/naver";
import KakaoProvider from "next-auth/providers/kakao";

declare module "next-auth" {
  interface User {
    role: string;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      imageUrl?: string | null;
      role: string;
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter as any,
  session: { strategy: "jwt" },
  providers: [
    NaverProvider({
      clientId: process.env.NAVER_CLIENT_ID!,
      clientSecret: process.env.NAVER_CLIENT_SECRET!,
    }),
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      (session as { user: { role: string } }).user.role = token.role as string;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
