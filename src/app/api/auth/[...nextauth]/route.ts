import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
    if (!credentials?.email || !credentials?.password) return null;

    // Find user by email
    const user = await prisma.users.findUnique({
        where: { email: credentials.email },
    });

    if (!user) return null;

    const isValid = await bcrypt.compare(credentials.password, user.password);
    if (!isValid) return null;

    return { 
        id: String(user.id), 
        email: user.email, 
        role: user.role, 
        name: user.name 
    };
}

        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
                token.name = user.name;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = (token.id as string) ?? "";
                session.user.role = (token.role as "ADMIN" | "CASHIER" | "BARISTA") ?? "BARISTA";
                session.user.name = (token.name as string) ?? "";
                session.user.email = (token.email as string) ?? "";
            }
            return session;
        }
    },
    session: { strategy: "jwt" },
    pages: { signIn: "/" },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
