import { useState } from 'react';
import { Button } from '@/components/ui/button';

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
            const res = await fetch('https://api.ipify.org?format=json');
            const data = await res.json();
            const ip: string = data.ip;
            if (ips.includes(ip)) {
                setMensaje(`La IP ${ip} ya está en la lista.`);
                return;
            }
            const newIps = [...ips, ip];
            setIps(newIps);
            onIPs(newIps);
            setMensaje(`IP ${ip} añadida.`);
        } catch {
            setError('Error al detectar la IP. Comprueba tu conexión.');
        } finally {
            setDetecting(false);
        }
    }

    function handleRemove(ip: string) {
        const newIps = ips.filter((i) => i !== ip);
        setIps(newIps);
        onIPs(newIps);
        setMensaje(null);
    }

    return (
        <div className="flex flex-col gap-3">
            <p className="text-sm text-amber-600 dark:text-amber-400">
                ⚠️ Asegúrate de estar conectado a la red del centro antes de detectar la IP
            </p>
            <div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDetectarIP}
                    disabled={detecting}
                >
                    {detecting ? 'Detectando...' : '🌐 Detectar IP'}
                </Button>
            </div>
            {mensaje && <p className="text-sm text-muted-foreground">{mensaje}</p>}
            {error && <p className="text-sm text-destructive">{error}</p>}
            {ips.length > 0 && (
                <ul className="flex flex-col gap-1">
                    {ips.map((ip) => (
                        <li
                            key={ip}
                            className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm"
                        >
                            <span className="font-mono">{ip}</span>
                            <button
                                type="button"
                                onClick={() => handleRemove(ip)}
                                className="ml-2 text-muted-foreground hover:text-destructive"
                                aria-label={`Eliminar IP ${ip}`}
                            >
                                ✕
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
