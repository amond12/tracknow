import { Transition } from '@headlessui/react';
import { Form, Head, Link, usePage } from '@inertiajs/react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Perfil',
        href: edit(),
    },
];

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Perfil" />

            <h1 className="sr-only">Configuracion del perfil</h1>

            <SettingsLayout>
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Informacion del perfil"
                        description="Actualiza tus datos personales y tu correo"
                    />

                    <Form
                        {...ProfileController.update.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        className="space-y-6"
                    >
                        {({ processing, recentlySuccessful, errors }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Nombre</Label>

                                    <Input
                                        id="name"
                                        className="mt-1 block w-full"
                                        defaultValue={auth.user.name}
                                        name="name"
                                        required
                                        autoComplete="name"
                                        placeholder="Nombre completo"
                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.name}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="apellido">Apellidos</Label>

                                    <Input
                                        id="apellido"
                                        className="mt-1 block w-full"
                                        defaultValue={auth.user.apellido ?? ''}
                                        name="apellido"
                                        required
                                        autoComplete="family-name"
                                        placeholder="Apellidos"
                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.apellido}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="dni">DNI / NIE</Label>

                                    <Input
                                        id="dni"
                                        type="text"
                                        className="mt-1 block w-full"
                                        defaultValue={
                                            (auth.user as any).dni ?? ''
                                        }
                                        name="dni"
                                        required
                                        autoComplete="off"
                                        placeholder="12345678A"
                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.dni}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="email">Correo electronico</Label>

                                    <Input
                                        id="email"
                                        type="email"
                                        className="mt-1 block w-full"
                                        defaultValue={auth.user.email}
                                        name="email"
                                        required
                                        autoComplete="username"
                                        placeholder="correo@empresa.com"
                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.email}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="telefono">Telefono</Label>

                                    <Input
                                        id="telefono"
                                        type="tel"
                                        className="mt-1 block w-full"
                                        defaultValue={auth.user.telefono ?? ''}
                                        name="telefono"
                                        required
                                        autoComplete="tel"
                                        placeholder="+34 600 000 000"
                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.telefono}
                                    />
                                </div>

                                {mustVerifyEmail &&
                                    auth.user.email_verified_at === null && (
                                        <div>
                                            <p className="-mt-4 text-sm text-muted-foreground">
                                                Tu correo aun no esta
                                                verificado.{' '}
                                                <Link
                                                    href={send()}
                                                    as="button"
                                                    className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                                >
                                                    Pulsa aqui para reenviar el
                                                    correo de verificacion.
                                                </Link>
                                            </p>

                                            {status ===
                                                'verification-link-sent' && (
                                                <div className="mt-2 text-sm font-medium text-green-600">
                                                    Hemos enviado un nuevo
                                                    enlace de verificacion a tu
                                                    correo.
                                                </div>
                                            )}
                                        </div>
                                    )}

                                <div className="flex items-center gap-4">
                                    <Button
                                        disabled={processing}
                                        data-test="update-profile-button"
                                    >
                                        Guardar
                                    </Button>

                                    <Transition
                                        show={recentlySuccessful}
                                        enter="transition ease-in-out"
                                        enterFrom="opacity-0"
                                        leave="transition ease-in-out"
                                        leaveTo="opacity-0"
                                    >
                                        <p className="text-sm text-neutral-600">
                                            Guardado
                                        </p>
                                    </Transition>
                                </div>
                            </>
                        )}
                    </Form>
                </div>

                <DeleteUser />
            </SettingsLayout>
        </AppLayout>
    );
}
