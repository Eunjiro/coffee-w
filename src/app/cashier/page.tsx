import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../api/auth/[...nextauth]/route";
import CashierLayout from "./components/CashierLayout";

export default async function CashierPage() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/");
  if (session.user.role !== "CASHIER") redirect("/unauthorized");

  return (
    <CashierLayout>
      <div>
        <h1 className="text-xl">Welcome, CASHIER {session.user.name}!</h1>
      </div>
    </CashierLayout>
  )
}
