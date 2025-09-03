import Image from "next/image";
import { Size } from "../types";

interface MenuCardProps {
  name: string;
  image?: string;
  type: string;
  status: string;
  sizes: Size[];
}

export default function MenuCard({ name, image, type, status, sizes }: MenuCardProps) {
  const fallbackImage = "/placeholder.png";

  return (
    <div className="w-[213px] h-[377px] bg-white rounded-xl shadow-md p-2 flex flex-col">
      {/* Image Section */}
      <div className="w-[197px] h-[197px] bg-[#F3EEEA] rounded-lg shadow flex items-center justify-center overflow-hidden">
        <Image
          src={image || fallbackImage}
          alt={image ? name : "Placeholder"}
          width={197}
          height={197}
          className="w-full h-full object-cover rounded-lg"
        />
      </div>

      {/* Info Section */}
      <div className="flex flex-col px-1 pt-3 gap-3 flex-1">
        <h2 className="font-bold text-2xl text-[#776B5D]">{name}</h2>

        <div className="flex justify-between text-sm">
          <span className="text-[#776B5D]">{type}</span>
          <span className={status === "Available" ? "text-green-500" : "text-red-500"}>
            {status}
          </span>
        </div>

        <div className="flex gap-2 mt-2">
          {sizes.map((size, idx) => (
            <div
              key={idx}
              className="flex justify-center items-center bg-[#776B5D] text-[#F3EEEA] rounded-lg px-2 py-1 flex-1 text-sm font-medium"
            >
              {size.label} ₱{size.price}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
