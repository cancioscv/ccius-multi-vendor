import "./global.css";
import Provider from "./provider";
import { ToastContainer } from "react-toastify";

import { Poppins } from "next/font/google";

export const metadata = {
  title: "Ccius Seller",
  description: "Ccius for Sellers",
};

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
});
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`min-h-screen bg-slate-900 font-sans antialiased ${poppins.variable}`}>
        <Provider>
          {children}
          <ToastContainer position="bottom-right" />
        </Provider>
      </body>
    </html>
  );
}
