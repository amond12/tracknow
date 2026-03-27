import { Head } from '@inertiajs/react';
import TextLink from '@/components/text-link';
import AuthLayout from '@/layouts/auth-layout';
import { register } from '@/routes';

export default function PrivacyPolicy() {
    return (
        <AuthLayout
            title="Politica de privacidad"
            description="Base editable para informar de como recoges, usas y proteges los datos personales."
            maxWidth="xl"
        >
            <Head title="Politica de privacidad" />

            <div className="space-y-6 text-sm leading-7 text-slate-700">
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
                    Este contenido es una base provisional y debe revisarse
                    con tu asesoria legal antes de publicarlo en produccion.
                </div>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        1. Responsable del tratamiento
                    </h2>
                    <p>
                        Indica aqui la entidad titular del servicio, sus datos
                        identificativos y un correo de contacto para cualquier
                        consulta relacionada con privacidad.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        2. Datos que tratamos
                    </h2>
                    <p>
                        Describe que datos recopilas al crear una cuenta y al
                        usar la plataforma, por ejemplo nombre, email,
                        telefono, datos de empresa y registros operativos del
                        servicio.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        3. Finalidades y base legal
                    </h2>
                    <p>
                        Explica para que utilizas los datos: prestar el
                        servicio, gestionar la cuenta, enviar comunicaciones
                        transaccionales, facturacion, seguridad y cumplimiento
                        normativo.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        4. Conservacion y terceros
                    </h2>
                    <p>
                        Indica durante cuanto tiempo conservas los datos y que
                        proveedores intervienen en el servicio, por ejemplo
                        hosting, email transaccional o pagos.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        5. Derechos de los usuarios
                    </h2>
                    <p>
                        Debes informar sobre el acceso, rectificacion,
                        supresion, oposicion, limitacion y portabilidad, asi
                        como el canal para ejercer esos derechos.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        6. Seguridad y contacto
                    </h2>
                    <p>
                        Resume las medidas de seguridad aplicables y deja un
                        canal de contacto para privacidad e incidencias.
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
