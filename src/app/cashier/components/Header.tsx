import { Menu, ShoppingCart } from "lucide-react";

interface HeaderProps {
  setOpen: (o: boolean) => void;
  cartOpen: boolean;
  setCartOpen: (o: boolean) => void;
  cartCount: number;
}

export default function Header({ setOpen, cartOpen, setCartOpen, cartCount }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-3 bg-[#776B5D] text-[#F3EEEA]">
      {/* Left: Menu Button + Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-full bg-[#B0A695]"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Coffee Win</h1>
      </div>

      {/* Right: Cart Button */}
      <div className="relative">
        <button
          onClick={() => setCartOpen(!cartOpen)}
          className="p-2 rounded-full bg-[#B0A695]"
        >
          <ShoppingCart className="w-5 h-5" />
        </button>

        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {cartCount}
          </span>
        )}
      </div>
    </header>
  );
}
