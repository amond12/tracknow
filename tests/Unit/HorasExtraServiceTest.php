<?php

use App\Models\Fichaje;
use App\Models\Pausa;
use App\Services\HorasExtraService;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Tests\TestCase;

uses(TestCase::class);

it('calcula los segundos trabajados en el dia para una jornada simple', function () {
    $fichaje = new Fichaje([
        'inicio_jornada' => '2026-03-11 16:57:39',
        'fin_jornada' => '2026-03-11 17:53:38',
    ]);
    $fichaje->setRelation('pausas', new Collection());

    $segundos = app(HorasExtraService::class)->calcularSegundosEnDia($fichaje, Carbon::parse('2026-03-11'));

    expect($segundos)->toBe(3359);
});

it('resta pausas correctamente dentro del dia', function () {
    $fichaje = new Fichaje([
        'inicio_jornada' => '2026-03-11 16:57:39',
        'fin_jornada' => '2026-03-11 17:53:38',
    ]);

    $pausa = new Pausa([
        'inicio_pausa' => '2026-03-11 17:10:00',
        'fin_pausa' => '2026-03-11 17:20:00',
    ]);

    $fichaje->setRelation('pausas', new Collection([$pausa]));

    $segundos = app(HorasExtraService::class)->calcularSegundosEnDia($fichaje, Carbon::parse('2026-03-11'));

    expect($segundos)->toBe(3359 - 600);
});
