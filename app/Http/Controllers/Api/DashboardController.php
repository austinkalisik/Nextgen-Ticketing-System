<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $statusCounts = Ticket::query()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $priorityCounts = Ticket::query()
            ->selectRaw('priority, count(*) as total')
            ->groupBy('priority')
            ->pluck('total', 'priority');

        return response()->json([
            'total' => Ticket::count(),
            'open' => (int) ($statusCounts['open'] ?? 0),
            'in_progress' => (int) ($statusCounts['in_progress'] ?? 0),
            'waiting' => (int) ($statusCounts['waiting'] ?? 0),
            'resolved' => (int) ($statusCounts['resolved'] ?? 0),
            'closed' => (int) ($statusCounts['closed'] ?? 0),
            'urgent' => (int) ($priorityCounts['urgent'] ?? 0),
            'overdue' => Ticket::query()
                ->whereNotIn('status', ['resolved', 'closed'])
                ->whereDate('due_date', '<', now()->toDateString())
                ->count(),
        ]);
    }
}
