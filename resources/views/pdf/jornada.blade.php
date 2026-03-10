<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Registro de Jornada — {{ $empleado->name }} {{ $empleado->apellido }} — {{ $mesNombre }} {{ $anio }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 9pt; color: #111; }

        @page { margin: 15mm 12mm 20mm 12mm; }

        /* Cabecera */
        .header-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
        .header-left  { width: 68%; vertical-align: top; padding-right: 12px; }
        .header-right { width: 32%; vertical-align: top; text-align: right; }

        .label { font-size: 7pt; color: #888; text-transform: uppercase; letter-spacing: 0.4px; }
        .value-lg { font-size: 12pt; font-weight: bold; }
        .value     { font-size: 9pt; font-weight: bold; }
        .subvalue  { font-size: 8pt; color: #444; }

        /* Separadores */
        .divider       { border: none; border-top: 1.5px solid #1e3a5f; margin: 7px 0; }
        .divider-light { border: none; border-top: 1px solid #ddd; margin: 6px 0; }

        /* Título central */
        .titulo {
            text-align: center;
            font-size: 8.5pt;
            font-weight: bold;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            color: #1e3a5f;
            margin: 7px 0;
        }

        /* Tabla principal */
        .data-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .data-table th {
            background-color: #1e3a5f;
            color: #ffffff;
            font-size: 7.5pt;
            font-weight: bold;
            padding: 5px 4px;
            text-align: center;
            border: 1px solid #1e3a5f;
        }
        .data-table td {
            font-size: 8pt;
            padding: 4px 4px;
            border: 1px solid #ddd;
            text-align: center;
            vertical-align: middle;
        }
        .data-table tbody tr:nth-child(even) td { background-color: #f4f6f9; }
        .data-table tbody tr:nth-child(odd)  td { background-color: #ffffff; }

        .td-left { text-align: left; }
        .td-bold { font-weight: bold; }

        /* Fila total */
        .row-total td {
            background-color: #1e3a5f !important;
            color: #ffffff;
            font-weight: bold;
            font-size: 8.5pt;
            border: 1px solid #1e3a5f;
        }

        /* Estados */
        .estado-finalizada { color: #166534; }
        .estado-activa     { color: #b45309; }
        .estado-pausa      { color: #9a3412; }

        /* Sin registros */
        .empty-row td {
            text-align: center;
            color: #888;
            padding: 16px 4px;
            font-style: italic;
        }

        /* Firmas */
        .firma-section { margin-top: 28px; }
        .firma-table { width: 100%; border-collapse: collapse; }
        .firma-cell  { width: 50%; vertical-align: top; padding: 0 10px; }
        .firma-cell:first-child { padding-left: 0; }
        .firma-cell:last-child  { padding-right: 0; }
        .firma-label { font-size: 7.5pt; font-weight: bold; text-transform: uppercase; color: #1e3a5f; letter-spacing: 0.5px; }
        .firma-line  { border: none; border-bottom: 1px solid #333; margin-top: 30px; margin-bottom: 5px; }
        .firma-name  { font-size: 8pt; font-weight: bold; }
        .firma-sub   { font-size: 7.5pt; color: #555; margin-top: 2px; }

        /* Pie */
        .footer {
            margin-top: 18px;
            font-size: 7pt;
            color: #aaa;
            text-align: center;
            border-top: 1px solid #eee;
            padding-top: 5px;
        }
    </style>
</head>
<body>

{{-- ═══════════════════════════════════════════════════════════════
     CABECERA — Empresa
═══════════════════════════════════════════════════════════════ --}}
<table class="header-table">
    <tr>
        <td class="header-left">
            <div class="label">Empresa</div>
            <div class="value-lg">{{ $empresa->nombre }}</div>
            <div class="subvalue">CIF: {{ $empresa->cif }}</div>
            <div class="subvalue">{{ $empresa->direccion }}, {{ $empresa->ciudad }}
                @if($empresa->cp) &nbsp;({{ $empresa->cp }})@endif
            </div>
        </td>
        <td class="header-right">
            <div class="label">Centro de trabajo</div>
            <div class="value">{{ $centro->nombre }}</div>
        </td>
    </tr>
</table>

<hr class="divider">

{{-- ═══════════════════════════════════════════════════════════════
     CABECERA — Trabajador
═══════════════════════════════════════════════════════════════ --}}
<table class="header-table">
    <tr>
        <td class="header-left">
            <div class="label">Trabajador/a</div>
            <div class="value">{{ $empleado->name }} {{ $empleado->apellido }}</div>
            <div class="subvalue">
                DNI/NIE: {{ $empleado->dni }}
                @if($empleado->nss)&nbsp;&nbsp;|&nbsp;&nbsp;NSS: {{ $empleado->nss }}@endif
            </div>
        </td>
        <td class="header-right">
            <div class="label">Período</div>
            <div class="value">{{ $mesNombre }} {{ $anio }}</div>
        </td>
    </tr>
</table>

<hr class="divider">

<div class="titulo">Registro de Jornada &mdash; RDL 8/2019</div>

{{-- ═══════════════════════════════════════════════════════════════
     TABLA DE JORNADAS
═══════════════════════════════════════════════════════════════ --}}
<table class="data-table">
    <thead>
        <tr>
            <th style="width:12%">Fecha</th>
            <th style="width:10%">Día</th>
            <th style="width:11%">Entrada</th>
            <th style="width:11%">Salida</th>
            <th style="width:14%">Pausas</th>
            <th style="width:18%">Horas trabajadas</th>
            <th style="width:24%">Estado</th>
        </tr>
    </thead>
    <tbody>
        @forelse($filas as $fila)
        <tr>
            <td class="td-bold">{{ $fila['fecha'] }}</td>
            <td>{{ $fila['dia_semana'] }}</td>
            <td class="td-bold">{{ $fila['entrada'] }}</td>
            <td class="td-bold">{{ $fila['salida'] }}</td>
            <td>{{ $fila['pausas'] }}</td>
            <td class="td-bold">{{ $fila['horas'] }}</td>
            <td class="estado-{{ $fila['estado_clase'] }}">{{ $fila['estado'] }}</td>
        </tr>
        @empty
        <tr class="empty-row">
            <td colspan="7">Sin registros para este período</td>
        </tr>
        @endforelse

        @if(count($filas) > 0)
        <tr class="row-total">
            <td colspan="5" style="text-align: right; padding-right: 8px;">TOTAL DEL MES</td>
            <td>{{ $totalHoras }}</td>
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
                <div class="firma-label">Firma del trabajador/a</div>
                <hr class="firma-line">
                <div class="firma-name">{{ $empleado->name }} {{ $empleado->apellido }}</div>
                <div class="firma-sub">Fecha: ___ / ___ / ______</div>
            </td>
            <td class="firma-cell" style="text-align: right;">
                <div class="firma-label">Firma empresa / responsable</div>
                <hr class="firma-line">
                <div class="firma-name">{{ $empresa->nombre }}</div>
                <div class="firma-sub">Cargo: ____________________________</div>
                <div class="firma-sub">Fecha: ___ / ___ / ______</div>
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
    Conforme al Real Decreto-ley 8/2019, de 8 de marzo, de medidas urgentes de protección social y de lucha contra la precariedad laboral
</div>

</body>
</html>
