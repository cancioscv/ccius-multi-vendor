import "./global.css";
import Provider from "./provider";

export const metadata = {
  title: "Ccius Seller",
  description: "Ccius for Sellers",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Provider> {children}</Provider>
      </body>
    </html>
  );
}
