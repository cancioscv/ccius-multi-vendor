import TitleBorder from "@/assets/svgs/title-border";
import React from "react";

interface Props {
  title: string;
}
export default function SectionTitle({ title }: Props) {
  return (
    <div className="relative">
      <h1 className="md:text-3xl text-xl relative z-10 font-semibold">{title}</h1>
      <TitleBorder clasname="absolute top-[46%]" />
    </div>
  );
}
