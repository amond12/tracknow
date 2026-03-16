import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

const labelClassName =
    'text-[10px] font-bold tracking-[0.18em] text-slate-600 uppercase';
const inputClassName =
    'h-10 rounded-xl border-slate-200 bg-blue-50/40 px-3.5 shadow-none transition duration-200 focus-visible:border-blue-300 focus-visible:bg-white focus-visible:ring-blue-100';

export default function Login({
    status,
    canResetPassword,
    canRegister,
}: Props) {
    return (
        <AuthLayout
            title="Iniciar sesion"
            description="Accede a tu cuenta para continuar."
        >
            <Head title="Iniciar sesion" />

            {status && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                    {status}
                </div>
            )}

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label
                                    htmlFor="email"
                                    className={labelClassName}
                                >
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="tu@empresa.com"
                                    className={inputClassName}
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label
                                        htmlFor="password"
                                        className={labelClassName}
                                    >
                                        Contrasena
                                    </Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="ml-auto text-sm font-medium text-blue-700 decoration-blue-200 hover:text-blue-800"
                                            tabIndex={5}
                                        >
                                            Has olvidado tu contrasena?
                                        </TextLink>
                                    )}
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Introduce tu contrasena"
                                    className={inputClassName}
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/50 px-3.5 py-2.5">
                                <Label
                                    htmlFor="remember"
                                    className="text-sm font-medium text-slate-900"
                                >
                                    Mantener sesion iniciada
                                </Label>
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="mt-1 h-10 w-full rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner />}
                                Iniciar sesion
                            </Button>
                        </div>

                        {canRegister && (
                            <div className="rounded-xl border border-blue-100 bg-blue-50/50 px-3 py-2.5 text-center text-sm text-slate-600">
                                Todavia no tienes acceso?{' '}
                                <TextLink
                                    href={register()}
                                    tabIndex={5}
                                    className="font-semibold text-blue-700 decoration-blue-200 hover:text-blue-800"
                                >
                                    Crear cuenta
                                </TextLink>
                            </div>
                        )}
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
