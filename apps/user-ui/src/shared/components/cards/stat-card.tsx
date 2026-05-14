import type { ComponentType } from "react";

interface IconProps {
  className?: string;
}

interface Props {
  title: string;
  count: number;
  icon: ComponentType<IconProps>;
  color?: "orange" | "blue" | "green";
}

const colorMap = {
  orange: {
    bg: "bg-orange-50",
    icon: "text-[#e07b39]",
    ring: "ring-orange-100",
  },
  blue: {
    bg: "bg-blue-50",
    icon: "text-blue-500",
    ring: "ring-blue-100",
  },
  green: {
    bg: "bg-green-50",
    icon: "text-green-500",
    ring: "ring-green-100",
  },
};

export default function StatCard({ title, count, icon: Icon, color = "orange" }: Props) {
  const colors = colorMap[color];

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold text-gray-400 tracking-wider uppercase mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{count}</p>
      </div>
      <div className={`w-12 h-12 rounded-full ${colors.bg} ring-4 ${colors.ring} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${colors.icon}`} />
      </div>
    </div>
  );
}
