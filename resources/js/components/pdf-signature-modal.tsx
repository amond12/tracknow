import { router } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle2,
    Eraser,
    Lock,
    Pencil,
    Shield,
    UserRound,
} from 'lucide-react';
import {
    useCallback,
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

export interface PdfSignatureState {
    companySigned: boolean;
    employeeSigned: boolean;
    locked: boolean;
    companySignerName: string | null;
    companySignerTitle: string | null;
    companySignerUserId: number | null;
    companySignedAt: string | null;
    employeeSignerName: string | null;
    employeeSignerUserId: number | null;
    employeeSignedAt: string | null;
}

export interface PdfSignatureTarget {
    id: number;
    nombre: string;
    apellido: string;
    firmas: PdfSignatureState;
}

type SignaturePadHandle = {
    clear: () => void;
    toDataUrl: () => string | null;
};

type SignaturePadProps = {
    disabled?: boolean;
    resetKey: string;
    onStrokeChange: (hasStroke: boolean) => void;
};

const PAD_HEIGHT = 180;

const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
    function SignaturePad(
        { disabled = false, resetKey, onStrokeChange }: SignaturePadProps,
        ref,
    ) {
        const canvasRef = useRef<HTMLCanvasElement | null>(null);
        const drawingRef = useRef(false);
        const hasStrokeRef = useRef(false);
        const lastPointRef = useRef<{ x: number; y: number } | null>(null);

        const prepareCanvas = useCallback(() => {
            const canvas = canvasRef.current;

            if (!canvas) {
                return;
            }

            const width = canvas.clientWidth || 1;
            const ratio = Math.max(window.devicePixelRatio || 1, 1);
            const context = canvas.getContext('2d');

            if (!context) {
                return;
            }

            canvas.width = Math.floor(width * ratio);
            canvas.height = Math.floor(PAD_HEIGHT * ratio);

            context.setTransform(1, 0, 0, 1, 0, 0);
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.scale(ratio, ratio);
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, width, PAD_HEIGHT);
            context.strokeStyle = '#111827';
            context.lineWidth = 2.2;
            context.lineCap = 'round';
            context.lineJoin = 'round';

            drawingRef.current = false;
            hasStrokeRef.current = false;
            lastPointRef.current = null;
            onStrokeChange(false);
        }, [onStrokeChange]);

        useEffect(() => {
            const frame = window.requestAnimationFrame(prepareCanvas);

            return () => window.cancelAnimationFrame(frame);
        }, [prepareCanvas, resetKey]);

        useImperativeHandle(ref, () => ({
            clear: prepareCanvas,
            toDataUrl: () =>
                hasStrokeRef.current ? canvasRef.current?.toDataURL('image/png') ?? null : null,
        }));

        function getCanvasPoint(clientX: number, clientY: number) {
            const canvas = canvasRef.current;

            if (!canvas) {
                return null;
            }

            const rect = canvas.getBoundingClientRect();

            return {
                x: clientX - rect.left,
                y: clientY - rect.top,
            };
        }

        function markAsSigned() {
            if (!hasStrokeRef.current) {
                hasStrokeRef.current = true;
                onStrokeChange(true);
            }
        }

        function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
            if (disabled) {
                return;
            }

            const canvas = canvasRef.current;
            const context = canvas?.getContext('2d');
            const point = getCanvasPoint(event.clientX, event.clientY);

            if (!canvas || !context || !point) {
                return;
            }

            event.preventDefault();
            canvas.setPointerCapture(event.pointerId);

            drawingRef.current = true;
            lastPointRef.current = point;
            markAsSigned();

            context.beginPath();
            context.moveTo(point.x, point.y);
            context.lineTo(point.x + 0.01, point.y + 0.01);
            context.stroke();
        }

        function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
            if (disabled || !drawingRef.current) {
                return;
            }

            const context = canvasRef.current?.getContext('2d');
            const point = getCanvasPoint(event.clientX, event.clientY);
            const lastPoint = lastPointRef.current;

            if (!context || !point || !lastPoint) {
                return;
            }

            event.preventDefault();
            context.beginPath();
            context.moveTo(lastPoint.x, lastPoint.y);
            context.lineTo(point.x, point.y);
            context.stroke();

            lastPointRef.current = point;
            markAsSigned();
        }

        function finishDrawing() {
            drawingRef.current = false;
            lastPointRef.current = null;
        }

        return (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-inner">
                <canvas
                    ref={canvasRef}
                    className={cn(
                        'block h-[180px] w-full bg-white',
                        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-crosshair',
                    )}
                    style={{ touchAction: 'none' }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={finishDrawing}
                    onPointerCancel={finishDrawing}
                />
            </div>
        );
    },
);

