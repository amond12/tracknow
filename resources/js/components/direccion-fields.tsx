import { CheckCircle2, LoaderCircle, TriangleAlert } from 'lucide-react';
import {
    startTransition,
    useDeferredValue,
    useEffect,
    useRef,
    useState,
} from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    hasMapboxToken,
    isReliableMapboxAddressMatch,
    searchAddressSuggestions,
} from '@/lib/mapbox';
import type {
    MapboxAddressResult,
    MapboxAddressSuggestion,
    WorkCenterAddressInput,
} from '@/lib/mapbox';
import { cn } from '@/lib/utils';

type AddressField = keyof WorkCenterAddressInput;

type AddressErrors = Partial<Record<AddressField, string>>;

type FeedbackTone = 'success' | 'warning' | 'error';
type LookupState = 'idle' | 'ready' | 'empty' | 'error';

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
    const mapboxAvailable = hasMapboxToken();
    const [suggestions, setSuggestions] = useState<MapboxAddressSuggestion[]>(
        [],
    );
    const [suggestionsOpen, setSuggestionsOpen] = useState(false);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [lookupState, setLookupState] = useState<LookupState>('idle');
    const [manualEntryEnabled, setManualEntryEnabled] = useState(
        !mapboxAvailable,
    );
    const [direccionFocused, setDireccionFocused] = useState(false);
    const [feedback, setFeedback] = useState<{
        tone: FeedbackTone;
        text: string;
    } | null>(null);
    const selectionInProgressRef = useRef(false);
    const hideSuggestionsTimeoutRef = useRef<number | null>(null);
    const deferredQuery = useDeferredValue(buildAutocompleteQuery(values));
    const hasDerivedFieldErrors = Boolean(
        errors.pais || errors.provincia || errors.poblacion || errors.cp,
    );

    useEffect(() => {
        if (!mapboxAvailable || hasDerivedFieldErrors) {
            setManualEntryEnabled(true);
        }
    }, [hasDerivedFieldErrors, mapboxAvailable]);

    useEffect(() => {
        return () => {
            if (hideSuggestionsTimeoutRef.current !== null) {
                window.clearTimeout(hideSuggestionsTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!mapboxAvailable) {
            setSuggestions([]);
            setSuggestionsOpen(false);
            setLookupState('idle');
            setLoadingSuggestions(false);
            return;
        }

        if (selectionInProgressRef.current) {
            selectionInProgressRef.current = false;
            setLookupState('idle');
            return;
        }

        if (!direccionFocused) {
            setSuggestionsOpen(false);
            setLoadingSuggestions(false);
            return;
        }

        if (values.direccion.trim().length < 3) {
            setSuggestions([]);
            setSuggestionsOpen(false);
            setLookupState('idle');
            setLoadingSuggestions(false);
            return;
        }

        const controller = new AbortController();
        const timeoutId = window.setTimeout(async () => {
            setLoadingSuggestions(true);
            setLookupState('idle');

            try {
                const nextSuggestions = await searchAddressSuggestions(
                    deferredQuery,
                    controller.signal,
                );
                setSuggestions(nextSuggestions);
                setSuggestionsOpen(
                    direccionFocused && nextSuggestions.length > 0,
                );
                setLookupState(
                    nextSuggestions.length > 0 ? 'ready' : 'empty',
                );
            } catch (error) {
                if ((error as Error).name !== 'AbortError') {
                    setSuggestions([]);
                    setSuggestionsOpen(false);
                    setLookupState('error');
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
    }, [deferredQuery, direccionFocused, mapboxAvailable, values.direccion]);

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
        nextFeedback: { tone: FeedbackTone; text: string },
    ) {
        selectionInProgressRef.current = true;

        startTransition(() => {
            onAddressResolved(result);
            setSuggestions([]);
            setSuggestionsOpen(false);
            setLookupState('ready');
            setManualEntryEnabled(false);
            setFeedback(nextFeedback);
        });
    }

    function handleFieldChange(field: AddressField, value: string) {
        onFieldChange(field, value);
        markAddressAsDirty({ ...values, [field]: value });

        if (field === 'direccion') {
            if (value.trim().length < 3) {
                setSuggestions([]);
                setSuggestionsOpen(false);
                setLookupState('idle');
                return;
            }

            setSuggestionsOpen(
                direccionFocused &&
                    value.trim().length >= 3 &&
                    suggestions.length > 0,
            );
        }
    }

    function handleSuggestionSelect(suggestion: MapboxAddressSuggestion) {
        const reliableMatch = isReliableMapboxAddressMatch(suggestion.result);

        applyResolvedAddress(
            suggestion.result,
            reliableMatch
                ? {
                      tone: 'success',
                      text: 'Direccion autocompletada con Mapbox.',
                  }
                : {
                      tone: 'warning',
                      text: 'Direccion autocompletada. Revisa los datos antes de guardar.',
                  },
        );
    }

    function handleDireccionFocus() {
        if (hideSuggestionsTimeoutRef.current !== null) {
            window.clearTimeout(hideSuggestionsTimeoutRef.current);
        }

        setDireccionFocused(true);

        if (suggestions.length > 0) {
            setSuggestionsOpen(true);
        }
    }

    function handleDireccionBlur() {
        if (hideSuggestionsTimeoutRef.current !== null) {
            window.clearTimeout(hideSuggestionsTimeoutRef.current);
        }

        hideSuggestionsTimeoutRef.current = window.setTimeout(() => {
            setDireccionFocused(false);
            setSuggestionsOpen(false);
        }, 150);
    }

    const infoText = manualEntryEnabled
        ? 'Escribe la direccion y completa manualmente pais, provincia, poblacion y codigo postal si Mapbox no puede rellenarlos.'
        : 'Escribe la direccion y selecciona una sugerencia de Mapbox. Pais, provincia, poblacion y codigo postal se rellenan automaticamente.';

    const fallbackMessage = !mapboxAvailable
        ? 'Mapbox no esta disponible ahora mismo. Completa manualmente los datos postales obligatorios.'
        : lookupState === 'error'
          ? 'No se ha podido consultar Mapbox. Puedes completar los datos manualmente.'
          : hasDerivedFieldErrors
            ? 'Faltan datos postales obligatorios. Selecciona una sugerencia valida o completa los campos manualmente.'
            : lookupState === 'empty' && values.direccion.trim().length >= 3
              ? 'No hemos encontrado una coincidencia completa para esa direccion. Sigue escribiendo o completa el resto manualmente.'
              : null;

    const derivedInputClassName = cn(
        !manualEntryEnabled && 'bg-muted/40 text-muted-foreground',
    );

    return (
        <div className="grid gap-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                {infoText}
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
                        onFocus={handleDireccionFocus}
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

            {fallbackMessage && (
                <div className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 sm:flex-row sm:items-center sm:justify-between">
                    <span>{fallbackMessage}</span>
                    {!manualEntryEnabled && mapboxAvailable && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setManualEntryEnabled(true)}
                            className="border-amber-300 bg-white text-amber-900 hover:bg-amber-100"
                        >
                            Completar manualmente
                        </Button>
                    )}
                </div>
            )}

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
                        onChange={(e) =>
                            handleFieldChange('pais', e.target.value)
                        }
                        placeholder={
                            manualEntryEnabled
                                ? 'Ej: Espana'
                                : 'Se rellena automaticamente'
                        }
                        readOnly={!manualEntryEnabled}
                        aria-readonly={!manualEntryEnabled}
                        className={derivedInputClassName}
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
                        onChange={(e) =>
                            handleFieldChange('provincia', e.target.value)
                        }
                        placeholder={
                            manualEntryEnabled
                                ? 'Ej: Madrid'
                                : 'Se rellena automaticamente'
                        }
                        readOnly={!manualEntryEnabled}
                        aria-readonly={!manualEntryEnabled}
                        className={derivedInputClassName}
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
                        onChange={(e) =>
                            handleFieldChange('poblacion', e.target.value)
                        }
                        placeholder={
                            manualEntryEnabled
                                ? 'Ej: Madrid'
                                : 'Se rellena automaticamente'
                        }
                        readOnly={!manualEntryEnabled}
                        aria-readonly={!manualEntryEnabled}
                        className={derivedInputClassName}
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
                        onChange={(e) => handleFieldChange('cp', e.target.value)}
                        placeholder={
                            manualEntryEnabled
                                ? 'Ej: 28013'
                                : 'Se rellena automaticamente'
                        }
                        inputMode="numeric"
                        readOnly={!manualEntryEnabled}
                        aria-readonly={!manualEntryEnabled}
                        className={derivedInputClassName}
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
