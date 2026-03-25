import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { resolveClientPublicIp } from '@/lib/public-ip';

interface Props {
    ipsIniciales: string[];
    onIPs: (ips: string[]) => void;
}

export function CentroIP({ ipsIniciales, onIPs }: Props) {
    const [ips, setIps] = useState<string[]>(ipsIniciales);
    const [detecting, setDetecting] = useState(false);
    const [mensaje, setMensaje] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function handleDetectarIP() {
        setDetecting(true);
        setMensaje(null);
        setError(null);

        try {
            const ip = await resolveClientPublicIp();

            if (!ip) {
                setError('No se pudo detectar la IP. Comprueba tu conexion.');
                return;
            }

            if (ips.includes(ip)) {
                setMensaje(`La IP ${ip} ya esta en la lista.`);
                return;
            }

            const newIps = [...ips, ip];
            setIps(newIps);
            onIPs(newIps);
            setMensaje(`IP ${ip} anadida.`);
        } catch {
            setError('Error al detectar la IP. Comprueba tu conexion.');
        } finally {
            setDetecting(false);
        }
    }

    function handleRemove(ip: string) {
        const newIps = ips.filter((item) => item !== ip);
        setIps(newIps);
        onIPs(newIps);
        setMensaje(null);
    }

    return (
        <div className="grid gap-3">
            <p className="text-xs text-muted-foreground">
                Detecta la IP actual solo cuando estes conectado a la red del
                centro.
            </p>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDetectarIP}
                    disabled={detecting}
                    className="w-full rounded-xl border-blue-200 bg-blue-50 text-blue-700 transition-colors hover:border-blue-300 hover:bg-blue-100 sm:w-auto"
                >
                    {detecting ? 'Detectando...' : 'Detectar IP actual'}
                </Button>
            </div>

            {ips.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {ips.map((ip) => (
                        <span
                            key={ip}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 font-mono text-xs text-blue-700"
                        >
                            {ip}
                            <button
                                type="button"
                                onClick={() => handleRemove(ip)}
                                className="leading-none text-blue-400 transition-colors hover:text-red-500"
                                aria-label={`Eliminar IP ${ip}`}
                            >
                                x
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {mensaje && (
                <p className="text-xs text-muted-foreground">{mensaje}</p>
            )}
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}
