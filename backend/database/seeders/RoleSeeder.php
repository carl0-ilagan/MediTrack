<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        // Create roles
        $roles = ['admin', 'clinician', 'patient'];
        
        foreach ($roles as $role) {
            Role::create(['name' => $role, 'guard_name' => 'web']);
        }

        // Create some basic permissions (optional)
        $permissions = [
            'manage appointments',
            'view medical records',
            'create medical certificates',
            'manage users',
            'view dashboard'
        ];

        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission, 'guard_name' => 'web']);
        }

        // Assign permissions to roles (optional)
        $adminRole = Role::findByName('admin');
        $adminRole->givePermissionTo(Permission::all());

        $clinicianRole = Role::findByName('clinician');
        $clinicianRole->givePermissionTo(['manage appointments', 'view medical records', 'create medical certificates']);

        $patientRole = Role::findByName('patient');
        $patientRole->givePermissionTo(['view dashboard']);
    }
}