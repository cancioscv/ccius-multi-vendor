import type { ComponentType } from "react";

interface IconProps {
  className?: string;
}
interface Props {
  title: string;
  count: number;
  icon: ComponentType<IconProps>;
}
export default function StatCard({ title, count, icon: Icon }: Props) {
  return (
    <div className="bg-white p-5 rounded-md shadow-sm border border-gray-100 flex items-center justify-between">
      <div>
        <h3 className="text-sm text-gray-500">{title}</h3>
        <p className="text-2xl font-bold text-gray-800">{count}</p>
      </div>
      <Icon className="w-10 h-10 text-blue-500" />
    </div>
  );
}
