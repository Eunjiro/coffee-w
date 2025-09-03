'use client';

import Link from "next/link";
import { LayoutDashboard, ShoppingCart, ClipboardList, Settings, LogOut, UserIcon } from "lucide-react";
import { motion } from "framer-motion";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function BaristaSidenav({ open, setOpen }: { open: boolean; setOpen: (o: boolean) => void }) {
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <>
      {/* Overlay */}
      {open && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: open ? 0 : -300 }}
        transition={{ type: "tween", duration: 0.3 }}
        className="fixed top-0 left-0 z-50 h-full w-64 bg-[#776B5D] text-[#F3EEEA] flex flex-col"
      >
        {/* Top */}
        <div>
          <div className="flex items-center justify-between px-4 py-4 border-b border-[#B0A695]">
            <h2 className="text-xl font-bold">Coffee Win</h2>
            <button onClick={() => setOpen(false)} className="p-1 rounded-md bg-[#B0A695]">✕</button>
          </div>

          <nav className="flex flex-col p-4 space-y-2">
            <Link href="/cashier" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#B0A695]">
              <LayoutDashboard /> Dashboard
            </Link>
            <Link href="/cashier/pos" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#B0A695]">
              <ShoppingCart /> POS
            </Link>
            <Link href="/cashier/orders" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#B0A695]">
              <ClipboardList /> Orders
            </Link>
          </nav>
        </div>

        {/* Sidebar Bottom */}
        <div className="mt-auto flex flex-col p-3 gap-4 bg-[#EBE3D5] rounded-t-lg">
          {/* User Info */}
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

          {/* Buttons */}
          <div className="flex flex-col gap-2">
            <button className="flex items-center gap-2 w-full h-10 px-3 bg-[#776B5D] rounded-lg text-[#F3EEEA]">
              <Settings className="w-5 h-5" />
              <span className="text-sm leading-4 font-normal">Settings</span>
            </button>

            <button
              onClick={() => {
                signOut({ redirect: false }).then(() => router.push("/"));
              }}
              className="flex items-center gap-2 w-full h-10 px-3 bg-[#776B5D] rounded-lg text-[#F3EEEA]"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm leading-4 font-normal">Sign Out</span>
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
