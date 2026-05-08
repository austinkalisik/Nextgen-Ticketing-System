<?php

namespace Tests\Feature;

use App\Models\Ticket;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TicketApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_ticket_can_be_created_listed_and_commented_on(): void
    {
        $payload = [
            'title' => 'Email outage',
            'description' => 'Shared mailbox is not receiving new mail.',
            'requester_name' => 'Ari Tuma',
            'requester_email' => 'ari.tuma@example.com',
            'assignee_name' => 'Support Desk',
            'department' => 'Administration',
            'category' => 'Email',
            'priority' => 'high',
            'status' => 'open',
            'due_date' => now()->addDays(2)->toDateString(),
        ];

        $created = $this->postJson('/api/tickets', $payload)
            ->assertCreated()
            ->assertJsonPath('title', 'Email outage')
            ->assertJsonPath('ticket_number', 'NGT-'.now()->format('Y').'-0001')
            ->json();

        $this->getJson('/api/tickets?search=mailbox')
            ->assertOk()
            ->assertJsonPath('data.0.id', $created['id']);

        $this->postJson("/api/tickets/{$created['id']}/comments", [
            'author_name' => 'Support Desk',
            'body' => 'Issue acknowledged and assigned.',
        ])
            ->assertCreated()
            ->assertJsonPath('body', 'Issue acknowledged and assigned.');

        $this->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('open', 1);
    }

    public function test_ticket_status_sets_resolved_timestamp(): void
    {
        $ticket = Ticket::create([
            'ticket_number' => 'NGT-2026-0100',
            'title' => 'Printer offline',
            'description' => 'Front desk printer is offline.',
            'requester_name' => 'Kai Moa',
            'requester_email' => 'kai.moa@example.com',
            'category' => 'Hardware',
            'priority' => 'medium',
            'status' => 'open',
        ]);

        $this->putJson("/api/tickets/{$ticket->id}", [
            'status' => 'resolved',
        ])
            ->assertOk()
            ->assertJsonPath('status', 'resolved')
            ->assertJsonPath('comments.0.event_type', 'status_change');

        $this->assertNotNull($ticket->refresh()->resolved_at);
    }
}
