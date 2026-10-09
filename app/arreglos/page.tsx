import type { Metadata } from 'next'
import Link from 'next/link'
import RepairRequestForm from './RepairRequestForm'

export const metadata: Metadata = {
  title: 'Solicitar arreglo de prendas | Confecciones Angus',
  description: 'Describe el arreglo que necesitas y coordina una evaluación con Confecciones Angus.'
}

export default function RepairRequestPage() {
  return (
    <main className="min-h-screen bg-[#f4efe7] px-4 py-8 text-[#173b39] dark:bg-[#0d1a1a] dark:text-[#edf5f2] sm:py-12">
      <section className="mx-auto max-w-3xl">
        <Link href="/#reparaciones" className="text-sm font-semibold text-[#4f6967] underline-offset-4 hover:underline dark:text-[#bfd4d0]">
          Volver a la tienda
        </Link>
        <div className="mt-5 rounded-2xl border border-[#123f3d]/10 bg-[#fffdf9] p-5 shadow-sm dark:border-white/10 dark:bg-[#142b2a] sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9a7836]">Servicio de arreglos</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Cuéntanos qué necesita tu prenda</h1>
          <p className="mt-2 text-sm leading-6 text-[#5f7a73] dark:text-[#bfd4d0]">
            Revisaremos tu solicitud y coordinaremos contigo la evaluación, el valor y el plazo antes de comenzar.
          </p>
          <RepairRequestForm />
        </div>
      </section>
    </main>
  )
}
