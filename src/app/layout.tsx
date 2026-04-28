import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TRAM - Configuration",
  description: "TRAM AI Agent Configuration Generator",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen overflow-x-hidden antialiased bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
