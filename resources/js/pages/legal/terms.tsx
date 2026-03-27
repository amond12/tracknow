import { Head } from '@inertiajs/react';
import TextLink from '@/components/text-link';
import AuthLayout from '@/layouts/auth-layout';
import { register } from '@/routes';

export default function TermsAndConditions() {
    return (
        <AuthLayout
            title="Terminos y condiciones"
            description="Base editable para definir el uso del servicio, responsabilidades y reglas de contratacion."
            maxWidth="xl"
        >
            <Head title="Terminos y condiciones" />

            <div className="space-y-6 text-sm leading-7 text-slate-700">
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
                    Este contenido es una base provisional y debe revisarse
                    con tu asesoria legal antes de publicarlo en produccion.
                </div>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        1. Objeto del servicio
                    </h2>
                    <p>
                        Describe aqui que ofrece la plataforma, para quien esta
                        pensada y cuales son sus funcionalidades principales.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        2. Cuenta y acceso
                    </h2>
                    <p>
                        Define las condiciones para crear una cuenta, custodiar
                        credenciales, dar de alta usuarios y mantener la
                        informacion facilitada actualizada.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        3. Uso permitido
                    </h2>
                    <p>
                        Explica los usos permitidos del servicio y las
                        conductas prohibidas, incluyendo usos fraudulentos,
                        acceso no autorizado, alteracion de datos o abuso de la
                        infraestructura.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        4. Planes, pagos y renovaciones
                    </h2>
                    <p>
                        Si el servicio es de pago, deja por escrito como
                        funcionan los planes, renovaciones, impuestos,
                        suspensiones por impago y cancelaciones.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        5. Disponibilidad y responsabilidad
                    </h2>
                    <p>
                        Indica el alcance razonable del servicio, sus limites,
                        mantenimiento, posibles interrupciones y el regimen de
                        responsabilidad aplicable.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        6. Legislacion y contacto
                    </h2>
                    <p>
                        Cierra el documento indicando ley aplicable,
                        jurisdiccion y canal de contacto para consultas o
                        reclamaciones.
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
