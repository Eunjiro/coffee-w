// components/dashboard/StatCard.tsx
import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  icon?: ReactNode;
  valueToday: number | string;
  valueWeek: number | string;
  valueMonth: number | string;
  changePercent?: string;
  iconBg?: string;
}

export default function StatCard({
  title,
  icon,
  valueToday,
  valueWeek,
  valueMonth,
  changePercent,
  iconBg = "bg-[#EBE3D5]",
}: StatCardProps) {
  return (
    <div className="flex flex-col p-4 gap-3 w-full max-w-[336px] mx-auto bg-white rounded-xl shadow">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-[#776B5D] font-medium text-sm sm:text-base">{title}</h3>
        {icon && (
          <div className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full ${iconBg}`}>
            {icon}
          </div>
        )}
      </div>

      {/* Total Value */}
      <div className="flex flex-col border-b border-[#B0A695] pb-4">
        <span className="text-[#776B5D] font-bold text-xl sm:text-2xl">{valueToday}</span>
        {changePercent && <span className="text-green-500 text-xs">{changePercent}</span>}
      </div>

      {/* Breakdown */}
      <div className="flex justify-between">
        <span className="text-[#776B5D] text-xs">Today</span>
        <span className="text-[#776B5D] text-xs font-bold">{valueToday}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-[#776B5D] text-xs">This Week</span>
        <span className="text-[#776B5D] text-xs font-bold">{valueWeek}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-[#776B5D] text-xs">This Month</span>
        <span className="text-[#776B5D] text-xs font-bold">{valueMonth}</span>
      </div>
    </div>
  );
}