'use client';

import Header from "./Header";
import Sidenav from "./Sidenav";
import { ReactNode, useState } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#F3EEEA]">
      {/* Sidebar */}
      <Sidenav open={open} setOpen={setOpen} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-16">
        <Header setOpen={setOpen} />
        <main className="min-h-0 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
