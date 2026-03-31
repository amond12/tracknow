<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Registro de Jornada — {{ $empleado->name }} {{ $empleado->apellido }} — {{ $mesNombre }} {{ $anio }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 9pt; color: #1a1a1a; background: #fff; }

        @page { margin: 14mm 13mm 18mm 13mm; }

        /* ── MARCA DE AGUA LATERAL ─────────────────────────────── */
        .watermark {
            position: fixed;
            left: -38px;
            top: 50%;
            transform: rotate(-90deg) translateX(-50%);
            font-size: 6.5pt;
            color: #bbb;
            letter-spacing: 0.5px;
            white-space: nowrap;
        }

        /* ── CABECERA PRINCIPAL ────────────────────────────────── */
        .top-header { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
        .top-header .logo-cell { vertical-align: middle; }
        .top-header .title-cell { vertical-align: middle; text-align: right; }

        .logo-wrap { display: inline-block; }
        .logo-icon  { vertical-align: middle; margin-right: 6px; }
        .logo-text  { font-size: 15pt; font-weight: bold; color: #1a1a1a; vertical-align: middle; }

        .doc-title  { font-size: 14pt; font-weight: bold; color: #1a1a1a; line-height: 1.15; }
        .doc-period { font-size: 11pt; color: #444; }

        /* ── CAJAS DE INFORMACIÓN ──────────────────────────────── */
        .info-box {
            background: #f5f5f5;
            border: 1px solid #e0e0e0;
            border-radius: 3px;
            padding: 7px 10px;
            margin-bottom: 7px;
            width: 100%;
        }
        .info-table { width: 100%; border-collapse: collapse; }
        .info-row td { padding: 1.5px 0; font-size: 8.5pt; vertical-align: top; }
        .info-label { font-weight: bold; color: #1a1a1a; white-space: nowrap; padding-right: 4px; }
        .info-value { color: #333; }
        .info-sep   { width: 24px; }

        /* ── TÍTULO CENTRAL ────────────────────────────────────── */
        .titulo {
            text-align: center;
            font-size: 8pt;
            font-weight: bold;
            letter-spacing: 1.8px;
            text-transform: uppercase;
            color: #444;
            margin: 10px 0 8px;
            border-top: 1px solid #ddd;
            border-bottom: 1px solid #ddd;
            padding: 5px 0;
        }

        /* ── TABLA PRINCIPAL ───────────────────────────────────── */
        .data-table { width: 100%; border-collapse: collapse; margin-top: 6px; }

        .data-table th {
            background-color: #e8e8e8;
            color: #1a1a1a;
            font-size: 7.5pt;
            font-weight: bold;
            padding: 5px 4px;
            text-align: center;
            border: 1px solid #c8c8c8;
        }

        .data-table td {
            font-size: 8pt;
            padding: 3.5px 4px;
            border: 1px solid #ddd;
            text-align: center;
            vertical-align: middle;
            color: #222;
        }

        .data-table tbody tr:nth-child(even) td { background-color: #fafafa; }
        .data-table tbody tr:nth-child(odd)  td { background-color: #ffffff; }

        .td-left { text-align: left; padding-left: 6px !important; }
        .td-bold { font-weight: bold; }

        /* Fila total */
        .row-total td {
            background-color: #2a2a2a !important;
            color: #ffffff;
            font-weight: bold;
            font-size: 8.5pt;
            border: 1px solid #2a2a2a;
        }

        /* Sin registros */
        .empty-row td {
            text-align: center;
            color: #888;
            padding: 18px 4px;
            font-style: italic;
        }

        /* ── FIRMAS ────────────────────────────────────────────── */
        .firma-section { margin-top: 24px; }
        .firma-table { width: 100%; border-collapse: collapse; }
        .firma-cell { width: 50%; vertical-align: top; padding: 0 8px; }
        .firma-cell:first-child { padding-left: 0; }
        .firma-cell:last-child  { padding-right: 0; }

        .firma-box {
            border: 1px solid #ccc;
            border-radius: 3px;
            padding: 8px 10px 10px;
            min-height: 70px;
        }
        .firma-label { font-size: 7.5pt; font-weight: bold; text-transform: uppercase; color: #333; letter-spacing: 0.4px; margin-bottom: 22px; }
        .firma-line  { border: none; border-bottom: 1px solid #aaa; margin-bottom: 5px; }
        .firma-name  { font-size: 8pt; font-weight: bold; color: #1a1a1a; }
        .firma-sub   { font-size: 7.5pt; color: #666; margin-top: 2px; }

        /* ── PIE ───────────────────────────────────────────────── */
        .footer {
            margin-top: 14px;
            font-size: 6.5pt;
            color: #888;
            text-align: center;
            border-top: 1px solid #e0e0e0;
            padding-top: 5px;
            line-height: 1.5;
        }
    </style>
</head>
<body>

{{-- MARCA DE AGUA LATERAL --}}
<div class="watermark">Documento generado conforme al RDL 8/2019 — Registro de Jornada</div>

{{-- ═══════════════════════════════════════════════════════════════
     CABECERA — Logo + Título
═══════════════════════════════════════════════════════════════ --}}
<table class="top-header">
    <tr>
        <td class="logo-cell" style="width:55%">
            {{-- Logo SVG (nube + texto) --}}
            <svg class="logo-icon" width="30" height="22" viewBox="0 0 50 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M38.5 14.5C38.17 8.7 33.38 4 27.5 4C23.04 4 19.16 6.6 17.3 10.38C16.42 10.14 15.48 10 14.5 10C9.25 10 5 14.25 5 19.5C5 24.75 9.25 29 14.5 29H38.5C42.64 29 46 25.64 46 21.5C46 17.56 42.94 14.34 39.02 14.03L38.5 14.5Z" fill="#3DBFA8"/>
            </svg>
            <span class="logo-text">{{ config('app.name', 'Horario Digital') }}</span>
        </td>
        <td class="title-cell" style="width:45%">
            <div class="doc-title">Registro Jornada</div>
            <div class="doc-period">{{ $mesNombre }} {{ $anio }}</div>
        </td>
    </tr>
</table>

{{-- ═══════════════════════════════════════════════════════════════
     CAJA — Empresa
═══════════════════════════════════════════════════════════════ --}}
<div class="info-box">
    <table class="info-table">
        <tr class="info-row">
            <td style="width:50%">
                <span class="info-label">Empresa:</span>
                <span class="info-value">{{ $empresa->nombre }}</span>
            </td>
            <td style="width:50%">
                <span class="info-label">Centro de trabajo:</span>
                <span class="info-value">{{ $centro->nombre }}</span>
            </td>
        </tr>
        <tr class="info-row">
            <td>
                <span class="info-label">CIF:</span>
                <span class="info-value">{{ $empresa->cif }}</span>
            </td>
            <td>
                <span class="info-label">Dirección:</span>
                <span class="info-value">{{ $empresa->direccion }}, {{ $empresa->ciudad }}@if($empresa->cp) ({{ $empresa->cp }})@endif</span>
            </td>
        </tr>
    </table>
</div>

{{-- ═══════════════════════════════════════════════════════════════
     CAJA — Trabajador
═══════════════════════════════════════════════════════════════ --}}
<div class="info-box">
    <table class="info-table">
        <tr class="info-row">
            <td style="width:50%">
                <span class="info-label">Empleado/a:</span>
                <span class="info-value">{{ $empleado->name }} {{ $empleado->apellido }}</span>
            </td>
            <td style="width:50%">
                <span class="info-label">DNI / NIE:</span>
                <span class="info-value">{{ $empleado->dni }}</span>
            </td>
        </tr>
        @if(!$esAdmin && $empleado->nss)
        <tr class="info-row">
            <td>
                <span class="info-label">NSS:</span>
                <span class="info-value">{{ $empleado->nss }}</span>
            </td>
            <td>
                <span class="info-label">Período:</span>
                <span class="info-value">{{ $mesNombre }} {{ $anio }}</span>
            </td>
        </tr>
        @else
        <tr class="info-row">
            <td colspan="2">
                <span class="info-label">Período:</span>
                <span class="info-value">{{ $mesNombre }} {{ $anio }}</span>
            </td>
        </tr>
        @endif
    </table>
</div>

{{-- ═══════════════════════════════════════════════════════════════
     TÍTULO SECCIÓN
═══════════════════════════════════════════════════════════════ --}}
<div class="titulo">Registro de Jornada &mdash; RDL 8/2019</div>

{{-- ═══════════════════════════════════════════════════════════════
     TABLA DE JORNADAS
═══════════════════════════════════════════════════════════════ --}}
<table class="data-table">
    <thead>
        <tr>
            <th style="width:13%">Fecha</th>
            <th style="width:11%">Entrada</th>
            <th style="width:11%">Salida</th>
            <th style="width:14%">Presencia</th>
            <th style="width:13%">Jornada</th>
            <th style="width:12%">Horas extra</th>
            <th style="width:26%">Observaciones</th>
        </tr>
    </thead>
    <tbody>
        @forelse($filas as $fila)
        <tr>
            <td class="td-bold">{{ $fila['fecha'] }}</td>
            <td class="td-bold">{{ $fila['entrada'] }}</td>
            <td class="td-bold">{{ $fila['salida'] }}</td>
            <td>{{ $fila['presencia'] }}</td>
            <td class="td-bold">{{ $fila['jornada'] }}</td>
            <td class="td-bold">{{ $fila['horas_extra'] }}</td>
            <td class="{{ $fila['observaciones'] === 'VACACIONES' ? 'td-bold' : '' }}"
                style="{{ $fila['observaciones'] === 'VACACIONES' ? 'color:#1a7a6a; letter-spacing:0.5px;' : '' }}">
                {{ $fila['observaciones'] }}
            </td>
        </tr>
        @empty
        <tr class="empty-row">
            <td colspan="7">Sin registros para este período</td>
        </tr>
        @endforelse

        @if(count($filas) > 0)
        <tr class="row-total">
            <td colspan="3" style="text-align:right; padding-right:8px;">TOTAL DEL MES</td>
            <td>{{ $totalHoras }}</td>
            <td></td>
            <td></td>
            <td></td>
        </tr>
        @endif
    </tbody>
</table>

{{-- ═══════════════════════════════════════════════════════════════
     FIRMAS
═══════════════════════════════════════════════════════════════ --}}
<div class="firma-section">
    <table class="firma-table">
        <tr>
            <td class="firma-cell">
                <div class="firma-box">
                    <div class="firma-label">Firma y/o cuño del representante de la empresa</div>
                    <hr class="firma-line">
                    <div class="firma-name">{{ $empresa->nombre }}</div>
                    <div class="firma-sub">Cargo: ____________________________</div>
                    <div class="firma-sub">Fecha: ___ / ___ / ______</div>
                </div>
            </td>
            <td class="firma-cell">
                <div class="firma-box">
                    <div class="firma-label">Firma de/la trabajador/a</div>
                    <hr class="firma-line">
                    <div class="firma-name">{{ $empleado->name }} {{ $empleado->apellido }}</div>
                    <div class="firma-sub">Fecha: ___ / ___ / ______</div>
                </div>
            </td>
        </tr>
    </table>
</div>

{{-- ═══════════════════════════════════════════════════════════════
     PIE DE PÁGINA
═══════════════════════════════════════════════════════════════ --}}
<div class="footer">
    Documento generado el {{ $generadoEn }}
    &nbsp;&bull;&nbsp;
    Registro mensual de la jornada de los trabajadores conforme al Real Decreto-ley 8/2019, de 8 de marzo, de medidas urgentes de protección social y de lucha contra la precariedad laboral en la jornada de trabajo
</div>

</body>
</html>
