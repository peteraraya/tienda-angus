import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import FloatingSocialButtons from "./components/FloatingSocialButtons";
import { ToastProvider } from "./components/ui/ToastContainer";
import { CartProvider } from "./contexts/CartContext";
import ClientCartSidebar from "./components/ClientCartSidebar";
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
  title: {
    default: `${appConfig.company.name} | Uniformes Escolares y Reparaciones`,
    template: `%s | ${appConfig.company.name}`
  },
  description: "Especialistas en venta de buzos escolares, poleras, calzas y reparación de prendas en Quillota. Calidad garantizada para la exigencia escolar.",
  keywords: ["uniformes escolares", "buzos escolares", "reparación de ropa", "poleras polo", "ropa escolar Quillota", "confecciones Angus"],
  authors: [{ name: "Angus Confecciones" }],
  creator: "Angus Confecciones",
  openGraph: {
    type: "website",
    locale: "es_CL",
    url: "https://www.confeccionesangus.cl",
    title: `${appConfig.company.name} | Uniformes Escolares y Reparaciones`,
    description: "Especialistas en venta de buzos escolares, poleras, calzas y reparación de prendas en Quillota.",
    siteName: appConfig.company.name,
    images: [{
      url: "/logo-confecciones.png",
      width: 800,
      height: 600,
      alt: "Logo Confecciones Angus"
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${appConfig.company.name} | Uniformes Escolares`,
    description: "Venta de buzos escolares, poleras, calzas y reparación de prendas.",
    images: ["/logo-confecciones.png"],
  },
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
        {/* Schema.org JSON-LD para LocalBusiness */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ClothingStore",
              "name": "Angus Confecciones",
              "image": "https://www.confeccionesangus.cl/logo-confecciones.png",
              "description": "Venta de buzos escolares, poleras polo, short, calzas y reparación de prendas en general.",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "Pasaje Santa Olga 288",
                "addressLocality": "Quillota",
                "addressRegion": "Valparaíso",
                "addressCountry": "CL"
              },
              "telephone": "+56983852967",
              "openingHoursSpecification": [
                {
                  "@type": "OpeningHoursSpecification",
                  "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                  "opens": "12:00",
                  "closes": "19:00"
                },
                {
                  "@type": "OpeningHoursSpecification",
                  "dayOfWeek": "Saturday",
                  "opens": "12:00",
                  "closes": "17:00"
                }
              ],
              "priceRange": "$$"
            })
          }}
        />
        <CartProvider>
          <ToastProvider>
            <main className="min-h-screen">{children}</main>
            <FloatingSocialButtons />
            <ClientCartSidebar />
          </ToastProvider>
        </CartProvider>
      </body>
    </html>
  );
}
