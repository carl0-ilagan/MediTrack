<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\MailSetting;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;

class MailSettingController extends Controller
{
    use ApiResponses;

    public function index()
    {
        try {
            $settings = MailSetting::first();
            if (!$settings) {
                return $this->ok('Mail settings not configured', ['settings' => null]);
            }

            $password = null;
            if ($settings->encrypted_password) {
                try {
                    $password = decrypt($settings->encrypted_password);
                } catch (\Exception $e) {
                    $password = null;
                }
            }

            return $this->ok('Mail settings loaded', [
                'settings' => [
                    'email' => $settings->email,
                    'password' => $password,
                    'host' => $settings->host,
                    'port' => $settings->port,
                    'encryption' => $settings->encryption,
                ],
            ]);
        } catch (\Exception $e) {
            return $this->error('Failed to load mail settings');
        }
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'email' => 'required|email',
                'password' => 'nullable|string',
                'host' => 'nullable|string',
                'port' => 'nullable|integer',
                'encryption' => 'nullable|string',
            ]);

            $settings = MailSetting::first() ?? new MailSetting();
            $settings->email = $validated['email'];
            if (array_key_exists('password', $validated) && $validated['password'] !== null) {
                $settings->encrypted_password = encrypt($validated['password']);
            }
            if (!empty($validated['host'])) $settings->host = $validated['host'];
            if (!empty($validated['port'])) $settings->port = $validated['port'];
            if (!empty($validated['encryption'])) $settings->encryption = $validated['encryption'];
            $settings->save();

            return $this->ok('Mail settings saved', ['settings' => [
                'email' => $settings->email,
                'host' => $settings->host,
                'port' => $settings->port,
                'encryption' => $settings->encryption,
            ]]);
        } catch (\Illuminate\Validation\ValidationException $ve) {
            return $this->validationError($ve->errors(), 'Validation failed for mail settings');
        } catch (\Exception $e) {
            // Log exception for debugging and return message to client
            report($e);
            return $this->error('Failed to save mail settings: ' . $e->getMessage());
        }
    }
}
