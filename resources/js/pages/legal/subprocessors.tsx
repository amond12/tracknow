import { Head } from '@inertiajs/react';
import TextLink from '@/components/text-link';
import AuthLayout from '@/layouts/auth-layout';
import { register } from '@/routes';

export default function SubprocessorsAnnex() {
    return (
        <AuthLayout
            title="Anexo de subencargados"
            description="Relación de proveedores terceros que pueden intervenir en el tratamiento de datos por cuenta de clientes."
            maxWidth="xl"
        >
            <Head title="Anexo de subencargados" />

            <div className="space-y-6 text-sm leading-7 text-slate-700">
                <section className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
                    <p>
                        Este anexo forma parte de la documentación contractual
                        de protección de datos aplicable a Horario Digital.
                    </p>
                    <p>
                        Responsable de contacto para consultas sobre
                        subencargados: amondelo12@gmail.com.
                    </p>
                    <p>Fecha de última actualización: 01/04/2026.</p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        1. Régimen general
                    </h2>
                    <p>
                        Horario Digital puede recurrir a terceros proveedores
                        que actúan como subencargados del tratamiento o como
                        proveedores técnicos relacionados con la prestación del
                        servicio, siempre que ello sea necesario para operar,
                        asegurar, mantener o mejorar la plataforma.
                    </p>
                    <p>
                        Cuando dichos terceros tengan acceso a datos personales
                        tratados por cuenta del cliente, se procurará que
                        queden sujetos a obligaciones contractuales de
                        confidencialidad, seguridad y protección de datos
                        equivalentes a las asumidas por Horario Digital en su
                        condición de encargado del tratamiento.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-base font-semibold text-slate-950">
                        2. Relación vigente de subencargados y proveedores
                    </h2>

                    <div className="space-y-4">
                        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
                            <h3 className="font-semibold text-slate-950">
                                Stripe
                            </h3>
                            <p>
                                Finalidad: gestión de pagos, checkout,
                                suscripciones, facturación y portal de cliente.
                            </p>
                            <p>
                                Categorías de datos afectadas: identificadores
                                de cliente y suscripción, nombre, correo
                                electrónico, teléfono, metadatos de
                                facturación, plan contratado, estado del cobro
                                y datos limitados del método de pago
                                facilitados por Stripe.
                            </p>
                            <p>
                                Ubicación o transferencias: pueden implicar
                                tratamiento dentro y fuera del Espacio
                                Económico Europeo en función de la estructura
                                del proveedor y del flujo de pago aplicable.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
                            <h3 className="font-semibold text-slate-950">
                                Mapbox
                            </h3>
                            <p>
                                Finalidad: geocodificación, mapas, validación y
                                asistencia en la configuración de direcciones o
                                centros de trabajo cuando la funcionalidad esté
                                habilitada.
                            </p>
                            <p>
                                Categorías de datos afectadas: consultas de
                                direcciones, coordenadas, datos asociados a
                                centros de trabajo y metadatos técnicos de la
                                solicitud.
                            </p>
                            <p>
                                Ubicación o transferencias: el servicio puede
                                implicar tratamiento en Estados Unidos u otras
                                ubicaciones determinadas por el proveedor.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
                            <h3 className="font-semibold text-slate-950">
                                Servicio de resolución de IP pública
                            </h3>
                            <p>
                                Proveedor utilizado en la implementación
                                actual: ipify, o servicio equivalente que
                                pueda sustituirlo en el futuro por razones
                                técnicas.
                            </p>
                            <p>
                                Finalidad: determinar la IP pública del
                                dispositivo cuando el navegador realiza la
                                consulta para validar el contexto de fichaje.
                            </p>
                            <p>
                                Categorías de datos afectadas: dirección IP y
                                metadatos técnicos básicos asociados a la
                                petición web.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
                            <h3 className="font-semibold text-slate-950">
                                Proveedor de correo transaccional
                            </h3>
                            <p>
                                Proveedor o proveedores posibles según la
                                configuración del entorno de producción:
                                Postmark, Resend o Amazon SES.
                            </p>
                            <p>
                                Finalidad: envío de correos de verificación,
                                restablecimiento de contraseña, notificaciones
                                de seguridad y otras comunicaciones
                                transaccionales necesarias para el servicio.
                            </p>
                            <p>
                                Categorías de datos afectadas: nombre,
                                dirección de correo electrónico y metadatos
                                técnicos del envío.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
                            <h3 className="font-semibold text-slate-950">
                                Infraestructura, alojamiento y almacenamiento
                            </h3>
                            <p>
                                El servicio puede apoyarse en proveedores de
                                hosting, infraestructura, almacenamiento,
                                colas, caché, base de datos, despliegue,
                                monitorización o continuidad operativa.
                            </p>
                            <p>
                                En la medida en que dichos proveedores tengan
                                acceso a datos personales por cuenta del
                                cliente, actuarán como subencargados o
                                proveedores técnicos vinculados a la prestación
                                del servicio.
                            </p>
                            <p>
                                Si deseas identificar el proveedor concreto
                                actualmente activo en producción, puedes
                                solicitarlo a través de amondelo12@gmail.com.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        3. Actualización del anexo
                    </h2>
                    <p>
                        Este anexo podrá modificarse cuando se incorporen,
                        sustituyan o eliminen subencargados o proveedores
                        relevantes para la prestación del servicio. La versión
                        publicada en esta página será la versión vigente en
                        cada momento.
                    </p>
                </section>

                <div className="rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3 text-sm text-slate-600">
                    <TextLink
                        href="/encargo-del-tratamiento"
                        className="font-semibold text-blue-700 decoration-blue-200 hover:text-blue-800"
                    >
                        Ver encargo del tratamiento
                    </TextLink>
                    <span className="mx-2 text-slate-400">·</span>
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
