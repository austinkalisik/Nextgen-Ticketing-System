<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ticket extends Model
{
    use HasFactory;
    use HasUuids;

    protected $fillable = [
        'ticket_number',
        'title',
        'description',
        'requester_name',
        'requester_email',
        'assignee_name',
        'department',
        'category',
        'priority',
        'status',
        'due_date',
        'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'due_date' => 'date',
            'resolved_at' => 'datetime',
        ];
    }

    public function comments(): HasMany
    {
        return $this->hasMany(TicketComment::class)->latest();
    }
}
