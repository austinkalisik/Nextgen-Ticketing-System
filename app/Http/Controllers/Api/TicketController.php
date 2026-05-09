<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TicketController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tickets = Ticket::query()
            ->withCount('comments')
            ->when($request->string('search')->isNotEmpty(), function ($query) use ($request): void {
                $search = $request->string('search')->toString();
                $query->where(function ($query) use ($search): void {
                    $query->where('ticket_number', 'like', "%{$search}%")
                        ->orWhere('title', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('requester_name', 'like', "%{$search}%")
                        ->orWhere('requester_email', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('status') && $request->status !== 'all', fn ($query) => $query->where('status', $request->status))
            ->when($request->filled('priority') && $request->priority !== 'all', fn ($query) => $query->where('priority', $request->priority))
            ->latest()
            ->paginate(50);

        return response()->json($tickets);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validatedTicket($request);
        $data['ticket_number'] = $this->nextTicketNumber();
        $data['resolved_at'] = in_array($data['status'] ?? 'open', ['resolved', 'closed'], true) ? now() : null;

        $ticket = Ticket::create($data);
        $ticket->comments()->create([
            'author_name' => 'System',
            'body' => 'Ticket created.',
            'event_type' => 'created',
        ]);

        return response()->json($ticket->load('comments'), 201);
    }

    public function show(Ticket $ticket): JsonResponse
    {
        return response()->json($ticket->load('comments'));
    }

    public function update(Request $request, Ticket $ticket): JsonResponse
    {
        $oldStatus = $ticket->status;
        $data = $this->validatedTicket($request, true);

        if (array_key_exists('status', $data) && in_array($data['status'], ['resolved', 'closed'], true) && ! $ticket->resolved_at) {
            $data['resolved_at'] = now();
        }

        if (array_key_exists('status', $data) && ! in_array($data['status'], ['resolved', 'closed'], true)) {
            $data['resolved_at'] = null;
        }

        $ticket->update($data);

        if (($data['status'] ?? $oldStatus) !== $oldStatus) {
            $ticket->comments()->create([
                'author_name' => $request->string('updated_by', 'System')->toString(),
                'body' => "Status changed from {$oldStatus} to {$ticket->status}.",
                'event_type' => 'status_change',
            ]);
        }

        return response()->json($ticket->load('comments'));
    }

    public function destroy(Ticket $ticket): JsonResponse
    {
        $ticket->delete();

        return response()->json(['deleted' => true]);
    }

    public function comment(Request $request, Ticket $ticket): JsonResponse
    {
        $data = $request->validate([
            'author_name' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string'],
        ]);

        $comment = $ticket->comments()->create($data + ['event_type' => 'comment']);

        return response()->json($comment, 201);
    }

    private function validatedTicket(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'title' => [$required, 'string', 'max:255'],
            'description' => [$required, 'string'],
            'requester_name' => [$required, 'string', 'max:255'],
            'requester_email' => [$required, 'email', 'max:255'],
            'assignee_name' => ['nullable', 'string', 'max:255'],
            'department' => ['nullable', 'string', 'max:255'],
            'category' => [$required, 'string', 'max:255'],
            'priority' => [$required, Rule::in(['low', 'medium', 'high', 'urgent'])],
            'status' => [$required, Rule::in(['open', 'in_progress', 'waiting', 'resolved', 'closed'])],
            'due_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:1900-01-01', 'before_or_equal:9999-12-31'],
        ]);
    }

    private function nextTicketNumber(): string
    {
        $year = now()->format('Y');
        $latest = Ticket::query()
            ->where('ticket_number', 'like', "NGT-{$year}-%")
            ->orderByDesc('ticket_number')
            ->value('ticket_number');

        $count = $latest ? ((int) substr($latest, -4)) + 1 : 1;

        return "NGT-{$year}-".str_pad((string) $count, 4, '0', STR_PAD_LEFT);
    }
}
