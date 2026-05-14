import type { ComponentType } from "react";

interface IconProps {
  className?: string;
}

interface Props {
  title: string;
  description: string;
  icon: ComponentType<IconProps>;
}

export default function QuickActionCard({ title, description, icon: Icon }: Props) {
  return (
    <div className="bg-white cursor-pointer p-4 rounded-xl border border-gray-100 shadow-sm flex items-start gap-3 hover:border-orange-100 hover:shadow-md transition">
      <div className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-[#e07b39]" />
      </div>
      <div>
        <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
    </div>
  );
}
