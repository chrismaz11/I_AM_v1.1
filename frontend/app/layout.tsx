import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "I AM Credential Wallet",
  description: "Secure credential wallet and verification platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#f7f8fb] text-ink-900`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
