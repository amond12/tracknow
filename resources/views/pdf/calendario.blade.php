<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Calendario Laboral — {{ $empleado->name }} {{ $empleado->apellido }} — {{ $anio }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 8.5pt; color: #1a1a1a; background: #fff; }

        @page { margin: 12mm 13mm 16mm 13mm; size: A4 landscape; }

        .watermark {
            position: fixed;
            left: -38px;
            top: 50%;
            transform: rotate(-90deg) translateX(-50%);
            font-size: 6pt;
            color: #bbb;
            letter-spacing: 0.5px;
            white-space: nowrap;
        }

        .info-box {
            background: #f5f5f5;
            border: 1px solid #e0e0e0;
            border-radius: 3px;
            padding: 5px 10px;
            margin-bottom: 8px;
            width: 100%;
        }
        .info-label { font-weight: bold; font-size: 8pt; color: #1a1a1a; padding-right: 4px; }
        .info-value { font-size: 8pt; color: #333; }

        .footer {
            margin-top: 8px;
            font-size: 6pt;
            color: #888;
            text-align: center;
            border-top: 1px solid #e0e0e0;
            padding-top: 4px;
            line-height: 1.5;
        }
    </style>
</head>
<body>

<div class="watermark">Calendario Laboral {{ $anio }} — {{ config('app.name', 'nubelist') }}</div>

{{-- ═══════════════ CABECERA ═══════════════ --}}
<table style="width:100%; border-collapse:collapse; margin-bottom:10px;">
    <tr>
        <td style="width:55%; vertical-align:middle;">
            <svg style="vertical-align:middle; margin-right:6px;" width="26" height="20" viewBox="0 0 50 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M38.5 14.5C38.17 8.7 33.38 4 27.5 4C23.04 4 19.16 6.6 17.3 10.38C16.42 10.14 15.48 10 14.5 10C9.25 10 5 14.25 5 19.5C5 24.75 9.25 29 14.5 29H38.5C42.64 29 46 25.64 46 21.5C46 17.56 42.94 14.34 39.02 14.03L38.5 14.5Z" fill="#3DBFA8"/>
            </svg>
            <span style="font-size:14pt; font-weight:bold; color:#1a1a1a; vertical-align:middle;">{{ config('app.name', 'nubelist') }}</span>
        </td>
        <td style="width:45%; vertical-align:middle; text-align:right;">
            <div style="font-size:13pt; font-weight:bold; color:#1a1a1a; line-height:1.2;">Calendario Laboral</div>
            <div style="font-size:10pt; color:#444;">{{ $anio }}</div>
        </td>
    </tr>
</table>

{{-- ═══════════════ INFO BOX ═══════════════ --}}
<div class="info-box">
    <table style="width:100%; border-collapse:collapse;">
        <tr>
            <td style="width:50%; padding:1px 0; vertical-align:top;">
                <span class="info-label">Empleado/a:</span>
                <span class="info-value">{{ $empleado->name }} {{ $empleado->apellido }}</span>
            </td>
            <td style="width:50%; padding:1px 0; vertical-align:top;">
                @if($empresa)
                    <span class="info-label">Empresa:</span>
                    <span class="info-value">{{ $empresa->nombre }}</span>
                @endif
            </td>
        </tr>
        @if($empleado->dni)
        <tr>
            <td style="padding:1px 0; vertical-align:top;">
                <span class="info-label">DNI / NIE:</span>
                <span class="info-value">{{ $empleado->dni }}</span>
            </td>
            <td style="padding:1px 0; vertical-align:top;">
                <span class="info-label">Período:</span>
                <span class="info-value">{{ $anio }}</span>
            </td>
        </tr>
        @endif
    </table>
</div>

{{-- ═══════════════ GRID 12 MESES (4×3) ═══════════════ --}}
@php
    $diasSemana = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    $chunks = array_chunk($meses, 4);

    // Colores por tipo (para uso en @php dentro del loop)
    $colores = [
        'vacacion' => ['bg' => '#dbeafe', 'color' => '#1e40af', 'border' => ''],
        'ausencia' => ['bg' => '#fef9c3', 'color' => '#854d0e', 'border' => ''],
        'festivo'  => ['bg' => '#fce7f3', 'color' => '#9d174d', 'border' => ''],
        'fichaje'  => ['bg' => '#d1fae5', 'color' => '#065f46', 'border' => ''],
        'mixto'    => ['bg' => '#dbeafe', 'color' => '#1e40af', 'border' => 'border-right:2px solid #16a34a;'],
    ];
@endphp

@foreach($chunks as $fila)
<table style="width:100%; border-collapse:collapse; margin-bottom:4px;">
    <tr>
        @foreach($fila as $mes)
        <td style="width:25%; vertical-align:top; padding:3px;">
            {{-- Caja del mes --}}
            <table style="width:100%; border-collapse:collapse; border:1px solid #e5e7eb;">
                {{-- Nombre del mes --}}
                <tr>
                    <td colspan="7" style="text-align:center; font-size:7.5pt; font-weight:bold; text-transform:uppercase; letter-spacing:0.5px; color:#374151; padding:3px 2px; background:#f9fafb; border-bottom:1px solid #e5e7eb;">
                        {{ $mes['nombre'] }}
                    </td>
                </tr>
                {{-- Cabecera días semana --}}
                <tr>
                    @foreach($diasSemana as $ds)
                    <td style="width:14.28%; text-align:center; font-size:6pt; font-weight:bold; color:#9ca3af; padding:1px 0; border-bottom:1px solid #f3f4f6;">{{ $ds }}</td>
                    @endforeach
                </tr>
                {{-- Días --}}
                @php
                    $cells = array_fill(0, $mes['offset'], null);
                    foreach ($mes['dias'] as $dia) { $cells[] = $dia; }
                    while (count($cells) % 7 !== 0) { $cells[] = null; }
                    $rows = array_chunk($cells, 7);
                @endphp
                @foreach($rows as $row)
                <tr>
                    @foreach($row as $cell)
                    @if($cell !== null)
                        @php
                            if ($cell['tipo'] === null) {
                                $bg = '#fff'; $col = '#374151'; $bdr = '';
                            } elseif ($cell['tipo'] === 'vacacion' && $cell['con_evento']) {
                                $bg = '#dbeafe'; $col = '#1e40af'; $bdr = 'border-right:2px solid #16a34a;';
                            } elseif (isset($colores[$cell['tipo']])) {
                                $bg = $colores[$cell['tipo']]['bg'];
                                $col = $colores[$cell['tipo']]['color'];
                                $bdr = $colores[$cell['tipo']]['border'];
                            } else {
                                $bg = '#fff'; $col = '#374151'; $bdr = '';
                            }
                        @endphp
                        <td style="width:14.28%; text-align:center; font-size:6.5pt; padding:1px 0; background:{{ $bg }}; color:{{ $col }}; {{ $bdr }}">{{ $cell['dia'] }}</td>
                    @else
                        <td style="width:14.28%; background:#fff;"></td>
                    @endif
                    @endforeach
                </tr>
                @endforeach
            </table>
        </td>
        @endforeach
        {{-- Rellenar columnas vacías --}}
        @for($i = count($fila); $i < 4; $i++)
        <td style="width:25%; padding:3px;"></td>
        @endfor
    </tr>
</table>
@endforeach

{{-- ═══════════════ LEYENDA + TOTALES ═══════════════ --}}
<table style="width:100%; border-collapse:collapse; margin-top:6px;">
    <tr>
        {{-- Leyenda --}}
        <td style="width:58%; vertical-align:middle;">
            <table style="border-collapse:collapse;">
                <tr>
                    <td style="padding-right:8px; white-space:nowrap;">
                        <table style="border-collapse:collapse; display:inline-table;">
                            <tr>
                                <td style="width:12px; height:10px; background:#d1fae5; border:1px solid #6ee7b7; border-radius:2px; font-size:1pt;">&nbsp;</td>
                                <td style="font-size:7pt; color:#374151; padding-left:3px;">Trabajado</td>
                                <td style="width:12px; height:10px; background:#dbeafe; border:1px solid #93c5fd; border-radius:2px; font-size:1pt; padding-left:8px;">&nbsp;</td>
                                <td style="font-size:7pt; color:#374151; padding-left:3px;">Vacación</td>
                                <td style="width:12px; height:10px; background:#fef9c3; border:1px solid #fde047; border-radius:2px; font-size:1pt; padding-left:8px;">&nbsp;</td>
                                <td style="font-size:7pt; color:#374151; padding-left:3px;">Ausencia</td>
                                <td style="width:12px; height:10px; background:#fce7f3; border:1px solid #f9a8d4; border-radius:2px; font-size:1pt; padding-left:8px;">&nbsp;</td>
                                <td style="font-size:7pt; color:#374151; padding-left:3px;">Festivo</td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </td>
        {{-- Totales --}}
        <td style="width:42%; vertical-align:middle; text-align:right;">
            <table style="border-collapse:collapse; float:right;">
                <tr>
                    <td style="font-size:7pt; font-weight:bold; background:#d1fae5; padding:1px 5px; border-radius:2px;">Trabajados</td>
                    <td style="font-size:7pt; padding:1px 6px; text-align:right;">{{ $totalFic }}</td>
                    <td style="font-size:7pt; font-weight:bold; background:#dbeafe; padding:1px 5px; border-radius:2px;">Vacaciones</td>
                    <td style="font-size:7pt; padding:1px 6px; text-align:right;">{{ $totalVac }}</td>
                    <td style="font-size:7pt; font-weight:bold; background:#fef9c3; padding:1px 5px; border-radius:2px;">Ausencias</td>
                    <td style="font-size:7pt; padding:1px 6px; text-align:right;">{{ $totalAus }}</td>
                    <td style="font-size:7pt; font-weight:bold; background:#fce7f3; padding:1px 5px; border-radius:2px;">Festivos</td>
                    <td style="font-size:7pt; padding:1px 6px; text-align:right;">{{ $totalFes }}</td>
                </tr>
            </table>
        </td>
    </tr>
</table>

{{-- ═══════════════ PIE ═══════════════ --}}
<div class="footer">
    Documento generado el {{ $generadoEn }}
    &nbsp;&bull;&nbsp;
    Calendario laboral anual conforme al Real Decreto-ley 8/2019, de 8 de marzo
</div>

</body>
</html>
