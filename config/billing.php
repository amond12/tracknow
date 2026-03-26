<?php

return [
    'subscription_type' => 'default',

    'stripe' => [
        'key' => env('STRIPE_KEY'),
        'secret' => env('STRIPE_SECRET'),
        'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
    ],

    'portals' => [
        'main_configuration' => env('STRIPE_PORTAL_MAIN_CONFIGURATION_ID'),
        'change_configuration' => env('STRIPE_PORTAL_CHANGE_CONFIGURATION_ID'),
    ],

    'plans' => [
        'inicio' => [
            'name' => 'Inicio',
            'employee_limit' => 10,
            'prices' => [
                'monthly' => [
                    'amount' => 1500,
                    'stripe_price' => env('STRIPE_PRICE_INICIO_MONTHLY'),
                ],
                'yearly' => [
                    'amount' => 15000,
                    'stripe_price' => env('STRIPE_PRICE_INICIO_YEARLY'),
                ],
            ],
        ],
        'equipo' => [
            'name' => 'Equipo',
            'employee_limit' => 25,
            'prices' => [
                'monthly' => [
                    'amount' => 2900,
                    'stripe_price' => env('STRIPE_PRICE_EQUIPO_MONTHLY'),
                ],
                'yearly' => [
                    'amount' => 29000,
                    'stripe_price' => env('STRIPE_PRICE_EQUIPO_YEARLY'),
                ],
            ],
        ],
        'empresa' => [
            'name' => 'Empresa',
            'employee_limit' => 75,
            'prices' => [
                'monthly' => [
                    'amount' => 5900,
                    'stripe_price' => env('STRIPE_PRICE_EMPRESA_MONTHLY'),
                ],
                'yearly' => [
                    'amount' => 59000,
                    'stripe_price' => env('STRIPE_PRICE_EMPRESA_YEARLY'),
                ],
            ],
        ],
    ],
];
