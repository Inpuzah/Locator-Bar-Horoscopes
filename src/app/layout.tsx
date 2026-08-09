import type { Metadata } from "next";
import { Press_Start_2P } from "next/font/google";
import "./globals.css";

const minecraftFont = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-minecraft",
});

export const metadata: Metadata = {
  title: "Minecraft Color Horoscope Reader",
  description: "A mystical, rainbow-touched fortune site that turns a Minecraft UUID into a glowing horoscope.",
  icons: {
    icon: "/assets/locator_bar_dot.png",
    shortcut: "/assets/locator_bar_dot.png",
    apple: "/assets/locator_bar_dot.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${minecraftFont.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
