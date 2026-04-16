import { Poppins, Roboto, Oregano, Jost, Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./global.css";
import Header from "@/shared/widgets/header";
import Providers from "./providers";
import { ToastContainer } from "react-toastify";
import Footer from "@/shared/widgets/footer";

export const metadata = {
  title: "Ccius User",
  description: "Ccius Marketplace",
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

const oregano = Oregano({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-oregano",
});

const jost = Jost({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-jost",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-heading",
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`antialiased ${roboto.variable} ${poppins.variable}  ${oregano.variable} ${jost.variable} ${inter.variable} ${jakarta.variable} bg-[#f5f5f5]`}
      >
        <Providers>
          <Header />
          <main className="max-w-[1370px] mx-auto px-4">{children}</main> <Footer />
          <ToastContainer position="bottom-right" />
        </Providers>
      </body>
    </html>
  );
}
