import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../api/auth/[...nextauth]/route";
import AdminDashboardClient from "./components/AdminDashboardClient";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/");
  if (session.user.role !== "ADMIN") redirect("/unauthorized");

  return <AdminDashboardClient />;
}
