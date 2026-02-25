"use client";
import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Modal } from "./ui";


const whatsappUrl = "https://wa.me/56983852967";
const instagramUrl = "https://www.instagram.com/confecciones_angus/";
const phoneUrl = "tel:+56983852967";
const mapUrl = "https://www.google.com/maps/place/O'Higgins+1384,+2261543+Quillota,+Valpara%C3%ADso/@-32.8925184,-71.2704,14z/data=!4m6!3m5!1s0x9689d278fe242b47:0x4ed3023dc9ea90be!8m2!3d-32.8933438!4d-71.2486881!16s%2Fg%2F11f64gkw2y?entry=ttu&g_ep=EgoyMDI2MDIyMi4wIKXMDSoASAFQAw%3D%3D";

export default function FloatingSocialButtons() {
  const [mapOpen, setMapOpen] = useState(false);
  const pathname = usePathname();
  
  // No mostrar en rutas de admin
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
            {/* WhatsApp */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center w-12 h-12 md:w-14 md:h-14 transition-all duration-200"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 md:w-8 md:h-8">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 2.042.613 3.938 1.664 5.527L2 22l4.473-1.664A9.953 9.953 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18c-1.657 0-3.22-.507-4.527-1.373l-.32-.21-2.66.988.988-2.66-.21-.32A7.963 7.963 0 014 12c0-4.418 3.582-8 8-8s8 3.582 8 8-3.582 8-8 8zm3.807-6.093c-.197-.099-1.167-.577-1.348-.643-.181-.066-.313-.099-.445.099-.132.198-.511.643-.627.775-.116.132-.231.148-.428.05-.197-.099-.832-.307-1.584-.98-.586-.522-.98-1.165-1.095-1.362-.116-.198-.013-.304.086-.403.088-.088.197-.231.296-.347.099-.116.132-.198.198-.33.066-.132.033-.247-.016-.346-.049-.099-.445-1.075-.609-1.473-.16-.384-.324-.332-.445-.338-.116-.006-.247-.008-.379-.008-.132 0-.346.049-.527.247-.181.198-.693.677-.693 1.653s.71 1.936.81 2.073c.099.132 1.397 2.137 3.393 2.899.475.164.845.262 1.135.338.476.121.91.104 1.254.063.382-.047 1.167-.478 1.333-.941.165-.462.165-.858.116-.957-.049-.099-.181-.148-.378-.247z" />
              </svg>
            </a>
            {/* Teléfono */}
            <a
              href={phoneUrl}
              aria-label="Llamar"
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center w-12 h-12 md:w-14 md:h-14 transition-all duration-200"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 md:w-8 md:h-8">
                <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1v3.5a1 1 0 01-1 1C7.61 21 3 16.39 3 11a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.24 1.01l-2.2 2.2z" />
              </svg>
            </a>

            {/* Mapa */}
            <button
              type="button"
              aria-label="Ver ubicación en Google Maps"
              className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-full shadow-lg flex items-center justify-center w-12 h-12 md:w-14 md:h-14 transition-all duration-200"
              onClick={() => setMapOpen(true)}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 md:w-8 md:h-8">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 119.5 9 2.5 2.5 0 0112 11.5z" />
              </svg>
            </button>
   
      {/* <a
        href={instagramUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram"
        className="bg-linear-to-br from-pink-500 via-purple-500 to-yellow-400 hover:from-pink-600 hover:via-purple-600 hover:to-yellow-500 text-white rounded-full shadow-lg flex items-center justify-center w-12 h-12 md:w-14 md:h-14 transition-all duration-200"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 md:w-8 md:h-8">
          <path d="M7.75 2A5.75 5.75 0 002 7.75v8.5A5.75 5.75 0 007.75 22h8.5A5.75 5.75 0 0022 16.25v-8.5A5.75 5.75 0 0016.25 2h-8.5zm0 1.5h8.5A4.25 4.25 0 0120.5 7.75v8.5A4.25 4.25 0 0116.25 20.5h-8.5A4.25 4.25 0 013.5 16.25v-8.5A4.25 4.25 0 017.75 3.5zm4.25 3.25a5.25 5.25 0 100 10.5 5.25 5.25 0 000-10.5zm0 1.5a3.75 3.75 0 110 7.5 3.75 3.75 0 010-7.5zm5.25.75a.75.75 0 100 1.5.75.75 0 000-1.5z" />
        </svg>
      </a> */}
      </div>
      <Modal isOpen={mapOpen} onClose={() => setMapOpen(false)} title="Ubicación en Google Maps" size="lg">
        <div className="mb-4 text-center text-base font-semibold text-gray-800 dark:text-gray-100">
          O&apos;Higgins 1384, Quillota, Valparaíso
        </div>
        <div className="w-full aspect-video max-w-2xl mx-auto">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3347.858964893964!2d-71.2704!3d-32.8933438!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9689d278fe242b47%3A0x4ed3023dc9ea90be!2sO'Higgins%201384%2C%20Quillota%2C%20Valpara%C3%ADso!5e0!3m2!1ses-419!2scl!4v1708888888888!5m2!1ses-419!2scl"
            width="100%"
            height="350"
            style={{ border: 0, borderRadius: '1rem', width: '100%' }}
            allowFullScreen={true}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Ubicación Angus Confecciones"
          ></iframe>
        </div>
        <div className="text-center mt-4">
          <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-medium">Abrir en Google Maps</a>
        </div>
      </Modal>
    </>
  );
}
