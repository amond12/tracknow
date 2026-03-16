export type * from './auth';
export type * from './navigation';
export type * from './ui';

export type Company = {
    id: number;
    user_id: number;
    nombre: string;
    cif: string;
    pais: string;
    ciudad: string;
    direccion: string;
    cp: string;
    created_at: string;
    updated_at: string;
    work_centers_count?: number;
    empleados_count?: number;
};

export type WorkCenter = {
    id: number;
    company_id: number;
    nombre: string;
    pais: string;
    provincia: string;
    poblacion: string;
    direccion: string;
    cp: string;
    timezone: string;
    lat?: number | null;
    lng?: number | null;
    radio?: number | null;
    ips?: string[] | null;
    created_at: string;
    updated_at: string;
    users_count?: number;
};

export type Pausa = {
    id: number;
    fichaje_id: number;
    inicio_pausa: string;
    fin_pausa?: string | null;
    duracion_pausa?: number | null;
    lat_inicio?: number | null;
    lng_inicio?: number | null;
    ip_inicio?: string | null;
    lat_fin?: number | null;
    lng_fin?: number | null;
    ip_fin?: string | null;
    created_at: string;
    updated_at: string;
};

export type EdicionFichaje = {
    id: number;
    fichaje_id: number;
    pausa_id?: number | null;
    user_id: number;
    campo: string;
    valor_anterior?: string | null;
    valor_nuevo: string;
    motivo: string;
    created_at: string;
    updated_at: string;
    user?: { id: number; name: string };
};

export type Fichaje = {
    id: number;
    user_id: number;
    work_center_id: number;
    timezone?: string;
    fecha: string;
    inicio_jornada: string;
    fin_jornada?: string | null;
    duracion_jornada?: number | null;
    estado: 'activa' | 'pausa' | 'finalizada';
    lat_inicio?: number | null;
    lng_inicio?: number | null;
    ip_inicio?: string | null;
    lat_fin?: number | null;
    lng_fin?: number | null;
    ip_fin?: string | null;
    work_center?: Pick<WorkCenter, 'id' | 'nombre' | 'timezone'>;
    pausas?: Pausa[];
    ediciones?: EdicionFichaje[];
    created_at: string;
    updated_at: string;
};

export type ResumenDiario = {
    id: number;
    user_id: number;
    fecha: string;
    horas_trabajadas: number;
    horas_extra: number;
    created_at: string;
    updated_at: string;
};
