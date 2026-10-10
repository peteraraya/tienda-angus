import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Condiciones de solicitudes de pedido y arreglos',
  description: 'Cómo funcionan las solicitudes de productos y servicios de arreglos de Confecciones Angus.'
}

export default function RequestConditionsPage() {
  return (
    <main className="min-h-screen bg-[#f4efe7] px-4 py-10 text-[#173b39] dark:bg-[#0d1a1a] dark:text-[#edf5f2] sm:px-6 sm:py-16">
      <article className="mx-auto max-w-3xl rounded-3xl border border-[#123f3d]/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#142b2a] sm:p-9">
        <Link href="/" className="inline-flex min-h-11 items-center rounded-lg font-semibold text-[#123f3d] underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d3a954] dark:text-[#e7c77c]">Volver a la tienda</Link>
        <p className="mt-8 text-sm font-bold uppercase tracking-wider text-[#79551e] dark:text-[#e7c77c]">Información comercial</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Condiciones de solicitudes</h1>
        <p className="mt-3 text-sm text-[#4d6d5f] dark:text-[#bfd4d0]">Última actualización: 10 de octubre de 2026</p>

        <div className="mt-8 space-y-7 text-[15px] leading-7">
          <section>
            <h2 className="text-xl font-bold">Quién atiende</h2>
            <p className="mt-2">Confecciones Angus es el nombre comercial bajo el cual opera la persona natural titular del RUT 17.634.325-7. Domicilio comercial: Pasaje Santa Olga 288, Quillota, Región de Valparaíso. Atención por WhatsApp y teléfono: <a className="font-semibold underline underline-offset-2" href="tel:+56983852967">+56 9 8385 2967</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold">Solicitudes de productos</h2>
            <ol className="mt-2 list-decimal space-y-2 pl-6">
              <li>El catálogo informa productos, variantes, precios y stock disponibles según los datos publicados en el momento de la consulta.</li>
              <li>Al enviar el formulario se registra una solicitud con las variantes y cantidades indicadas. El envío no cobra, no confirma una venta ni reserva stock.</li>
              <li>La tienda revisará disponibilidad y precio vigente y contactará al cliente por WhatsApp para acordar los pasos de pago, retiro o entrega. Antes de cualquier pago se confirmarán total y condiciones aplicables.</li>
              <li>Si algún artículo dejó de estar disponible o cambió de precio antes de la confirmación, se informará al cliente para que decida si desea continuar con la propuesta actualizada.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold">Solicitudes de arreglos</h2>
            <p className="mt-2">Enviar una solicitud permite describir la prenda y pedir una evaluación; no equivale a una cotización aceptada ni confirma precio o fecha de entrega. Se coordinarán por WhatsApp la revisión, el valor, el plazo y la aceptación del servicio antes de iniciar el trabajo. El código privado que se entrega al registrar la solicitud sirve para consultar su estado; guárdalo y no lo compartas con terceros.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold">Pagos, entrega y comprobantes</h2>
            <p className="mt-2">Esta página no procesa pagos en línea. El medio de pago, la entrega o retiro, su costo y los plazos se acuerdan antes de completar la compra o el servicio. Se entregará el comprobante que corresponda conforme a la normativa aplicable.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold">Cambios, retracto, garantía y reclamos</h2>
            <p className="mt-2">Estas condiciones no limitan derechos irrenunciables de las personas consumidoras. Los derechos de retracto, garantía legal, reparación del servicio y demás derechos se aplicarán cuando correspondan de acuerdo con la legislación vigente y las características de la operación. Para consultar por una solicitud o presentar un reclamo, contacta al teléfono indicado. Para asuntos de datos personales, consulta la <Link href="/privacidad" className="font-semibold underline underline-offset-2">Política de privacidad</Link>.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold">Actualizaciones</h2>
            <p className="mt-2">Estas condiciones describen el flujo que actualmente ofrece el sitio. Si Angus habilita compra y pago en línea, publicará antes de esa habilitación las condiciones de venta, precios, despacho, cambios y devoluciones aplicables.</p>
          </section>
        </div>
      </article>
    </main>
  )
}
