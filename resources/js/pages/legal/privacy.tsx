import { Head } from '@inertiajs/react';
import TextLink from '@/components/text-link';
import AuthLayout from '@/layouts/auth-layout';
import { register } from '@/routes';

export default function PrivacyPolicy() {
    return (
        <AuthLayout
            title="Política de privacidad"
            description="Información sobre cómo se recogen, usan y protegen los datos personales en Horario Digital."
            maxWidth="xl"
        >
            <Head title="Política de privacidad" />

            <div className="space-y-6 text-sm leading-7 text-slate-700">
                <section className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
                    <p>
                        Responsable del tratamiento: Alberto Mondelo Próspero,
                        con NIF/CIF 23889622M y domicilio en Carrer Huelva,
                        Moncada, Valencia.
                    </p>
                    <p>
                        Correo de contacto en materia de privacidad:
                        amondelo12@gmail.com. Fecha de última actualización:
                        01/04/2026.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        1. Quién trata los datos y en qué calidad
                    </h2>
                    <p>
                        En Horario Digital pueden darse dos situaciones
                        diferentes desde el punto de vista de la protección de
                        datos:
                    </p>
                    <p>
                        Cuando visitas la web, creas una cuenta administradora,
                        gestionas tu perfil, utilizas autenticación, contratas
                        un plan o gestionas la facturación, Alberto Mondelo
                        Próspero actúa como responsable del tratamiento de esos
                        datos.
                    </p>
                    <p>
                        Cuando una empresa o profesional cliente utiliza la
                        plataforma para gestionar empleados, centros, fichajes,
                        pausas, ausencias, vacaciones, horas extra o
                        documentación laboral, la empresa o profesional cliente
                        actúa como responsable del tratamiento y Horario Digital
                        actúa, con carácter general, como encargado del
                        tratamiento por cuenta de dicho cliente.
                    </p>
                    <p>
                        En consecuencia, si tus datos aparecen en la plataforma
                        porque tu empresa utiliza Horario Digital para gestionar
                        tu jornada, la responsable principal de ese tratamiento
                        es tu empresa o empleador.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        2. Datos personales que se tratan
                    </h2>
                    <p>
                        En función del uso de la plataforma, Horario Digital
                        puede tratar las siguientes categorías de datos:
                    </p>
                    <p>
                        Datos identificativos y de contacto, como nombre,
                        apellidos, correo electrónico, teléfono, DNI/NIE, NIF,
                        CIF o, en su caso, número de la Seguridad Social cuando
                        el cliente lo incorpore para la gestión de empleados.
                    </p>
                    <p>
                        Datos de cuenta y autenticación, como contraseña cifrada
                        o hasheada, estado de verificación del correo, datos de
                        doble factor de autenticación, fecha de aceptación de
                        términos y política de privacidad y datos básicos de
                        perfil y rol.
                    </p>
                    <p>
                        Datos de empresa y centro de trabajo, como nombre de la
                        empresa, dirección, población, provincia, código postal,
                        país, zona horaria, coordenadas del centro, radios de
                        validación e IP autorizadas si el cliente las configura.
                    </p>
                    <p>
                        Datos operativos de jornada, como entradas, salidas,
                        pausas, duración de jornada, historial de fichajes,
                        vacaciones, ausencias, festivos, horas extra, resúmenes
                        diarios, informes PDF y registros de edición o
                        corrección cuando proceda.
                    </p>
                    <p>
                        Datos de localización y red, como dirección IP,
                        geolocalización, precisión aproximada y otros datos
                        técnicos necesarios para validar fichajes presenciales o
                        remotos conforme a la configuración del cliente.
                    </p>
                    <p>
                        Datos de facturación y suscripción, como identificadores
                        de cliente o suscripción en Stripe, plan contratado,
                        estado de cobro, tipo de método de pago y últimos cuatro
                        dígitos del medio de pago cuando sean facilitados por
                        Stripe. Horario Digital no almacena el número completo
                        de la tarjeta bancaria.
                    </p>
                    <p>
                        Datos derivados de comunicaciones o soporte, si contactas
                        por correo electrónico u otros canales habilitados.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        3. Finalidades del tratamiento y base legitimadora
                    </h2>
                    <p>
                        Cuando Horario Digital actúa como responsable del
                        tratamiento, los datos se tratan para gestionar el alta
                        y acceso a la cuenta, permitir el uso de la plataforma,
                        verificar el correo electrónico, reforzar la seguridad de
                        acceso, atender solicitudes, gestionar incidencias,
                        administrar la relación contractual, tramitar cobros y
                        suscripciones y cumplir obligaciones legales, contables,
                        fiscales y de seguridad.
                    </p>
                    <p>
                        Las bases jurídicas principales son la ejecución del
                        contrato o la aplicación de medidas precontractuales, el
                        cumplimiento de obligaciones legales y el interés
                        legítimo en proteger la seguridad del servicio, prevenir
                        fraude, resolver incidencias técnicas y defender
                        reclamaciones.
                    </p>
                    <p>
                        Cuando Horario Digital actúa como encargado del
                        tratamiento por cuenta del cliente, los datos se tratan
                        siguiendo las instrucciones documentadas del cliente para
                        prestar el servicio de control horario y gestión laboral
                        contratado. La base legitimadora de esos tratamientos
                        corresponde al cliente responsable.
                    </p>
                    <p>
                        Si el cliente configura validaciones de fichaje por
                        geolocalización, IP, centro asignado o terminal público,
                        dichos tratamientos se ejecutan conforme a esa
                        configuración. En el caso del fichaje público, la
                        identificación puede realizarse mediante DNI/NIE o código
                        interno de empleado.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        4. Destinatarios, proveedores y transferencias
                    </h2>
                    <p>
                        Horario Digital no vende datos personales a terceros. No
                        obstante, puede comunicar o permitir el acceso a datos a
                        proveedores necesarios para la prestación del servicio,
                        como proveedores de infraestructura, alojamiento,
                        almacenamiento, correo transaccional, seguridad,
                        servicios de pago, geocodificación o mapas y resolución
                        de IP pública.
                    </p>
                    <p>
                        En particular, la plataforma integra o puede integrar
                        servicios de terceros como Stripe para pagos y
                        suscripciones, Mapbox para funcionalidades de mapas o
                        geocodificación y servicios de resolución de IP pública
                        como ipify cuando el navegador del usuario los consulta
                        para validar el contexto de fichaje.
                    </p>
                    <p>
                        También podrán comunicarse datos a administraciones,
                        juzgados, tribunales, fuerzas y cuerpos de seguridad o
                        autoridades competentes cuando exista una obligación
                        legal o un requerimiento válido.
                    </p>
                    <p>
                        Algunos de estos proveedores pueden estar ubicados fuera
                        del Espacio Económico Europeo o implicar transferencias
                        internacionales de datos. En esos casos se aplicarán, en
                        la medida exigible, las garantías adecuadas previstas en
                        el RGPD, como decisiones de adecuación o cláusulas
                        contractuales tipo u otros mecanismos válidos.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        5. Conservación de los datos
                    </h2>
                    <p>
                        Los datos tratados por Horario Digital como responsable
                        se conservarán mientras la cuenta o relación contractual
                        permanezca activa y, posteriormente, durante el tiempo
                        necesario para atender posibles responsabilidades y
                        cumplir obligaciones legales, fiscales, contables o de
                        seguridad.
                    </p>
                    <p>
                        Los datos de facturación y suscripción podrán mantenerse
                        durante los plazos exigidos por la normativa mercantil y
                        tributaria aplicable. Los registros técnicos, de
                        seguridad o de incidencias se conservarán durante el
                        tiempo razonablemente necesario para esos fines.
                    </p>
                    <p>
                        Los datos tratados por cuenta del cliente se conservarán
                        durante la vigencia del servicio contratado y,
                        posteriormente, conforme a lo pactado con el cliente, a
                        sus instrucciones documentadas y a las obligaciones
                        legales que resulten aplicables. Si eres empleado o
                        usuario final de una empresa cliente, el plazo de
                        conservación principal lo determina tu empresa como
                        responsable del tratamiento.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        6. Derechos de las personas interesadas
                    </h2>
                    <p>
                        Puedes ejercer los derechos de acceso, rectificación,
                        supresión, oposición, limitación del tratamiento,
                        portabilidad y, cuando proceda, a no ser objeto de
                        decisiones individualizadas automatizadas, en los términos
                        previstos en la normativa aplicable.
                    </p>
                    <p>
                        Si Horario Digital actúa como responsable del
                        tratamiento, puedes ejercer tus derechos escribiendo a
                        amondelo12@gmail.com, identificándote suficientemente e
                        indicando el derecho que deseas ejercitar.
                    </p>
                    <p>
                        Si tus datos se tratan en Horario Digital porque tu
                        empresa utiliza la plataforma para gestionar tu jornada,
                        deberás dirigir preferentemente tu solicitud a tu
                        empleador o a la entidad cliente responsable del
                        tratamiento. Horario Digital podrá asistir al cliente en
                        la gestión de la solicitud conforme al contrato de
                        encargo existente entre las partes.
                    </p>
                    <p>
                        Asimismo, si consideras que el tratamiento de tus datos
                        infringe la normativa, puedes presentar una reclamación
                        ante la Agencia Española de Protección de Datos:
                        https://www.aepd.es.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        7. Seguridad y confidencialidad
                    </h2>
                    <p>
                        Horario Digital aplica medidas técnicas y organizativas
                        razonables para proteger los datos personales frente a
                        accesos no autorizados, pérdida, alteración, divulgación
                        o destrucción, teniendo en cuenta la naturaleza de los
                        datos y los riesgos del tratamiento.
                    </p>
                    <p>
                        Estas medidas pueden incluir controles de acceso,
                        autenticación, separación por roles, cifrado o hash de
                        credenciales, mecanismos de verificación, registro de
                        incidencias y medidas de seguridad sobre la
                        infraestructura y las comunicaciones. No obstante,
                        ningún sistema es completamente invulnerable y no puede
                        garantizarse una seguridad absoluta.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        8. Cookies y tecnologías similares
                    </h2>
                    <p>
                        La web y la aplicación pueden utilizar cookies técnicas,
                        de sesión y otras tecnologías estrictamente necesarias
                        para autenticación, seguridad, mantenimiento de sesión y
                        funcionamiento del servicio. En principio, Horario
                        Digital no utiliza en esta interfaz cookies publicitarias
                        propias.
                    </p>
                    <p>
                        El uso de determinados servicios de terceros integrados,
                        como pagos, mapas o resolución de IP pública, puede
                        implicar comunicaciones directas entre el navegador del
                        usuario y esos proveedores, que actuarán conforme a sus
                        propias políticas de privacidad y cookies.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        9. Contacto y contrato de encargo
                    </h2>
                    <p>
                        Si eres cliente profesional y utilizas la plataforma
                        para tratar datos de empleados o terceros, puede ser
                        necesario formalizar el correspondiente contrato de
                        encargo del tratamiento conforme al artículo 28 del
                        RGPD. Para cualquier cuestión sobre privacidad o
                        documentación asociada, puedes escribir a
                        amondelo12@gmail.com.
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
