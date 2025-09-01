import { Menu, Search, ShoppingCart, Bell } from "lucide-react";

export default function Header({ setOpen }: { setOpen: (o: boolean) => void }) {
  return (
    <header className="flex items-center justify-between px-6 py-3 bg-[#776B5D] text-[#F3EEEA]">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-full bg-[#B0A695]"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Coffee Win</h1>
      </div>
    </header>
  );
}
