import type { Metadata } from "next";
import { Space_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { CoachProvider } from "@/components/CoachProvider";

const helvena = localFont({
  src: [
    { path: "../public/fonts/Helvena-Regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/Helvena-Regular.woff", weight: "400", style: "normal" },
  ],
  variable: "--font-sans",
});

const foun = localFont({
  src: [
    { path: "../public/fonts/Foun.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/Foun.woff", weight: "400", style: "normal" },
  ],
  variable: "--font-display",
});

const groutpix = localFont({
  src: [
    { path: "../public/fonts/GroutpixFlow-Regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/GroutpixFlow-Regular.woff", weight: "400", style: "normal" },
  ],
  variable: "--font-brand",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Not Athletes Games",
  description: "Simple hands-free class controller for functional fitness sessions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${helvena.variable} ${foun.variable} ${groutpix.variable} ${spaceMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <CoachProvider>{children}</CoachProvider>
      </body>
    </html>
  );
}
