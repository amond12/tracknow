<?php

namespace App\Http\Requests\Settings;

use App\Services\Billing\BillingCatalog;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PricingSelectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $catalog = app(BillingCatalog::class);

        return [
            'plan' => ['required', 'string', Rule::in($catalog->slugs())],
            'interval' => ['required', 'string', Rule::in($catalog->intervals())],
        ];
    }
}
