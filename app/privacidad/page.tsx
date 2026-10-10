import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Política de privacidad y almacenamiento',
  description: 'Información sobre el tratamiento de datos personales, almacenamiento local y contacto de privacidad de Confecciones Angus.'
}

const privacyContact = 'https://wa.me/56983852967?text=Hola%2C%20quiero%20hacer%20una%20consulta%20de%20privacidad%20o%20ejercer%20mis%20derechos%20sobre%20mis%20datos.'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f4efe7] px-4 py-10 text-[#173b39] dark:bg-[#0d1a1a] dark:text-[#edf5f2] sm:px-6 sm:py-16">
      <article className="mx-auto max-w-3xl rounded-3xl border border-[#123f3d]/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#142b2a] sm:p-9">
        <Link href="/" className="inline-flex min-h-11 items-center rounded-lg font-semibold text-[#123f3d] underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d3a954] dark:text-[#e7c77c]">Volver a la tienda</Link>
        <p className="mt-8 text-sm font-bold uppercase tracking-wider text-[#79551e] dark:text-[#e7c77c]">Privacidad y almacenamiento</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Política de privacidad</h1>
        <p className="mt-3 text-sm text-[#4d6d5f] dark:text-[#bfd4d0]">Última actualización: 10 de octubre de 2026</p>

        <div className="mt-8 space-y-7 text-[15px] leading-7">
          <section>
            <h2 className="text-xl font-bold">1. Responsable y contacto</h2>
            <p className="mt-2">El responsable del tratamiento es la persona natural titular del RUT <strong>17.634.325-7</strong>, quien opera comercialmente bajo el nombre <strong>Confecciones Angus</strong>. Este nombre comercial no se presenta como una sociedad distinta de su titular.</p>
            <p className="mt-2">Domicilio comercial: Pasaje Santa Olga 288, Quillota, Región de Valparaíso. Para consultas de privacidad o para ejercer derechos sobre tus datos, escríbenos al <a className="font-semibold underline underline-offset-2" href={privacyContact} target="_blank" rel="noopener noreferrer">WhatsApp +56 9 8385 2967</a> e indica que tu consulta es de privacidad. No incluyas contraseñas, códigos de seguimiento ni datos sensibles en el primer mensaje.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold">2. Datos y finalidades</h2>
            <ul className="mt-2 list-disc space-y-2 pl-6">
              <li><strong>Solicitudes de pedido:</strong> nombre, teléfono, variantes, cantidades y solicitud idempotente para registrar y gestionar el pedido, verificar stock/precios y coordinar pago o entrega contigo.</li>
              <li><strong>Solicitudes de arreglo:</strong> nombre, teléfono, descripción de la prenda y del arreglo, fecha deseada y un código de seguimiento aleatorio. Se usa para evaluar, gestionar y comunicar el estado del servicio.</li>
              <li><strong>Atención, ventas y proveedores:</strong> el sistema administrativo puede guardar nombres, datos de contacto, direcciones, notas de atención y antecedentes de ventas o compras a proveedores para gestionar relaciones comerciales, entregar comprobantes y cumplir obligaciones legales.</li>
              <li><strong>Mensajes de WhatsApp:</strong> cuando se usa la integración de atención, se reciben o envían números de teléfono, identificadores y contenido de mensajes para responder consultas y llevar seguimiento. Los mensajes se almacenan en el panel administrativo y el servicio de Meta participa en su transmisión.</li>
              <li><strong>Operación y seguridad:</strong> datos técnicos que los proveedores de infraestructura puedan registrar para servir el sitio, mantener sesiones administrativas, prevenir abuso y diagnosticar errores.</li>
              <li><strong>Medición agregada:</strong> contamos eventos generales de uso por día (por ejemplo, búsquedas, vistas y solicitudes). La tabla de métricas no almacena el texto buscado, el identificador de producto ni los datos de contacto.</li>
            </ul>
            <p className="mt-2">No usamos los datos de estos formularios para enviar publicidad. Si posteriormente ofrecemos comunicaciones promocionales, solicitaremos una autorización separada cuando corresponda.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold">3. Base y carácter de los datos</h2>
            <p className="mt-2">Solicitamos los datos necesarios para responder y gestionar la solicitud que tú inicias. El consentimiento del formulario se recoge por separado y puedes consultar o pedir su cese por el canal de contacto indicado, sin perjuicio de los tratamientos y conservaciones que deban continuar por obligaciones legales, contables o para resolver una reclamación. Evita incluir datos sensibles o información identificable de menores en campos de texto libre; la solicitud debe realizarla una persona adulta responsable.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold">4. Proveedores y comunicación con otros servicios</h2>
            <p className="mt-2">El sitio utiliza <strong>Supabase</strong> para la base de datos y autenticación administrativa y <strong>Vercel</strong> para alojamiento y entrega del sitio. Estos proveedores pueden procesar datos técnicos necesarios para sus servicios y podrían operar infraestructura fuera de Chile. Aplicamos controles de acceso en la base de datos; no afirmamos una ubicación de almacenamiento concreta en esta política.</p>
            <p className="mt-2">Si eliges continuar por WhatsApp, tu dispositivo abre un servicio de Meta. El mensaje preparado puede incluir los datos y artículos de tu solicitud para que Angus pueda atenderla; revisa el contenido y decide si enviarlo. Si abres el mapa, se consulta Google Maps. Esos servicios se rigen además por sus propias políticas y condiciones; no se cargan etiquetas de publicidad o analítica de terceros como parte de la navegación normal identificada en esta versión.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold">5. Cookies y almacenamiento en tu dispositivo</h2>
            <p className="mt-2">No utilizamos cookies publicitarias ni tecnologías de seguimiento entre sitios en la versión revisada. La autenticación de administración puede usar cookies técnicas de sesión de Supabase. En el navegador, usamos almacenamiento local para recordar el carrito, favoritos, tema visual y claves técnicas de reintento de solicitudes. El código secreto de seguimiento de arreglos se guarda temporalmente mientras se reintenta el formulario, expira a las 24 horas si el envío no concluye y se elimina del almacenamiento local cuando el registro se completa correctamente.</p>
            <p className="mt-2">El carrito, los favoritos y la preferencia de tema permanecen en tu navegador hasta que los borres o limpies los datos del sitio. Si borras el almacenamiento local, perderás esas preferencias; la tienda seguirá siendo navegable. La versión revisada no incorpora rastreadores de publicidad ni herramientas de analítica de terceros. Si incorporamos tecnologías opcionales de seguimiento, actualizaremos esta política y habilitaremos información y controles antes de activarlas cuando corresponda.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold">6. Conservación y seguridad</h2>
            <p className="mt-2">Limitamos el acceso a datos de pedidos y arreglos al administrador autorizado. Conservamos cada dato solo durante el tiempo necesario para atender la solicitud, gestionar responsabilidades y cumplir obligaciones legales aplicables; después se elimina o anonimiza de forma segura cuando ya no exista una razón válida para conservarlo. Los registros necesarios para contabilidad, impuestos, garantías o reclamaciones pueden quedar sujetos a plazos legales distintos. El código de seguimiento de arreglos se almacena en la base de datos como hash, no como código legible.</p>
            <p className="mt-2">Las solicitudes de eliminación pueden estar limitadas cuando exista un deber legal de conservar registros. En ese caso, restringiremos el uso de los datos a la finalidad legal correspondiente cuando proceda.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold">7. Tus derechos y solicitudes</h2>
            <p className="mt-2">Puedes pedir información sobre tus datos, solicitar acceso, rectificación, eliminación, oposición o bloqueo cuando corresponda, y retirar el consentimiento para tratamientos basados en él. La portabilidad se atenderá en los casos y condiciones que establezca la normativa aplicable. Para protegerte, podríamos pedir información razonable para verificar tu identidad y ubicar la solicitud; no envíes documentos de identidad completos por WhatsApp salvo que acordemos un mecanismo seguro. Responderemos por el mismo canal o uno que coordinemos contigo.</p>
            <p className="mt-2">La Ley 21.719 de protección de datos personales está prevista para entrar en vigor el 1 de diciembre de 2026. Esta política se actualizará para reflejar las obligaciones aplicables a partir de esa fecha. También puedes reclamar ante las autoridades competentes conforme a la normativa vigente.</p>
            <a href={privacyContact} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center rounded-lg bg-[#123f3d] px-4 font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d3a954] dark:bg-[#d3a954] dark:text-[#123f3d]">Consultar sobre mis datos</a>
          </section>

          <section>
            <h2 className="text-xl font-bold">8. Solicitudes, precios y derechos del consumidor</h2>
            <p className="mt-2">El sitio permite registrar una solicitud de pedido o de arreglo; no procesa pagos en línea ni garantiza por sí solo una reserva de stock. Antes de coordinar la compra o el servicio, Angus verificará disponibilidad, precio final y condiciones de pago y entrega contigo. La solicitud no elimina ni limita los derechos irrenunciables que reconoce la legislación de consumo aplicable.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold">9. Cambios a esta política</h2>
            <p className="mt-2">Publicaremos cualquier cambio en esta página con su fecha de actualización. Si el cambio requiere una nueva autorización, la solicitaremos antes de usar los datos para esa nueva finalidad.</p>
          </section>
        </div>
      </article>
    </main>
  )
}
