import type { ComponentType } from "react";

interface IconProps {
  className?: string;
}

interface Props {
  label: string;
  active?: boolean;
  icon: ComponentType<IconProps>;
  danger?: boolean;
  onClick: () => void;
  badge?: number;
}

export default function NavItem({ label, icon: Icon, active, danger, onClick, badge }: Props) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition ${
        active ? "bg-orange-50 text-[#e07b39]" : danger ? "text-red-500 hover:bg-red-50" : "text-gray-600 hover:bg-gray-50"
      }`}
    >
      <span className="flex items-center gap-2.5">
        <Icon className={`w-4 h-4 ${active ? "text-[#e07b39]" : danger ? "text-red-500" : "text-gray-400"}`} />
        {label}
      </span>
      {badge !== undefined && badge > 0 && (
        <span className="bg-[#e07b39] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
          {badge}
        </span>
      )}
    </button>
  );
}
