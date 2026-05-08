<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tickets', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('ticket_number')->unique();
            $table->string('title');
            $table->text('description');
            $table->string('requester_name');
            $table->string('requester_email');
            $table->string('assignee_name')->nullable();
            $table->string('department')->nullable();
            $table->string('category')->default('General');
            $table->string('priority')->default('medium');
            $table->string('status')->default('open');
            $table->date('due_date')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'priority']);
            $table->index('due_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};
