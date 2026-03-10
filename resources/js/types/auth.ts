export type User = {
    id: number;
    name: string;
    apellido: string | null;
    email: string;
    telefono: string | null;
    dni?: string | null;
    nss?: string | null;
    role: 'admin' | 'empleado' | 'encargado';
    company_id?: number | null;
    work_center_id?: number | null;
    remoto?: boolean;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    company?: { id: number; nombre: string };
    work_center?: { id: number; nombre: string };
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
