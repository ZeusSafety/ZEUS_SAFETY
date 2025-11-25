import { Geist, Geist_Mono } from "next/font/google";
import { AuthProviderWrapper } from "../components/providers/AuthProviderWrapper";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Zeus Web",
  description: "Sistema de gestión Zeus",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProviderWrapper>
          {children}
        </AuthProviderWrapper>
      </body>
    </html>
  );
}

