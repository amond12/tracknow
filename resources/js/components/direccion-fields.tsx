import { CheckCircle2, LoaderCircle, TriangleAlert } from 'lucide-react';
import {
    startTransition,
    useDeferredValue,
    useEffect,
    useRef,
    useState,
} from 'react';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { hasMapboxToken, searchAddressSuggestions } from '@/lib/mapbox';
import type {
    MapboxAddressResult,
    MapboxAddressSuggestion,
    WorkCenterAddressInput,
} from '@/lib/mapbox';
import { cn } from '@/lib/utils';

type AddressField = keyof WorkCenterAddressInput;

type AddressErrors = Partial<Record<AddressField, string>>;

type FeedbackTone = 'success' | 'warning' | 'error';

interface Props {
    values: WorkCenterAddressInput;
    errors: AddressErrors;
    onFieldChange: (field: AddressField, value: string) => void;
    onAddressResolved: (result: MapboxAddressResult) => void;
}

const addressInputProps = {
    autoComplete: 'new-password',
    autoCorrect: 'off',
    autoCapitalize: 'none' as const,
    spellCheck: false,
};

function buildAutocompleteQuery(values: WorkCenterAddressInput): string {
    return [
        values.direccion,
        values.cp,
        values.poblacion,
        values.provincia,
        values.pais || 'Espana',
    ]
        .map((value) => value.trim())
        .filter(Boolean)
        .join(', ');
}