type SignatureSectionProps = {
    title: string;
    subtitle: string;
    icon: typeof Shield;
    signed: boolean;
    signerName: string | null;
    signerRole?: string | null;
    signedAt: string | null;
    editable: boolean;
    locked: boolean;
    resetKey: string;
    processing: boolean;
    error?: string;
    onSave: (signature: string) => void;
};

function formatSignedAt(value: string | null): string | null {
    if (!value) {
        return null;
    }

    return new Intl.DateTimeFormat('es-ES', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

function SignatureSection({
    title,
    subtitle,
    icon: Icon,
    signed,
    signerName,
    signerRole,
    signedAt,
    editable,
    locked,
    resetKey,
    processing,
    error,
    onSave,
}: SignatureSectionProps) {
    const padRef = useRef<SignaturePadHandle | null>(null);
    const [hasStroke, setHasStroke] = useState(false);

    return (
        <section className="rounded-3xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white">
                            <Icon className="h-4 w-4" />
                        </span>
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900">
                                {title}
                            </h3>
                            <p className="text-xs text-slate-500">{subtitle}</p>
                        </div>
                    </div>
                </div>

                <span
                    className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium',
                        signed
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-200 text-slate-600',
                    )}
                >
                    {signed ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                        <Pencil className="h-3.5 w-3.5" />
                    )}
                    {signed ? 'Firmado' : 'Pendiente'}
                </span>
            </div>

            <div className="mt-4 space-y-2 text-xs text-slate-600">
                {signerName ? (
                    <p>
                        <span className="font-medium text-slate-900">
                            Firmante:
                        </span>{' '}
                        {signerName}
                        {signerRole ? ` · ${signerRole}` : ''}
                    </p>
                ) : (
                    <p>
                        <span className="font-medium text-slate-900">
                            Firmante:
                        </span>{' '}
                        pendiente
                    </p>
                )}

                <p>
                    <span className="font-medium text-slate-900">Fecha:</span>{' '}
                    {formatSignedAt(signedAt) ?? 'pendiente'}
                </p>
            </div>

            {editable ? (
                <div className="mt-4 space-y-3">
                    <SignaturePad
                        ref={padRef}
                        resetKey={resetKey}
                        onStrokeChange={setHasStroke}
                    />
                    <p className="text-xs leading-5 text-slate-500">
                        Firma dentro del recuadro. Si ya existe una firma en este
                        lado, la nueva la sustituirá mientras el documento siga
                        abierto.
                    </p>
                    {error && (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                            {error}
                        </div>
                    )}
                    <div className="flex flex-wrap items-center justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                padRef.current?.clear();
                                setHasStroke(false);
                            }}
                        >
                            <Eraser className="h-3.5 w-3.5" />
                            Limpiar
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            disabled={processing || !hasStroke}
                            onClick={() => {
                                const dataUrl = padRef.current?.toDataUrl();

                                if (!dataUrl) {
                                    return;
                                }

                                onSave(dataUrl);
                            }}
                        >
                            {processing ? <Spinner /> : <Pencil className="h-3.5 w-3.5" />}
                            Guardar firma
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white/80 px-3 py-3 text-xs leading-5 text-slate-500">
                    {locked ? (
                        <span className="inline-flex items-center gap-2">
                            <Lock className="h-3.5 w-3.5" />
                            El documento está cerrado porque ya tiene ambas
                            firmas.
                        </span>
                    ) : signed ? (
                        'Este lado ya tiene firma guardada y no puede sustituirse desde esta sesión.'
                    ) : (
                        'Este lado solo puede firmarlo el usuario autorizado.'
                    )}
                </div>
            )}
        </section>
    );
}

interface PdfSignatureModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    target: PdfSignatureTarget | null;
    mes: number;
    anio: number;
    periodLabel: string;
    canSignCompany: boolean;
    canSignEmployee: boolean;
}

