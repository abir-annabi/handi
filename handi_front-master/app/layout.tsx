import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AccessibilityProvider } from "@/components/accessibility-provider";
import { AccessibilityWidget } from "@/components/accessibility-widget";
import { I18nProvider } from "@/components/i18n-provider";

// Configure Outfit font for headings
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

// Configure Plus Jakarta Sans font for body text
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "HandiTalents",
  description: "Inclusive hiring platform with accessible recruitment flows and account verification.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`app-theme ${outfit.variable} ${plusJakartaSans.variable}`} suppressHydrationWarning>
        <a href="#main-content" className="skip-link">
          Aller au contenu principal
        </a>
        <I18nProvider>
          <AccessibilityProvider>
            <div id="main-content" tabIndex={-1}>
              {children}
            </div>
            <AccessibilityWidget />
          </AccessibilityProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
