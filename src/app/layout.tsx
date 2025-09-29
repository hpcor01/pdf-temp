import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { UpdateToast } from "@/components/update-toast";
import { I18nProvider } from "@/providers/i18n-provider";
import { KanbanProvider } from "@/providers/kanban-provider";
import { PreviewProvider } from "@/providers/preview-provider";
import { PreviewerProvider } from "@/providers/previewer-provider";
import { ThemeProvider } from "@/providers/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Editor de Imagem | Archí",
  description:
    "Editor de Imagem | Archí é um poderoso editor de imagens estilo KanBan onde você pode organizar suas imagens de forma simples e intuitiva, remover fundo e converter para PDF.",
  icons: {
    icon: "/assets/icon-editor-de-imagem-archi.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://api.remove.bg" />
        <link
          rel="preconnect"
          href="https://axvaplbwrlcl.compat.objectstorage.sa-vinhedo-1.oraclecloud.com"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <I18nProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <PreviewProvider>
              <PreviewerProvider>
                <KanbanProvider>{children}</KanbanProvider>
              </PreviewerProvider>
            </PreviewProvider>
            <Analytics />
            <SpeedInsights />
          </ThemeProvider>
          <UpdateToast />
        </I18nProvider>
      </body>
    </html>
  );
}
