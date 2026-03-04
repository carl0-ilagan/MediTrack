<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            if (Schema::hasColumn('patients', 'address')) {
                $table->text('address')->nullable()->change();
            }
            if (Schema::hasColumn('patients', 'emergency_contact')) {
                $table->json('emergency_contact')->nullable()->change();
            }
        });
    }

    public function down(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            if (Schema::hasColumn('patients', 'address')) {
                $table->text('address')->nullable(false)->change();
            }
            if (Schema::hasColumn('patients', 'emergency_contact')) {
                $table->json('emergency_contact')->nullable(false)->change();
            }
        });
    }
};
