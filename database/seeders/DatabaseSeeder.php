<?php

namespace Database\Seeders;

use App\Models\SystemSetting;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::updateOrCreate(
            ['email' => 'test@example.com'],
            ['name' => 'Test User', 'password' => Hash::make('password')]
        );

        collect([
            'company_name' => 'Nextgen Technology Limited',
            'website_url' => 'https://nextgenpng.net/',
            'support_email' => 'support@nextgenpng.net',
            'support_phone' => '+675 325 2023',
            'office_address' => 'Mutual Rumana Building Waigani, Port Moresby',
            'profile_name' => 'Nextgen Support Desk',
            'profile_role' => 'Service Operations',
            'profile_photo' => '',
        ])->each(fn (string $value, string $key): SystemSetting => SystemSetting::updateOrCreate(['key' => $key], ['value' => $value]));

        collect([
            [
                'ticket_number' => 'NGT-2026-0001',
                'title' => '.com.pg DNS zone not resolving',
                'description' => 'Client domain is not resolving after a nameserver update and needs DNS verification.',
                'requester_name' => 'Maria Santos',
                'requester_email' => 'maria.santos@example.com',
                'assignee_name' => 'Hosting Support',
                'department' => 'Coral Bay Logistics',
                'category' => 'Domain Hosting',
                'priority' => 'urgent',
                'status' => 'in_progress',
                'due_date' => now()->addDay()->toDateString(),
            ],
            [
                'ticket_number' => 'NGT-2026-0002',
                'title' => 'Business mailbox password reset',
                'description' => 'Reset POP/IMAP mailbox access and confirm device settings for the finance team.',
                'requester_name' => 'James Kila',
                'requester_email' => 'james.kila@example.com',
                'assignee_name' => 'Email Support',
                'department' => 'PNG Retail Group',
                'category' => 'Email Support',
                'priority' => 'medium',
                'status' => 'open',
                'due_date' => now()->addDays(4)->toDateString(),
            ],
            [
                'ticket_number' => 'NGT-2026-0003',
                'title' => 'VSAT latency affecting branch site',
                'description' => 'Remote branch users are reporting intermittent connectivity and high latency.',
                'requester_name' => 'Leah Wong',
                'requester_email' => 'leah.wong@example.com',
                'assignee_name' => 'Network Operations',
                'department' => 'Highlands Field Office',
                'category' => 'ISP / VSAT',
                'priority' => 'high',
                'status' => 'waiting',
                'due_date' => now()->subDay()->toDateString(),
            ],
            [
                'ticket_number' => 'NGT-2026-0004',
                'title' => 'AI CCTV mobile view configured',
                'description' => 'Remote CCTV viewing has been configured and tested for the client security manager.',
                'requester_name' => 'Noah Kari',
                'requester_email' => 'noah.kari@example.com',
                'assignee_name' => 'Security Solutions',
                'department' => 'Port Moresby Warehouse',
                'category' => 'AI CCTV Security',
                'priority' => 'low',
                'status' => 'resolved',
                'due_date' => now()->subDays(2)->toDateString(),
                'resolved_at' => now()->subDay(),
            ],
            [
                'ticket_number' => 'NGT-2026-0005',
                'title' => 'Dokmee workflow approval rule',
                'description' => 'Client needs a document approval workflow updated for invoice routing.',
                'requester_name' => 'Anna Muri',
                'requester_email' => 'anna.muri@example.com',
                'assignee_name' => 'Document Solutions',
                'department' => 'Legal Services PNG',
                'category' => 'Document Management',
                'priority' => 'medium',
                'status' => 'open',
                'due_date' => now()->addDays(3)->toDateString(),
            ],
            [
                'ticket_number' => 'NGT-2026-0006',
                'title' => 'Client portal deployment check',
                'description' => 'Run deployment QA for a custom application release before production handover.',
                'requester_name' => 'Peter Manu',
                'requester_email' => 'peter.manu@example.com',
                'assignee_name' => 'Software Engineering',
                'department' => 'Education Partner',
                'category' => 'Software Engineering',
                'priority' => 'high',
                'status' => 'in_progress',
                'due_date' => now()->addDays(2)->toDateString(),
            ],
        ])->each(function (array $data): void {
            $ticket = Ticket::updateOrCreate(
                ['ticket_number' => $data['ticket_number']],
                $data
            );

            if (! $ticket->comments()->exists()) {
                $ticket->comments()->create([
                    'author_name' => 'System',
                    'body' => 'Seed ticket created.',
                    'event_type' => 'created',
                ]);
            }
        });
    }
}
