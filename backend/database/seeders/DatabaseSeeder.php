<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create Roles (idempotent)
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $clinicianRole = Role::firstOrCreate(['name' => 'clinician']);
        $patientRole = Role::firstOrCreate(['name' => 'patient']);

        $this->command->info('Default roles created!');

        // Ensure test accounts for local development
        $this->call(TestAccountsSeeder::class);
        
        // Seed medical certificate reasons
        $this->call(MedcertReasonSeeder::class);

        // Seed appointment/laboratory services
        $this->call(AppointmentTypeSeeder::class);
    }
}