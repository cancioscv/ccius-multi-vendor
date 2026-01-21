import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface Props {
  title: string;
}
export default function Breadcrumbs({ title }: Props) {
  return (
    <div className="w-full text-white flex items-center">
      <Link href="/dashboard" className="text-blue-400 cursor-pointer">
        Dashboard
      </Link>
      <ChevronRight size={20} className="opacity-[.8]" />
      <span>{title}</span>
    </div>
  );
}
