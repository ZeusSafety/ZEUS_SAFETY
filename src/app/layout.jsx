import { Inter, Poppins } from "next/font/google";
import Script from "next/script";
import { AuthProviderWrapper } from "../components/providers/AuthProviderWrapper";
// import { ChatBotButton } from "../components/ui/ChatBotButton";
import { TokenExpirationNotification } from "../components/ui/TokenExpirationNotification";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const poppins = Poppins({
  weight: ["400", "500", "700"],
  variable: "--font-poppins",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Zeus Web",
  description: "Sistema de gestión Zeus",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body
        className={`${inter.variable} ${poppins.variable} font-sans antialiased`}
      >
        <AuthProviderWrapper>
          {children}
          {/* <ChatBotButton /> */}
          <TokenExpirationNotification />
        </AuthProviderWrapper>

        {/* Botpress Webchat Scripts */}
        <Script src="https://cdn.botpress.cloud/webchat/v3.5/inject.js" strategy="afterInteractive" />
        <Script src="https://files.bpcontent.cloud/2025/11/25/17/20251125173159-L7WG0LDO.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}

