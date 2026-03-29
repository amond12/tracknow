<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, mixed>  $input
     */
    public function create(array $input): User
    {
        $acceptedAt = now();
        $input['dni'] = User::normalizeDni($input['dni'] ?? null);

        Validator::make($input, [
            ...$this->profileRules(),
            'password' => $this->passwordRules(),
            'legal_documents' => ['accepted'],
        ], [], [
            'legal_documents' => 'terminos y politica de privacidad',
        ])->validate();

        return User::create([
            'name' => $input['name'],
            'apellido' => $input['apellido'],
            'email' => $input['email'],
            'telefono' => $input['telefono'],
            'dni' => $input['dni'],
            'password' => $input['password'],
            'role' => 'admin',
            'terms_accepted_at' => $acceptedAt,
            'privacy_policy_accepted_at' => $acceptedAt,
        ]);
    }
}
