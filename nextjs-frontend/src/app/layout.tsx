import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import { AppProvider } from "@/context/AppProvider.jsx";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "UPI ScamShield AI",
  description:
    "UPI ScamShield AI — AI-powered fraud detection and digital payment security. Detect. Analyze. Protect.",
};

export const viewport: Viewport = {
  themeColor: "#050507",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`h-full ${inter.variable} ${poppins.variable}`}
    >
      <body className="min-h-full">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
