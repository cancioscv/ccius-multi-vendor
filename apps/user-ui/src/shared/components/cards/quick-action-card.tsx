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
    <div className="bg-white cursor-pointer p-4 rounded-md shadow-sm border border-gray-100 flex items-start gap-4">
      <Icon className="w-6 h-6 text-blue-500 mt-1" />
      <div>
        <h4 className="text-sm font-semibold text-gray-800 mb-1">{title}</h4>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
  );
}
