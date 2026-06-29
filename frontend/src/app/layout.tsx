import type { Metadata } from "next";
import { Barlow, Barlow_Condensed, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Penalty Shootout Predictor",
  description: "Advanced Bayesian Penalty Shootout Predictor. Analyze historical data, simulate matchups using Monte Carlo methods, and predict outcomes for any club or national team.",
  openGraph: {
    title: "Penalty Shootout Predictor",
    description: "Advanced Bayesian Penalty Shootout Predictor. Simulate matchups using Monte Carlo methods.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Penalty Shootout Predictor",
    description: "Advanced Bayesian Penalty Shootout Predictor. Simulate matchups using Monte Carlo methods.",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${barlow.variable} ${barlowCondensed.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#060812] text-[#DDE1ED]">{children}</body>
    </html>
  );
}
