import { Poppins, Roboto } from "next/font/google";
import Header from "@/shared/widgets";
import "./global.css";

export const metadata = {
  title: "ccius",
  description: "Ccius E-commerce",
};

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
  variable: "--font-roboto",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${roboto.variable} ${poppins.variable} antialiased`}>
        <Header />
        {children}
      </body>
    </html>
  );
}
