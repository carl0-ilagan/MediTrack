<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Patient;
use Spatie\Permission\Models\Role;

class TestAccountsSeeder extends Seeder
{
    public function run()
    {
        // Ensure roles exist
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $clinicianRole = Role::firstOrCreate(['name' => 'clinician']);
        $patientRole = Role::firstOrCreate(['name' => 'patient']);

        // Admin account
        $admin = User::firstOrNew(['email' => 'admin@gmail.com']);
        $admin->name = $admin->name ?? 'Admin User';
        $admin->password = bcrypt('password');
        $admin->email_verified_at = $admin->email_verified_at ?? now();
        $admin->save();
        $admin->assignRole('admin');
        $admin->save();

        // Clinician account
        $clinician = User::firstOrNew(['email' => 'staff@gmail.com']);
        $clinician->name = $clinician->name ?? 'Staff Clinician';
        $clinician->password = bcrypt('password');
        $clinician->email_verified_at = $clinician->email_verified_at ?? now();
        $clinician->save();
        $clinician->assignRole('clinician');
        $clinician->save();

        // Patient account
        $patientUser = User::firstOrNew(['email' => 'detorresphilip6@gmail.com']);
        $patientUser->name = $patientUser->name ?? 'Philip Detorres';
        $patientUser->password = bcrypt('password');
        $patientUser->email_verified_at = $patientUser->email_verified_at ?? now();
        $patientUser->save();
        $patientUser->assignRole('patient');
        $patientUser->save();

        // Create patient record if not exists
        if (!$patientUser->patient) {
            Patient::create([
                'user_id' => $patientUser->id,
                'student_number' => 'TEST-STU-'.str_pad($patientUser->id, 4, '0', STR_PAD_LEFT),
                'date_of_birth' => now()->subYears(20)->toDateString(),
                'phone' => '09171234567',
                'address' => 'Sample Address',
                'emergency_contact' => [],
                'is_active' => true,
            ]);
        }

        // Deactivated patient account for testing
        $deactivatedUser = User::firstOrNew(['email' => 'deactivated@gmail.com']);
        $deactivatedUser->name = $deactivatedUser->name ?? 'Deactivated User';
        $deactivatedUser->password = bcrypt('password');
        $deactivatedUser->email_verified_at = $deactivatedUser->email_verified_at ?? now();
        $deactivatedUser->is_active = false; // Deactivated for testing
        $deactivatedUser->save();
        $deactivatedUser->assignRole('patient');
        $deactivatedUser->save();

        // Create patient record if not exists
        if (!$deactivatedUser->patient) {
            Patient::create([
                'user_id' => $deactivatedUser->id,
                'student_number' => 'DEACTIVATED-001',
                'date_of_birth' => now()->subYears(25)->toDateString(),
                'phone' => '09170000000',
                'address' => 'Deactivated User Address',
                'emergency_contact' => [],
                'is_active' => false,
            ]);
        }

        $this->command->info('Test accounts ensured: admin@gmail.com, staff@gmail.com, detorresphilip6@gmail.com, deactivated@gmail.com (password)');
        $this->command->info('Use deactivated@gmail.com to test deactivated account login message');
    }
}
