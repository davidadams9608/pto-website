import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Westmont PTO",
  description: "Westmont Elementary School Parent Teacher Organization",
  icons: {
    icon: [
      { url: '/westmont-logo.svg', type: 'image/svg+xml', media: '(prefers-color-scheme: light)' },
      { url: '/westmont-logo-white.svg', type: 'image/svg+xml', media: '(prefers-color-scheme: dark)' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${jakarta.variable} font-[family-name:var(--font-jakarta)] antialiased`}>
        {children}
      </body>
    </html>
  );
}
