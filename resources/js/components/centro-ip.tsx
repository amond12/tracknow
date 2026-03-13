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
            <p className="text-xs text-amber-600">
                ⚠️ Asegúrate de estar conectado a la red del centro antes de detectar la IP
            </p>
            <div className="flex items-center gap-2 flex-wrap">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDetectarIP}
                    disabled={detecting}
                    className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 hover:-translate-y-px transition-all"
                >
                    {detecting ? 'Detectando...' : '🌐 Detectar IP'}
                </Button>
                {ips.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {ips.map((ip) => (
                            <span
                                key={ip}
                                className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 font-mono text-xs px-2.5 py-1 rounded-lg"
                            >
                                {ip}
                                <button
                                    type="button"
                                    onClick={() => handleRemove(ip)}
                                    className="text-blue-400 hover:text-red-500 transition-colors leading-none"
                                    aria-label={`Eliminar IP ${ip}`}
                                >
                                    ✕
                                </button>
                            </span>
                        ))}
                    </div>
                )}
            </div>
            {mensaje && <p className="text-xs text-muted-foreground">{mensaje}</p>}
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}
