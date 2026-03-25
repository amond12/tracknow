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
    clock_code_suffix?: string | null;
    clock_code?: string | null;
    horario_lunes?: number | null;
    horario_martes?: number | null;
    horario_miercoles?: number | null;
    horario_jueves?: number | null;
    horario_viernes?: number | null;
    horario_sabado?: number | null;
    horario_domingo?: number | null;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    company?: { id: number; nombre: string; clock_code_prefix?: string | null };
    work_center?: { id: number; nombre: string; timezone?: string | null };
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
