import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tindr for Games",
  description: "Discover your next game.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
