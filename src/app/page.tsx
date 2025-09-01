"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.ok) {
      // Get session to check role
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();

      switch (session.user.role) {
        case "ADMIN":
          router.push("/admin");
          break;
        case "CASHIER":
          router.push("/cashier");
          break;
        case "BARISTA":
          router.push("/barista");
          break;
        default:
          router.push("/");
      }
    } else {
      alert("Invalid login credentials");
    }
  }

  return (
    <form
      onSubmit={handleLogin}
      className="flex flex-col gap-4 max-w-sm mx-auto mt-20"
    >
      <input
        type="email"
        placeholder="Email"
        className="border p-2 rounded"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        className="border p-2 rounded"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        type="submit"
        className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
      >
        Login
      </button>
    </form>
  );
}
