import React from "react";

const whatsappUrl = "https://wa.me/56983852967";
const instagramUrl = "https://www.instagram.com/confecciones_angus/";

export default function FloatingSocialButtons() {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
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
      <a
        href={instagramUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram"
        className="bg-linear-to-br from-pink-500 via-purple-500 to-yellow-400 hover:from-pink-600 hover:via-purple-600 hover:to-yellow-500 text-white rounded-full shadow-lg flex items-center justify-center w-12 h-12 md:w-14 md:h-14 transition-all duration-200"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 md:w-8 md:h-8">
          <path d="M7.75 2A5.75 5.75 0 002 7.75v8.5A5.75 5.75 0 007.75 22h8.5A5.75 5.75 0 0022 16.25v-8.5A5.75 5.75 0 0016.25 2h-8.5zm0 1.5h8.5A4.25 4.25 0 0120.5 7.75v8.5A4.25 4.25 0 0116.25 20.5h-8.5A4.25 4.25 0 013.5 16.25v-8.5A4.25 4.25 0 017.75 3.5zm4.25 3.25a5.25 5.25 0 100 10.5 5.25 5.25 0 000-10.5zm0 1.5a3.75 3.75 0 110 7.5 3.75 3.75 0 010-7.5zm5.25.75a.75.75 0 100 1.5.75.75 0 000-1.5z" />
        </svg>
      </a>
    </div>
  );
}
