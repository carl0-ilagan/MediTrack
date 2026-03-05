<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('clinic_settings')) {
            return;
        }

        DB::table('clinic_settings')
            ->whereNull('footer_description')
            ->update(['footer_description' => 'Modern healthcare management for better care and operations.']);

        DB::table('clinic_settings')
            ->whereNull('contact_email')
            ->update(['contact_email' => 'clinic@university.edu']);

        DB::table('clinic_settings')
            ->whereNull('contact_phone')
            ->update(['contact_phone' => '(123) 456-7890']);
    }

    public function down(): void
    {
        // keep values on rollback to avoid accidental data loss
    }
};
