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
}

export default function NavItem({ label, icon: Icon, active, danger, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition ${
        active ? "bg-blue-100 text-blue-600" : danger ? "text-red-500 hover:bg-red-50" : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}
