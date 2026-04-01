import { Head } from '@inertiajs/react';
import TextLink from '@/components/text-link';
import AuthLayout from '@/layouts/auth-layout';
import { register } from '@/routes';

export default function TermsAndConditions() {
    return (
        <AuthLayout
            title="Términos y condiciones"
            description="Condiciones generales de uso y contratación del servicio Horario Digital."
            maxWidth="xl"
        >
            <Head title="Términos y condiciones" />

            <div className="space-y-6 text-sm leading-7 text-slate-700">
                <section className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
                    <p>
                        Titular del servicio: Alberto Mondelo Próspero, con
                        NIF/CIF 23889622M y domicilio en Carrer Huelva,
                        Moncada, Valencia.
                    </p>
                    <p>
                        Correo de contacto legal: amondelo12@gmail.com. Fecha
                        de última actualización: 01/04/2026.
                    </p>
                    <p>
                        La creación de una cuenta administradora, la
                        contratación de un plan o el uso del servicio en nombre
                        de una empresa o profesional implican la aceptación de
                        estos términos y condiciones.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        1. Titular del servicio y aceptación
                    </h2>
                    <p>
                        Horario Digital es un servicio prestado por Alberto
                        Mondelo Próspero para empresas y profesionales que
                        necesitan gestionar el control horario de su
                        organización. Estos términos regulan el acceso, la
                        contratación y el uso de la plataforma web, la
                        experiencia móvil basada en web y las funcionalidades
                        asociadas.
                    </p>
                    <p>
                        Si aceptas estos términos en nombre de una empresa o de
                        un profesional, declaras que cuentas con facultades
                        suficientes para vincular a dicha entidad y que el uso
                        del servicio se realizará dentro de su actividad
                        profesional o empresarial.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        2. Objeto del servicio
                    </h2>
                    <p>
                        El servicio permite, entre otras funciones, crear una
                        cuenta administradora, gestionar empresas, centros de
                        trabajo, empleados y encargados, registrar entradas,
                        pausas y salidas, controlar ausencias, vacaciones y
                        horas extra, consultar históricos y generar informes y
                        documentos PDF.
                    </p>
                    <p>
                        Horario Digital se ofrece como una herramienta de apoyo
                        a la gestión del control horario. El cliente es el único
                        responsable de utilizarla de acuerdo con su actividad,
                        sus procesos internos y la normativa que le resulte
                        aplicable.
                    </p>
                    <p>
                        La contratación y el uso de Horario Digital no
                        constituyen asesoramiento jurídico o laboral ni suponen
                        una garantía de cumplimiento automático de la normativa
                        vigente o futura aplicable al cliente, incluidos, entre
                        otros aspectos, los relativos a jornada, registro
                        horario, horas extraordinarias, descansos, trabajo a
                        tiempo parcial, desconexión digital o negociación
                        colectiva.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        3. Cuenta principal, usuarios autorizados y roles
                    </h2>
                    <p>
                        El contratante del servicio es la empresa o profesional
                        que crea la cuenta administradora. Esa cuenta principal
                        puede dar de alta usuarios autorizados, incluidos
                        empleados y encargados, y asignarles centros de trabajo,
                        roles y permisos operativos dentro de la plataforma.
                    </p>
                    <p>
                        El cliente responde de toda actividad realizada desde
                        sus cuentas, del alta y baja de usuarios autorizados, de
                        la custodia de credenciales y de mantener actualizada la
                        información facilitada a la plataforma.
                    </p>
                    <p>
                        En particular, corresponde al cliente, en su condición
                        de empleador o responsable de la organización del
                        trabajo, definir y configurar correctamente horarios,
                        pausas, centros, políticas de trabajo remoto, permisos y
                        correcciones de fichajes, así como revisar la adecuación
                        del uso del servicio a su convenio colectivo, acuerdos
                        internos y obligaciones legales.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        4. Obligaciones del cliente y uso permitido
                    </h2>
                    <p>
                        El cliente se obliga a usar el servicio de forma
                        lícita, diligente y conforme a la buena fe, a facilitar
                        datos veraces, a contar con autorización suficiente para
                        dar de alta a sus usuarios y a cumplir sus obligaciones
                        laborales, organizativas y de protección de datos frente
                        a su plantilla y terceras personas.
                    </p>
                    <p>
                        También será responsabilidad exclusiva del cliente
                        informar a las personas trabajadoras y, en su caso, a su
                        representación legal, sobre el sistema de registro
                        utilizado, sus reglas de funcionamiento, las políticas
                        internas aplicables y la conservación o puesta a
                        disposición de la información cuando resulte exigible.
                    </p>
                    <p>
                        Queda prohibido, entre otros usos, el acceso no
                        autorizado al servicio, la cesión irregular de
                        credenciales, la manipulación fraudulenta de fichajes o
                        datos, la alteración de medidas de seguridad, la
                        ingeniería inversa cuando no esté permitida por ley y
                        cualquier uso que pueda perjudicar al titular del
                        servicio, a otros clientes o a la infraestructura
                        técnica.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        5. Reglas específicas del control horario
                    </h2>
                    <p>
                        Para prestar el servicio, Horario Digital puede
                        registrar y tratar datos operativos vinculados al
                        control horario, como horarios de entrada y salida,
                        pausas, centro de trabajo asignado, histórico de
                        jornadas, datos de red, dirección IP, geolocalización y
                        otros datos técnicos necesarios para validar fichajes
                        presenciales o remotos.
                    </p>
                    <p>
                        Cuando el cliente habilite terminales de fichaje
                        público, la identificación podrá realizarse mediante
                        DNI/NIE o código interno de empleado. La configuración,
                        ubicación y uso de dichos terminales es responsabilidad
                        exclusiva del cliente, que deberá informar
                        adecuadamente a sus trabajadores sobre el tratamiento de
                        los datos y el funcionamiento del sistema.
                    </p>
                    <p>
                        El cliente es responsable de revisar la corrección de
                        los fichajes registrados, de las políticas internas de
                        jornada, pausas y trabajo remoto y de la adopción de las
                        medidas necesarias para evitar usos indebidos o fichajes
                        realizados sin autorización.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        6. Prueba gratuita, suscripción, facturación y
                        cancelación
                    </h2>
                    <p>
                        Las nuevas cuentas administradoras pueden disponer de un
                        período de prueba gratuito de 15 días, salvo que el
                        titular del servicio indique otra cosa en una oferta
                        concreta. Finalizado ese período, el acceso podrá quedar
                        limitado o suspendido hasta la contratación de un plan
                        activo.
                    </p>
                    <p>
                        El servicio se comercializa mediante suscripciones de
                        pago recurrente con renovación automática. Los planes,
                        límites de uso y precios aplicables serán los vigentes
                        en el momento de la contratación o los que resulten de
                        un acuerdo comercial específico. Si existe un acuerdo
                        personalizado, prevalecerá sobre la información general
                        publicada.
                    </p>
                    <p>
                        El alta, el cambio de plan, la gestión de la
                        facturación y, en su caso, la cancelación se tramitan
                        mediante Stripe o herramientas vinculadas a Stripe. La
                        cancelación evita renovaciones futuras y produce efectos
                        al final del período ya abonado, salvo disposición legal
                        imperativa o condiciones particulares más favorables.
                    </p>
                    <p>
                        Salvo obligación legal en contrario, los importes
                        abonados no son reembolsables. El titular del servicio
                        podrá suspender o limitar el acceso ante impagos,
                        devoluciones, fraude, incidencias de cobro o uso del
                        servicio fuera de los límites del plan contratado.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        7. Propiedad intelectual, datos del cliente y privacidad
                    </h2>
                    <p>
                        Todos los derechos de propiedad intelectual e industrial
                        sobre Horario Digital, su software, diseño, marca,
                        código, documentación y elementos distintivos
                        corresponden a Alberto Mondelo Próspero o a sus
                        licenciantes. El cliente no adquiere ningún derecho de
                        propiedad sobre la plataforma, más allá de un derecho
                        de uso limitado mientras la suscripción permanezca
                        activa.
                    </p>
                    <p>
                        Los datos, documentos e informaciones incorporados por
                        el cliente o sus usuarios autorizados siguen siendo del
                        cliente o de quien ostente legítimamente los derechos
                        sobre ellos. El tratamiento de datos personales se
                        describe adicionalmente en la política de privacidad,
                        que complementa estos términos.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        8. Disponibilidad, cambios del servicio y soporte
                    </h2>
                    <p>
                        El titular del servicio adoptará medidas razonables para
                        mantener la plataforma disponible y segura, pero no
                        garantiza disponibilidad continua ni libre de errores.
                        No se ofrece un SLA expreso salvo pacto escrito en
                        contrario.
                    </p>
                    <p>
                        Horario Digital puede incorporar mejoras, cambios
                        funcionales, actualizaciones de seguridad, medidas
                        antifraude, mantenimientos programados o no programados
                        y adaptaciones técnicas necesarias para la continuidad
                        del servicio y el cumplimiento normativo.
                    </p>
                    <p>
                        Los cambios normativos presentes o futuros que afecten
                        al registro de jornada o a cualquier otra obligación del
                        cliente podrán requerir configuraciones adicionales,
                        cambios operativos, contratación de nuevas
                        funcionalidades o desarrollos posteriores. Salvo pacto
                        expreso por escrito, el titular del servicio no asume la
                        obligación de adaptar el servicio a una norma concreta
                        dentro de un plazo determinado ni garantiza que una
                        determinada configuración sea suficiente para cumplir,
                        por sí sola, todas las exigencias legales aplicables al
                        cliente.
                    </p>
                    <p>
                        El soporte se prestará, en su caso, a través de los
                        canales habilitados por el titular del servicio y dentro
                        del alcance razonable de un SaaS estándar, salvo acuerdo
                        específico distinto.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        9. Suspensión o resolución
                    </h2>
                    <p>
                        El titular del servicio podrá suspender temporalmente o
                        resolver la relación contractual si aprecia un
                        incumplimiento grave de estos términos, impago, fraude,
                        riesgos para la seguridad, uso abusivo de la
                        infraestructura o requerimientos legales o judiciales
                        que lo justifiquen.
                    </p>
                    <p>
                        El cliente podrá dejar de utilizar el servicio y
                        solicitar la cancelación de la suscripción conforme a
                        las reglas del apartado de facturación. La eliminación
                        de la cuenta o la baja del servicio no exime del pago de
                        las cantidades ya devengadas.
                    </p>
                    <p>
                        En caso de cancelación, baja o terminación del servicio,
                        corresponderá al cliente exportar, conservar y custodiar
                        los registros, resúmenes y demás documentación que deba
                        mantener por obligación legal, laboral, fiscal o
                        probatoria. El titular del servicio no asumirá la
                        conservación de dicha información más allá de los plazos
                        y condiciones técnicas que, en su caso, se comuniquen al
                        cliente.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold text-slate-950">
                        10. Responsabilidad, ley aplicable y contacto
                    </h2>
                    <p>
                        El servicio se ofrece como una solución tecnológica de
                        apoyo y el cliente asume la responsabilidad sobre la
                        configuración funcional, la validez de los datos
                        introducidos, la información suministrada a su plantilla
                        y el cumplimiento de sus obligaciones empresariales,
                        laborales y de privacidad.
                    </p>
                    <p>
                        En consecuencia, el titular del servicio no responderá
                        frente al cliente por sanciones, reclamaciones,
                        liquidaciones, recargos, conflictos laborales o
                        incumplimientos regulatorios derivados de una
                        configuración incorrecta, de un uso inadecuado del
                        servicio, de la falta de revisión de los registros o del
                        incumplimiento por parte del cliente de sus propias
                        obligaciones legales y organizativas.
                    </p>
                    <p>
                        En la medida máxima permitida por la ley, Alberto
                        Mondelo Próspero no responderá por daños indirectos,
                        lucro cesante, pérdida de negocio o pérdida de datos
                        derivada de usos indebidos del cliente o de decisiones
                        adoptadas a partir de la información del sistema. En
                        cualquier caso, la responsabilidad total acumulada del
                        titular del servicio frente al cliente quedará limitada
                        al importe efectivamente abonado por el cliente en los
                        12 meses anteriores al hecho causante.
                    </p>
                    <p>
                        Estos términos se regirán por la ley española. Para
                        cualquier controversia, las partes se someten a los
                        juzgados y tribunales de Valencia, España, salvo que una
                        norma imperativa disponga otra cosa. Para consultas o
                        reclamaciones relacionadas con estos términos, puedes
                        escribir a amondelo12@gmail.com.
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
