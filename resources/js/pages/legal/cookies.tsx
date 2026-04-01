import { Head } from '@inertiajs/react';
import TextLink from '@/components/text-link';
import AuthLayout from '@/layouts/auth-layout';
import { register } from '@/routes';

export default function CookiePolicy() {
    return (
        <AuthLayout
            title="Política de cookies"
            description="Información sobre las cookies y tecnologías similares utilizadas en Horario Digital."
            maxWidth="xl"
        >
            <Head title="Política de cookies" />

            <div className="space-y-6 text-sm leading-7 text-slate-700">
                <section className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
                    <p>
                        Titular del sitio y del servicio: Alberto Mondelo
                        Próspero.
                    </p>
                    <p>
                        Correo de contacto: amondelo12@gmail.com. Fecha de
                        última actualización: 01/04/2026.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        1. Qué son las cookies
                    </h2>
                    <p>
                        Las cookies son pequeños archivos o tecnologías
                        similares que se almacenan en el dispositivo de la
                        persona usuaria cuando visita un sitio web o utiliza una
                        aplicación web. Sirven, entre otras finalidades, para
                        mantener la sesión, recordar preferencias, reforzar la
                        seguridad o permitir el funcionamiento técnico del
                        servicio.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        2. Qué utiliza actualmente Horario Digital
                    </h2>
                    <p>
                        En el estado actual de esta interfaz, Horario Digital
                        utiliza principalmente cookies y tecnologías técnicas o
                        estrictamente necesarias para el funcionamiento del
                        servicio. No se han identificado en esta interfaz
                        cookies publicitarias propias ni herramientas de
                        analítica comportamental propias que requieran, por sí
                        mismas, un consentimiento previo específico.
                    </p>
                    <p>
                        Entre las tecnologías técnicas utilizadas o que pueden
                        utilizarse se encuentran, de forma ilustrativa:
                    </p>
                    <p>
                        Cookies de sesión y autenticación del framework, que
                        permiten mantener la sesión iniciada, validar peticiones
                        y proteger el acceso a áreas privadas del servicio.
                    </p>
                    <p>
                        Cookies o valores técnicos de seguridad, como los
                        asociados a la protección CSRF, necesarios para evitar
                        solicitudes maliciosas desde terceros sitios.
                    </p>
                    <p>
                        Cookies de preferencia funcional, como la cookie de
                        estado de la barra lateral (`sidebar_state`) y la cookie
                        de apariencia (`appearance`), que recuerdan opciones de
                        interfaz elegidas por la persona usuaria.
                    </p>
                    <p>
                        Cookies asociadas a la opción de mantener la sesión
                        iniciada o funcionalidades equivalentes de autenticación,
                        cuando la persona usuaria las active voluntariamente.
                    </p>
                    <p>
                        Además del uso de cookies, la aplicación puede almacenar
                        determinadas preferencias técnicas en el navegador, por
                        ejemplo mediante `localStorage`, con finalidades
                        funcionales como recordar la apariencia visual
                        seleccionada.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        3. Base jurídica y consentimiento
                    </h2>
                    <p>
                        Las cookies técnicas o estrictamente necesarias no
                        requieren consentimiento previo cuando son necesarias
                        para prestar el servicio solicitado por la persona
                        usuaria, mantener la autenticación, proteger la sesión o
                        recordar preferencias funcionales básicas.
                    </p>
                    <p>
                        Si en el futuro Horario Digital incorporase cookies de
                        analítica no exentas, personalización no necesaria,
                        publicidad comportamental u otras tecnologías sometidas
                        a consentimiento, esta política se actualizará y se
                        habilitarán, en su caso, los mecanismos de información y
                        gestión del consentimiento que resulten exigibles.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        4. Servicios de terceros
                    </h2>
                    <p>
                        El uso de determinados servicios integrados o enlazados
                        por Horario Digital puede implicar comunicaciones
                        directas entre el navegador de la persona usuaria y
                        terceros proveedores, que actuarán conforme a sus
                        propias políticas de privacidad y cookies.
                    </p>
                    <p>
                        Esto puede ocurrir, por ejemplo, al utilizar servicios
                        de pago y facturación como Stripe, servicios de mapas o
                        geocodificación como Mapbox o servicios de resolución de
                        IP pública como ipify cuando el navegador realiza esas
                        consultas para validar el contexto de fichaje.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        5. Cómo gestionar o desactivar las cookies
                    </h2>
                    <p>
                        La persona usuaria puede configurar su navegador para
                        bloquear o eliminar cookies, así como borrar datos de
                        navegación o almacenamiento local. No obstante, la
                        desactivación de cookies técnicas o de sesión puede
                        impedir el acceso, interrumpir la autenticación o
                        afectar al funcionamiento normal de la plataforma.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        6. Actualizaciones de esta política
                    </h2>
                    <p>
                        La presente política de cookies puede modificarse para
                        adaptarse a cambios normativos, técnicos o funcionales.
                        Se recomienda revisarla periódicamente.
                    </p>
                </section>

                <div className="rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3 text-sm text-slate-600">
                    <TextLink
                        href={register()}
                        className="font-semibold text-blue-700 decoration-blue-200 hover:text-blue-800"
                    >
                        Volver al registro
                    </TextLink>
                </div>
            </div>
        </AuthLayout>
    );
}
