import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Menu, Search, Bell } from "lucide-react";

export default function Header({ setOpen }: { setOpen: (o: boolean) => void }) {
  const { data: session } = useSession();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      };
      setDate(now.toLocaleDateString(undefined, options));
      setTime(now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }));
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <header className="flex justify-between items-center bg-[#776B5D] shadow px-6 py-4 w-full">
      {/* Left */}
      <div className="flex items-center gap-3">
        <span className="ml-1 font-bold text-[#F3EEEA] text-2xl">{session?.user?.name ?? ""}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center bg-[#F3EEEA] shadow px-4 py-2 rounded-xl w-[350px]">
          <Search className="mr-2 w-5 h-5 text-[#776B5D]" />
          <input
            type="text"
            placeholder="Search Anything..."
            className="bg-transparent outline-none w-full text-[#776B5D] placeholder:text-[#776B5D]/60"
          />
        </div>
        <div className="bg-[#F3EEEA] shadow px-4 py-2 rounded-lg font-medium text-[#776B5D] text-sm">{date}</div>
        <div className="bg-[#F3EEEA] shadow px-4 py-2 rounded-lg font-medium text-[#776B5D] text-sm">{time}</div>
        <button className="flex justify-center items-center bg-[#F3EEEA] hover:bg-[#B0A695]/20 shadow p-2 rounded-full transition-colors">
          <Bell className="w-6 h-6 text-[#776B5D]" />
        </button>
      </div>
    </header>
  );
}
