"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Utensils,
  Package,
  BarChart,
  Users,
  Settings,
  LogOut,
  User as UserIcon,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { signOut, useSession } from "next-auth/react";

interface SidebarProps {
  open: boolean;
  setOpen: (o: boolean) => void;
}

export default function Sidebar({ open, setOpen }: SidebarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  const menuItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/admin", permission: null },
    { label: "POS", icon: ShoppingCart, path: "/admin/pos", permission: null },
    { label: "Orders", icon: ShoppingCart, path: "/admin/orders", permission: null },
    { label: "Menu", icon: Utensils, path: "/admin/menu", permission: null },
    { label: "Inventory", icon: Package, path: "/admin/inventory", permission: null },
    { label: "Sales", icon: BarChart, path: "/admin/sales", permission: null },
    { label: "User Management", icon: Users, path: "/admin/users", permission: null },
  ];

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: open ? 0 : -300 }}
        transition={{ type: "tween", duration: 0.3 }}
        className="fixed top-0 left-0 z-50 h-full w-64 bg-[#776B5D] text-[#F3EEEA] flex flex-col"
      >
        {/* Top */}
        <div>
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#B0A695]">
            <h2 className="text-2xl font-bold">Coffee Win</h2>
            <button
              onClick={() => setOpen(false)}
              className="p-2 rounded-md bg-[#B0A695] hover:bg-[#B0A695]/80"
            >
              <X className="text-[#F3EEEA]" />
            </button>
          </div>

          <nav className="flex flex-col p-4 space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  pathname === item.path
                    ? "bg-[#F3EEEA] text-[#776B5D]"
                    : "bg-[#776B5D] text-[#F3EEEA] hover:bg-[#B0A695] border border-[#B0A695]"
                }`}
              >
                <item.icon
                  className={`w-6 h-6 ${
                    pathname === item.path ? "text-[#776B5D]" : "text-[#F3EEEA]"
                  }`}
                />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom / User Info */}
        <div className="mt-auto flex flex-col p-3 gap-4 bg-[#EBE3D5] rounded-t-lg">
          <div className="flex items-center border-b border-[#B0A695] pb-4 gap-3">
            <div className="relative w-14 h-14 bg-[#F3EEEA] rounded-full flex items-center justify-center">
              <div className="absolute inset-1 border-2 border-[#776B5D] rounded-full" />
              <UserIcon className="w-6 h-6 text-[#776B5D]" />
            </div>
            <div className="flex flex-col justify-center gap-1">
              <p className="text-[#776B5D] font-normal text-base leading-6">
                {session?.user?.name ?? "Guest"}
              </p>
              <p className="text-[#776B5D] font-normal text-sm leading-4">
                {session?.user?.role ?? "User"}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Link
              href="/admin/settings"
              className="flex items-center gap-2 w-full h-10 px-3 bg-[#776B5D] rounded-lg text-[#F3EEEA] text-sm hover:bg-[#776B5D]/90 transition-colors"
            >
              <Settings className="w-5 h-5" />
              <span className="font-normal">Settings</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full h-10 px-3 bg-[#776B5D] rounded-lg text-[#F3EEEA] text-sm hover:bg-[#776B5D]/90 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-normal">Sign Out</span>
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