function FeedbackMessage({ tone, text }: { tone: FeedbackTone; text: string }) {
    return (
        <div
            className={cn(
                'flex items-start gap-2 rounded-lg border px-3 py-2 text-xs',
                tone === 'success' &&
                    'border-emerald-200 bg-emerald-50 text-emerald-800',
                tone === 'warning' &&
                    'border-amber-200 bg-amber-50 text-amber-800',
                tone === 'error' && 'border-red-200 bg-red-50 text-red-700',
            )}
        >
            {tone === 'success' ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span>{text}</span>
        </div>
    );
}

export function DireccionFields({
    values,
    errors,
    onFieldChange,
    onAddressResolved,
}: Props) {
    const [suggestions, setSuggestions] = useState<MapboxAddressSuggestion[]>(
        [],
    );
    const [suggestionsOpen, setSuggestionsOpen] = useState(false);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [feedback, setFeedback] = useState<{
        tone: FeedbackTone;
        text: string;
    } | null>(null);
    const selectionInProgressRef = useRef(false);
    const hideSuggestionsTimeoutRef = useRef<number | null>(null);
    const deferredQuery = useDeferredValue(buildAutocompleteQuery(values));

    useEffect(() => {
        return () => {
            if (hideSuggestionsTimeoutRef.current !== null) {
                window.clearTimeout(hideSuggestionsTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!hasMapboxToken()) {
            setSuggestions([]);
            setSuggestionsOpen(false);
            return;
        }

        if (selectionInProgressRef.current) {
            selectionInProgressRef.current = false;
            return;
        }

        if (values.direccion.trim().length < 3) {
            setSuggestions([]);
            setSuggestionsOpen(false);
            setLoadingSuggestions(false);
            return;
        }

        const controller = new AbortController();
        const timeoutId = window.setTimeout(async () => {
            setLoadingSuggestions(true);

            try {
                const nextSuggestions = await searchAddressSuggestions(
                    deferredQuery,
                    controller.signal,
                );
                setSuggestions(nextSuggestions);
                setSuggestionsOpen(nextSuggestions.length > 0);
            } catch (error) {
                if ((error as Error).name !== 'AbortError') {
                    setSuggestions([]);
                    setSuggestionsOpen(false);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoadingSuggestions(false);
                }
            }
        }, 250);

        return () => {
            controller.abort();
            window.clearTimeout(timeoutId);
        };
    }, [deferredQuery, values.direccion]);

    function markAddressAsDirty(nextValues: WorkCenterAddressInput) {
        const hasValue = Object.values(nextValues).some(
            (value) => value.trim().length > 0,
        );
        if (hasValue) {
            setFeedback(null);
        }
    }

    function applyResolvedAddress(
        result: MapboxAddressResult,
        successText: string,
    ) {
        selectionInProgressRef.current = true;

        startTransition(() => {
            onAddressResolved(result);
            setSuggestions([]);
            setSuggestionsOpen(false);
            setFeedback({
                tone: 'success',
                text: successText,
            });
        });
    }

    function handleFieldChange(field: AddressField, value: string) {
        onFieldChange(field, value);
        markAddressAsDirty({ ...values, [field]: value });

        if (field === 'direccion') {
            setSuggestionsOpen(
                value.trim().length >= 3 && suggestions.length > 0,
            );
        }
    }

    function handleSuggestionSelect(suggestion: MapboxAddressSuggestion) {
        applyResolvedAddress(
            suggestion.result,
            'Direccion autocompletada y validada con Mapbox.',
        );
    }

    function handleDireccionBlur() {
        if (hideSuggestionsTimeoutRef.current !== null) {
            window.clearTimeout(hideSuggestionsTimeoutRef.current);
        }

        hideSuggestionsTimeoutRef.current = window.setTimeout(() => {
            setSuggestionsOpen(false);
        }, 150);
    }

    return (
        <div className="grid gap-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                Escribe la direccion primero y selecciona una sugerencia de
                Mapbox. Pais, provincia, poblacion y codigo postal se rellenan
                automaticamente.
            </div>

            <div className="grid gap-1.5">
                <Label
                    htmlFor="direccion"
                    className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase"
                >
                    Direccion
                </Label>

                <div className="relative">
                    <Input
                        id="direccion"
                        value={values.direccion}
                        onChange={(e) =>
                            handleFieldChange('direccion', e.target.value)
                        }
                        onFocus={() =>
                            setSuggestionsOpen(suggestions.length > 0)
                        }
                        onBlur={handleDireccionBlur}
                        placeholder="Calle Gran Via 28"
                        required
                        {...addressInputProps}
                    />

                    {(loadingSuggestions || suggestionsOpen) && (
                        <div className="absolute top-[calc(100%+0.5rem)] right-0 left-0 z-50 overflow-hidden rounded-lg border bg-background shadow-lg">
                            {loadingSuggestions ? (
                                <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                                    <LoaderCircle className="h-4 w-4 animate-spin" />
                                    Buscando direcciones en Mapbox...
                                </div>
                            ) : suggestions.length > 0 ? (
                                <div className="py-1">
                                    {suggestions.map((suggestion) => (
                                        <button
                                            key={suggestion.id}
                                            type="button"
                                            className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left transition-colors hover:bg-muted"
                                            onMouseDown={(event) => {
                                                event.preventDefault();
                                                handleSuggestionSelect(
                                                    suggestion,
                                                );
                                            }}
                                        >
                                            <span className="text-sm font-medium text-foreground">
                                                {suggestion.title}
                                            </span>
                                            {suggestion.subtitle && (
                                                <span className="text-xs text-muted-foreground">
                                                    {suggestion.subtitle}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="px-3 py-2 text-sm text-muted-foreground">
                                    No hay sugerencias para esa direccion.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <InputError message={errors.direccion} />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                    <Label
                        htmlFor="pais"
                        className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase"
                    >
                        Pais
                    </Label>
                    <Input
                        id="pais"
                        value={values.pais}
                        placeholder="Se rellena automaticamente"
                        readOnly
                        aria-readonly="true"
                        className="bg-muted/40 text-muted-foreground"
                        {...addressInputProps}
                    />
                    <InputError message={errors.pais} />
                </div>
                <div className="grid gap-1.5">
                    <Label
                        htmlFor="provincia"
                        className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase"
                    >
                        Provincia
                    </Label>
                    <Input
                        id="provincia"
                        value={values.provincia}
                        placeholder="Se rellena automaticamente"
                        readOnly
                        aria-readonly="true"
                        className="bg-muted/40 text-muted-foreground"
                        {...addressInputProps}
                    />
                    <InputError message={errors.provincia} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                    <Label
                        htmlFor="poblacion"
                        className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase"
                    >
                        Poblacion
                    </Label>
                    <Input
                        id="poblacion"
                        value={values.poblacion}
                        placeholder="Se rellena automaticamente"
                        readOnly
                        aria-readonly="true"
                        className="bg-muted/40 text-muted-foreground"
                        {...addressInputProps}
                    />
                    <InputError message={errors.poblacion} />
                </div>
                <div className="grid gap-1.5">
                    <Label
                        htmlFor="cp"
                        className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase"
                    >
                        Codigo postal
                    </Label>
                    <Input
                        id="cp"
                        value={values.cp}
                        placeholder="Se rellena automaticamente"
                        inputMode="numeric"
                        readOnly
                        aria-readonly="true"
                        className="bg-muted/40 text-muted-foreground"
                        {...addressInputProps}
                    />
                    <InputError message={errors.cp} />
                </div>
            </div>

            {feedback && (
                <FeedbackMessage tone={feedback.tone} text={feedback.text} />
            )}
        </div>
    );
}