export function PdfSignatureModal({
    open,
    onOpenChange,
    target,
    mes,
    anio,
    periodLabel,
    canSignCompany,
    canSignEmployee,
}: PdfSignatureModalProps) {
    const [companyPadVersion, setCompanyPadVersion] = useState(0);
    const [employeePadVersion, setEmployeePadVersion] = useState(0);
    const [processingSide, setProcessingSide] = useState<
        'company' | 'employee' | null
    >(null);
    const [sideErrors, setSideErrors] = useState<Record<'company' | 'employee', string | undefined>>({
        company: undefined,
        employee: undefined,
    });

    if (!target) {
        return null;
    }

    function handleOpenChange(nextOpen: boolean) {
        if (!nextOpen) {
            setSideErrors({ company: undefined, employee: undefined });
            setCompanyPadVersion((value) => value + 1);
            setEmployeePadVersion((value) => value + 1);
            setProcessingSide(null);
        }

        onOpenChange(nextOpen);
    }

    function submitSignature(side: 'company' | 'employee', signature: string) {
        if (!target) {
            return;
        }

        setSideErrors((current) => ({
            ...current,
            [side]: undefined,
        }));
        setProcessingSide(side);

        router.post(`/pdfs/${target.id}/sign`, {
            mes: String(mes),
            anio: String(anio),
            side,
            signature,
        }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                if (side === 'company') {
                    setCompanyPadVersion((value) => value + 1);
                } else {
                    setEmployeePadVersion((value) => value + 1);
                }
            },
            onError: (errors) => {
                setSideErrors((current) => ({
                    ...current,
                    [side]:
                        errors.signature ??
                        errors.side ??
                        errors.mes ??
                        errors.anio ??
                        'No se pudo guardar la firma.',
                    }));
            },
            onFinish: () => {
                setProcessingSide(null);
            },
        });
    }

    const employeeFullName = `${target.nombre} ${target.apellido}`.trim();

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
                <DialogHeader className="space-y-3">
                    <DialogTitle>Firmar documento mensual</DialogTitle>
                    <DialogDescription className="space-y-1">
                        <span className="block font-medium text-slate-900">
                            {employeeFullName}
                        </span>
                        <span className="block">
                            Registro de jornada de {periodLabel}.
                        </span>
                    </DialogDescription>
                </DialogHeader>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    {target.firmas.locked ? (
                        <span className="inline-flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            El documento ya está cerrado con firma de empresa y
                            del trabajador.
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            Cada lado puede volver a firmar solo desde la sesión
                            autorizada hasta que existan ambas firmas.
                        </span>
                    )}
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <div data-signature-side="company">
                        <SignatureSection
                            title="Firma de empresa"
                            subtitle="Admin o encargado autorizado"
                            icon={Shield}
                            signed={target.firmas.companySigned}
                            signerName={target.firmas.companySignerName}
                            signerRole={target.firmas.companySignerTitle}
                            signedAt={target.firmas.companySignedAt}
                            editable={canSignCompany}
                            locked={target.firmas.locked}
                            resetKey={`${target.id}-${target.firmas.companySignedAt ?? 'pending'}-${companyPadVersion}`}
                            processing={processingSide !== null}
                            error={sideErrors.company}
                            onSave={(signature) =>
                                submitSignature('company', signature)
                            }
                        />
                    </div>

                    <div data-signature-side="employee">
                        <SignatureSection
                            title="Firma del trabajador"
                            subtitle="Solo la cuenta titular del documento"
                            icon={UserRound}
                            signed={target.firmas.employeeSigned}
                            signerName={target.firmas.employeeSignerName}
                            signedAt={target.firmas.employeeSignedAt}
                            editable={canSignEmployee}
                            locked={target.firmas.locked}
                            resetKey={`${target.id}-${target.firmas.employeeSignedAt ?? 'pending'}-${employeePadVersion}`}
                            processing={processingSide !== null}
                            error={sideErrors.employee}
                            onSave={(signature) =>
                                submitSignature('employee', signature)
                            }
                        />
                    </div>
                </div>

                <DialogFooter className="sm:justify-between">
                    <p className="text-xs text-slate-500">
                        Periodo {String(mes).padStart(2, '0')}/{anio}
                    </p>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cerrar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
