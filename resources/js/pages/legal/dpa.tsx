import { Head } from '@inertiajs/react';
import TextLink from '@/components/text-link';
import AuthLayout from '@/layouts/auth-layout';
import { register } from '@/routes';

export default function DataProcessingAgreement() {
    return (
        <AuthLayout
            title="Encargo del tratamiento"
            description="Condiciones de tratamiento de datos por cuenta de clientes profesionales de Horario Digital."
            maxWidth="xl"
        >
            <Head title="Encargo del tratamiento" />

            <div className="space-y-6 text-sm leading-7 text-slate-700">
                <section className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
                    <p>
                        Este documento regula el tratamiento de datos por cuenta
                        del cliente profesional cuando utiliza Horario Digital
                        para gestionar empleados, jornadas, fichajes, pausas,
                        vacaciones, ausencias, horas extra, centros de trabajo e
                        informes asociados.
                    </p>
                    <p>
                        Parte prestadora y encargada del tratamiento: Alberto
                        Mondelo Próspero, NIF/CIF 23889622M, contacto:
                        amondelo12@gmail.com.
                    </p>
                    <p>Fecha de última actualización: 01/04/2026.</p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        1. Naturaleza del documento
                    </h2>
                    <p>
                        Estas condiciones forman parte de la relación
                        contractual entre Horario Digital y el cliente
                        profesional y tienen la consideración de contrato de
                        encargo del tratamiento a los efectos del artículo 28
                        del Reglamento (UE) 2016/679.
                    </p>
                    <p>
                        El cliente actúa como responsable del tratamiento
                        respecto de los datos personales que incorpora o gestiona
                        en la plataforma por cuenta de su organización. Alberto
                        Mondelo Próspero actúa como encargado del tratamiento en
                        la medida en que trate dichos datos para prestar el
                        servicio contratado.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        2. Objeto, duración y finalidad
                    </h2>
                    <p>
                        El encargado tratará los datos personales únicamente
                        para prestar el servicio Horario Digital y las
                        funcionalidades asociadas contratadas por el cliente,
                        incluyendo, según la configuración aplicable, gestión
                        de usuarios, centros, fichajes, pausas, validación por
                        IP o geolocalización, calendario laboral, informes y
                        documentación PDF.
                    </p>
                    <p>
                        La duración del tratamiento se extenderá durante la
                        vigencia del contrato principal o mientras el encargado
                        necesite acceder a los datos para prestar el servicio,
                        sin perjuicio de los plazos de bloqueo, conservación o
                        supresión legalmente exigibles.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        3. Categorías de interesados y de datos
                    </h2>
                    <p>
                        Las categorías de personas interesadas pueden incluir,
                        según el uso del cliente, empleados, encargados,
                        representantes, personal administrativo u otros usuarios
                        autorizados de la organización cliente.
                    </p>
                    <p>
                        Las categorías de datos pueden incluir datos
                        identificativos y de contacto, datos de cuenta y rol,
                        centro de trabajo, horarios, fichajes, pausas,
                        vacaciones, ausencias, horas extra, dirección IP,
                        geolocalización, metadatos técnicos de validación y
                        cualquier otra información que el cliente decida
                        incorporar legítimamente al servicio.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        4. Instrucciones del cliente
                    </h2>
                    <p>
                        El encargado tratará los datos únicamente siguiendo las
                        instrucciones documentadas del cliente, salvo que esté
                        obligado a ello en virtud del Derecho de la Unión
                        Europea o de los Estados miembros aplicable al
                        encargado. En ese caso, informará al cliente, salvo que
                        la ley lo prohíba por razones importantes de interés
                        público.
                    </p>
                    <p>
                        La configuración funcional del servicio realizada por el
                        cliente, así como las acciones ejecutadas por sus
                        usuarios autorizados dentro de la plataforma, se
                        considerarán instrucciones del cliente en la medida en
                        que sean compatibles con el contrato principal y con la
                        normativa aplicable.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        5. Obligaciones del encargado
                    </h2>
                    <p>
                        El encargado se compromete a tratar los datos
                        personales de forma confidencial, a garantizar que las
                        personas autorizadas para tratarlos hayan asumido
                        obligaciones de confidencialidad adecuadas y a limitar
                        el acceso a los datos a quienes necesiten conocerlos
                        para prestar el servicio.
                    </p>
                    <p>
                        Asimismo, aplicará medidas técnicas y organizativas
                        apropiadas al riesgo, incluyendo, cuando proceda,
                        controles de acceso, autenticación, separación por
                        roles, protección de credenciales, medidas de seguridad
                        sobre la infraestructura y mecanismos razonables de
                        prevención y gestión de incidencias.
                    </p>
                    <p>
                        El encargado no utilizará los datos para fines propios,
                        no los comunicará a terceros salvo en los supuestos
                        previstos en este documento y asistirá al cliente, en
                        la medida razonable y teniendo en cuenta la naturaleza
                        del tratamiento, para atender solicitudes de derechos,
                        incidencias de seguridad, consultas de autoridades y
                        obligaciones de cumplimiento relacionadas con el
                        servicio.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        6. Subencargados
                    </h2>
                    <p>
                        El cliente autoriza con carácter general al encargado a
                        recurrir a subencargados necesarios para la prestación
                        del servicio, siempre que imponga a dichos
                        subencargados obligaciones de protección de datos
                        equivalentes a las establecidas en este documento.
                    </p>
                    <p>
                        La relación vigente de subencargados puede consultarse
                        en el anexo de subencargados disponible en esta misma
                        web. El encargado podrá actualizar dicha relación
                        cuando sea necesario por razones técnicas, operativas,
                        de seguridad o continuidad del servicio.
                    </p>
                    <p>
                        Si el cliente tiene una objeción razonable y fundada en
                        materia de protección de datos respecto de un nuevo
                        subencargado, podrá comunicarla por escrito a
                        amondelo12@gmail.com en un plazo razonable desde que
                        tenga conocimiento del cambio. Las partes actuarán de
                        buena fe para valorar una solución proporcionada.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        7. Transferencias internacionales
                    </h2>
                    <p>
                        Cuando para prestar el servicio sea necesario recurrir
                        a proveedores ubicados fuera del Espacio Económico
                        Europeo o que impliquen transferencias internacionales,
                        el encargado adoptará las garantías adecuadas exigibles
                        conforme al RGPD, como decisiones de adecuación,
                        cláusulas contractuales tipo u otros mecanismos
                        válidos.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        8. Violaciones de seguridad
                    </h2>
                    <p>
                        El encargado notificará al cliente, sin dilación
                        indebida, cualquier violación de la seguridad de los
                        datos personales de la que tenga conocimiento y que
                        afecte a los datos tratados por cuenta del cliente,
                        facilitando la información disponible razonablemente
                        necesaria para que este pueda valorar y, en su caso,
                        gestionar sus obligaciones legales.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        9. Devolución o supresión de datos
                    </h2>
                    <p>
                        Una vez finalice la prestación del servicio, el
                        encargado suprimirá o devolverá los datos personales
                        tratados por cuenta del cliente, a elección de este
                        cuando sea técnicamente viable y conforme a la
                        operativa del servicio, salvo que exista una obligación
                        legal de conservación.
                    </p>
                    <p>
                        El cliente es responsable de solicitar o realizar la
                        exportación de su información antes de la baja
                        definitiva del servicio, así como de conservar los
                        registros que deba mantener por obligación legal o
                        probatoria.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        10. Información, cooperación y auditoría
                    </h2>
                    <p>
                        El encargado pondrá a disposición del cliente la
                        información razonablemente necesaria para demostrar el
                        cumplimiento de las obligaciones aplicables al
                        encargado conforme al artículo 28 RGPD, teniendo en
                        cuenta la naturaleza del servicio, la confidencialidad,
                        la seguridad del sistema y la proporcionalidad de la
                        solicitud.
                    </p>
                    <p>
                        Las auditorías o revisiones específicas deberán
                        solicitarse por escrito, con una antelación razonable y
                        sin interferir indebidamente en la seguridad,
                        continuidad o normal funcionamiento del servicio. Salvo
                        incumplimiento grave acreditado, los costes
                        extraordinarios derivados de auditorías
                        individualizadas podrán ser asumidos por el cliente.
                    </p>
                </section>

                <div className="rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3 text-sm text-slate-600">
                    <TextLink
                        href="/anexo-de-subencargados"
                        className="font-semibold text-blue-700 decoration-blue-200 hover:text-blue-800"
                    >
                        Consultar anexo de subencargados
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
