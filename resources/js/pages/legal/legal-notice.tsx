import { Head } from '@inertiajs/react';
import TextLink from '@/components/text-link';
import AuthLayout from '@/layouts/auth-layout';
import { register } from '@/routes';

export default function LegalNotice() {
    return (
        <AuthLayout
            title="Aviso legal"
            description="Información identificativa del titular y condiciones generales de acceso al sitio y al servicio."
            maxWidth="xl"
        >
            <Head title="Aviso legal" />

            <div className="space-y-6 text-sm leading-7 text-slate-700">
                <section className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
                    <p>
                        Titular del sitio y del servicio: Alberto Mondelo
                        Próspero.
                    </p>
                    <p>NIF/CIF: 23889622M.</p>
                    <p>
                        Domicilio profesional: Carrer Huelva, Moncada,
                        Valencia.
                    </p>
                    <p>
                        Correo electrónico de contacto:
                        amondelo12@gmail.com.
                    </p>
                    <p>Fecha de última actualización: 01/04/2026.</p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        1. Objeto
                    </h2>
                    <p>
                        El presente aviso legal regula el acceso, navegación y
                        uso del sitio web y de la plataforma Horario Digital,
                        así como la relación informativa entre el titular y las
                        personas usuarias del sitio.
                    </p>
                    <p>
                        Horario Digital es un servicio SaaS orientado a empresas
                        y profesionales para la gestión del control horario,
                        fichajes, pausas, vacaciones, ausencias, horas extra,
                        centros de trabajo y documentación asociada.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        2. Identificación del prestador
                    </h2>
                    <p>
                        De conformidad con la Ley 34/2002, de 11 de julio, de
                        servicios de la sociedad de la información y de comercio
                        electrónico, se informa de que el titular del sitio es
                        Alberto Mondelo Próspero, con NIF/CIF 23889622M y correo
                        electrónico amondelo12@gmail.com.
                    </p>
                    <p>
                        Si en el futuro el titular operase a través de una
                        sociedad mercantil o de una estructura registral
                        distinta, dicha información se actualizará en esta
                        página.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        3. Condiciones de acceso y uso
                    </h2>
                    <p>
                        El acceso al sitio tiene carácter gratuito, sin
                        perjuicio de que determinadas funcionalidades o
                        servicios requieran registro previo, contratación o pago
                        de una suscripción.
                    </p>
                    <p>
                        La persona usuaria se compromete a realizar un uso
                        diligente, lícito y de buena fe del sitio, de la
                        plataforma y de sus contenidos. Queda prohibido el uso
                        del sitio con fines ilícitos, fraudulentos, lesivos para
                        derechos o intereses de terceros o que puedan dañar,
                        inutilizar o sobrecargar la infraestructura técnica.
                    </p>
                    <p>
                        El uso de la plataforma con cuenta registrada se rige
                        adicionalmente por los términos y condiciones, la
                        política de privacidad y, cuando corresponda, el
                        documento de encargo del tratamiento.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        4. Propiedad intelectual e industrial
                    </h2>
                    <p>
                        Todos los derechos de propiedad intelectual e industrial
                        sobre el sitio web, la plataforma, el software, el
                        diseño, la estructura, la marca, el código, los textos,
                        las imágenes, la documentación y demás elementos
                        distintivos corresponden al titular o a sus
                        licenciantes.
                    </p>
                    <p>
                        No se entenderá cedido ningún derecho de explotación más
                        allá del estrictamente necesario para el uso legítimo
                        del servicio conforme a su finalidad y a la
                        documentación contractual aplicable.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        5. Responsabilidad
                    </h2>
                    <p>
                        El titular procura que la información y el servicio sean
                        correctos y estén razonablemente disponibles, pero no
                        garantiza la ausencia de errores, interrupciones,
                        indisponibilidades puntuales o incidencias técnicas.
                    </p>
                    <p>
                        El titular no responde de los daños derivados del uso
                        indebido del sitio, de la actuación de terceros, de la
                        falta de disponibilidad temporal del servicio ni de
                        decisiones adoptadas por la persona usuaria a partir de
                        la información publicada, sin perjuicio de las
                        responsabilidades que legalmente no puedan excluirse.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        6. Enlaces externos
                    </h2>
                    <p>
                        El sitio puede contener enlaces o integraciones con
                        servicios de terceros. El titular no controla ni asume
                        responsabilidad por el contenido, políticas o prácticas
                        de dichos sitios o servicios externos.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        7. Legislación aplicable y jurisdicción
                    </h2>
                    <p>
                        El presente aviso legal se rige por la legislación
                        española. Para cualquier controversia que pudiera
                        derivarse del acceso o uso del sitio, las partes se
                        someten a los juzgados y tribunales de Valencia, España,
                        salvo que una norma imperativa disponga otra cosa.
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
