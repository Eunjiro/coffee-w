import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../api/auth/[...nextauth]/route";

export default async function CashierPage() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/");
  if (session.user.role !== "CASHIER") redirect("/unauthorized");

  return <h1 className="text-xl">Welcome, CASHIER {session.user.name}!</h1>;
}
