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
  display: "swap", // Add font display swap for better performance
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap", // Add font display swap for better performance
});

export const metadata: Metadata = {
  title: {
    default: "Editor de Imagem | Archí",
    template: "%s | Archí Image Editor",
  },
  description:
    "Editor de Imagem | Archí é um poderoso editor de imagens estilo KanBan onde você pode organizar suas imagens de forma simples e intuitiva, remover fundo e converter para PDF.",
  keywords: [
    "editor de imagem",
    "kanban",
    "organizar imagens",
    "remover fundo",
    "converter para PDF",
    "image editor",
    "kanban board",
    "background removal",
    "PDF converter",
  ],
  authors: [{ name: "Archí" }],
  creator: "Archí",
  publisher: "Archí",
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://web-editor-image.vercel.app",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://web-editor-image.vercel.app",
    title: "Editor de Imagem | Archí",
    description:
      "Editor de Imagem | Archí é um poderoso editor de imagens estilo KanBan onde você pode organizar suas imagens de forma simples e intuitiva, remover fundo e converter para PDF.",
    siteName: "Archí Image Editor",
    images: [
      {
        url: "/assets/icon-editor-de-imagem-archi.png",
        width: 1430,
        height: 1430,
        alt: "Archí Image Editor Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Editor de Imagem | Archí",
    description:
      "Editor de Imagem | Archí é um poderoso editor de imagens estilo KanBan onde você pode organizar suas imagens de forma simples e intuitiva, remover fundo e converter para PDF.",
    images: ["/assets/icon-editor-de-imagem-archi.png"],
    creator: "@archi",
  },
  icons: {
    icon: "/assets/icon-editor-de-imagem-archi.png",
    shortcut: "/assets/icon-editor-de-imagem-archi.png",
    apple: "/assets/icon-editor-de-imagem-archi.png",
  },
  manifest: "/manifest.json",
  metadataBase: new URL("https://web-editor-image.vercel.app"),
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
