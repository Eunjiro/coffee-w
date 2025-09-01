import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

// Extend the default User
declare module "next-auth" {
  interface User extends DefaultUser {
    id: string;
    role: "ADMIN" | "CASHIER" | "BARISTA";
    name: string;
    email: string;
  }

  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "CASHIER" | "BARISTA";
      name: string;
      email: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "CASHIER" | "BARISTA";
    name: string;
    email: string;
  }
}
