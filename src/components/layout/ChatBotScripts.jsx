"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";

export function ChatBotScripts() {
    const pathname = usePathname();

    // No mostrar el chatbot en la página de login
    if (pathname === "/login") {
        return null;
    }

    return (
        <>
            <Script
                src="https://cdn.botpress.cloud/webchat/v3.5/inject.js"
                strategy="afterInteractive"
            />
            <Script
                src="https://files.bpcontent.cloud/2025/11/25/17/20251125173159-L7WG0LDO.js"
                strategy="afterInteractive"
            />
        </>
    );
}
