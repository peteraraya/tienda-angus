import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import FloatingSocialButtons from "./components/FloatingSocialButtons";
import { ToastProvider } from "./components/ui/ToastContainer";
import { appConfig } from "@/config/app.config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${appConfig.company.name} - ${appConfig.company.tagline}`,
  description: appConfig.company.description,
  icons: {
    icon: appConfig.company.favicon,
    shortcut: appConfig.company.favicon,
    apple: appConfig.company.favicon,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (theme === 'dark' || (!theme && prefersDark)) {
                    document.documentElement.classList.add('dark');
                    try { document.body.classList.add('dark'); } catch(e){}
                  } else {
                    document.documentElement.classList.remove('dark');
                    try { document.body.classList.remove('dark'); } catch(e){}
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ToastProvider>
          <main className="min-h-screen">{children}</main>
          <FloatingSocialButtons />
        </ToastProvider>
      </body>
    </html>
  );
}
