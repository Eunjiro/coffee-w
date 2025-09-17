import NextAuth, { NextAuthOptions, Session, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient, users as PrismaUser } from "@prisma/client";
import bcrypt from "bcrypt";
import { JWT } from "next-auth/jwt";

const prisma = new PrismaClient();

// Extend types for JWT and Session
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: "ADMIN" | "CASHIER" | "BARISTA";
      username: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: "ADMIN" | "CASHIER" | "BARISTA";
    username: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name: string;
    role: "ADMIN" | "CASHIER" | "BARISTA";
    username: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.username || !credentials?.password) return null;

        // Try username first, then fallback to email
        let user: PrismaUser | null = await prisma.users.findUnique({
          where: { username: credentials.username },
        });

        if (!user) {
          user = await prisma.users.findUnique({
            where: { email: credentials.username },
          });
        }

        if (!user) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          role: user.role as "ADMIN" | "CASHIER" | "BARISTA",
          username: user.username,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }): Promise<JWT> {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role as "ADMIN" | "CASHIER" | "BARISTA";
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }): Promise<Session> {
      if (session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.role = token.role as "ADMIN" | "CASHIER" | "BARISTA";
        session.user.username = token.username;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
  pages: { signIn: "/" },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
