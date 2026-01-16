import { Inter, Poppins } from "next/font/google";
import { AuthProviderWrapper } from "../components/providers/AuthProviderWrapper";
// import { ChatBotButton } from "../components/ui/ChatBotButton";
import { TokenExpirationNotification } from "../components/ui/TokenExpirationNotification";
import { ChatBotScripts } from "../components/layout/ChatBotScripts";
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

        {/* Botpress Webchat Scripts (Condicionales) */}
        <ChatBotScripts />
      </body>
    </html>
  );
}

