import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { login } from '@/routes';
import { store } from '@/routes/register';

const labelClassName =
    'text-[10px] font-bold tracking-[0.18em] text-slate-600 uppercase';
const inputClassName =
    'h-10 rounded-xl border-slate-200 bg-blue-50/40 px-3.5 shadow-none transition duration-200 focus-visible:border-blue-300 focus-visible:bg-white focus-visible:ring-blue-100';

export default function Register() {
    return (
        <AuthLayout
            title="Crear cuenta"
            description="Completa los datos para dar de alta al usuario."
            maxWidth="xl"
        >
            <Head title="Registro" />
            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-4"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-3 lg:grid-cols-3">
                            <div className="grid gap-2">
                                <Label
                                    htmlFor="name"
                                    className={labelClassName}
                                >
                                    Nombre
                                </Label>
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="name"
                                    name="name"
                                    placeholder="Nombre"
                                    className={inputClassName}
                                />
                                <InputError
                                    message={errors.name}
                                    className="mt-1"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label
                                    htmlFor="apellido"
                                    className={labelClassName}
                                >
                                    Apellidos
                                </Label>
                                <Input
                                    id="apellido"
                                    type="text"
                                    required
                                    tabIndex={2}
                                    autoComplete="family-name"
                                    name="apellido"
                                    placeholder="Apellidos"
                                    className={inputClassName}
                                />
                                <InputError message={errors.apellido} />
                            </div>

                            <div className="grid gap-2">
                                <Label
                                    htmlFor="telefono"
                                    className={labelClassName}
                                >
                                    Telefono
                                </Label>
                                <Input
                                    id="telefono"
                                    type="tel"
                                    required
                                    tabIndex={3}
                                    autoComplete="tel"
                                    name="telefono"
                                    placeholder="+34 600 000 000"
                                    className={inputClassName}
                                />
                                <InputError message={errors.telefono} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="dni" className={labelClassName}>
                                    DNI / NIE
                                </Label>
                                <Input
                                    id="dni"
                                    type="text"
                                    required
                                    tabIndex={4}
                                    autoComplete="off"
                                    name="dni"
                                    placeholder="12345678A"
                                    className={inputClassName}
                                />
                                <InputError message={errors.dni} />
                            </div>

                            <div className="grid gap-2 lg:col-span-2">
                                <Label
                                    htmlFor="email"
                                    className={labelClassName}
                                >
                                    Correo electronico
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    tabIndex={5}
                                    autoComplete="email"
                                    name="email"
                                    placeholder="usuario@empresa.com"
                                    className={inputClassName}
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label
                                    htmlFor="password"
                                    className={labelClassName}
                                >
                                    Contraseña
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    tabIndex={6}
                                    autoComplete="new-password"
                                    name="password"
                                    placeholder="Crea una contraseña segura"
                                    className={inputClassName}
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label
                                    htmlFor="password_confirmation"
                                    className={labelClassName}
                                >
                                    Confirmar contraseña
                                </Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    required
                                    tabIndex={7}
                                    autoComplete="new-password"
                                    name="password_confirmation"
                                    placeholder="Repite la contraseña"
                                    className={inputClassName}
                                />
                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </div>

                            <div className="flex items-end">
                                <Button
                                    type="submit"
                                    className="h-10 w-full rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700"
                                    tabIndex={8}
                                    data-test="register-user-button"
                                >
                                    {processing && <Spinner />}
                                    Crear cuenta
                                </Button>
                            </div>
                        </div>

                        <div className="rounded-xl border border-blue-100 bg-blue-50/50 px-3 py-2.5 text-center text-sm text-slate-600">
                            Ya tienes una cuenta?{' '}
                            <TextLink
                                href={login()}
                                tabIndex={9}
                                className="font-semibold text-blue-700 decoration-blue-200 hover:text-blue-800"
                            >
                                Iniciar sesion
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
