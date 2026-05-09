import {
    Activity,
    AlertTriangle,
    Building2,
    CheckCircle2,
    CircuitBoard,
    Clock3,
    Database,
    ExternalLink,
    Globe2,
    LayoutDashboard,
    LifeBuoy,
    Mail,
    MessageSquare,
    Network,
    Plus,
    RefreshCw,
    Search,
    Server,
    Settings,
    ShieldCheck,
    Ticket,
    Trash2,
    Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const emptyForm = {
    title: '',
    description: '',
    requester_name: '',
    requester_email: '',
    assignee_name: '',
    department: '',
    category: 'Domain Hosting',
    priority: 'medium',
    status: 'open',
    due_date: '',
};

const statusLabels = {
    open: 'Open',
    in_progress: 'In Progress',
    waiting: 'Waiting',
    resolved: 'Resolved',
    closed: 'Closed',
};

const priorityLabels = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    urgent: 'Urgent',
};

const serviceCategories = [
    { name: 'Domain Hosting', icon: Globe2, tone: 'text-cyan-700', bg: 'bg-cyan-50', owner: 'Hosting Support' },
    { name: 'Email Support', icon: Server, tone: 'text-blue-700', bg: 'bg-blue-50', owner: 'Email Support' },
    { name: 'ISP / VSAT', icon: Network, tone: 'text-emerald-700', bg: 'bg-emerald-50', owner: 'Network Operations' },
    { name: 'AI CCTV Security', icon: ShieldCheck, tone: 'text-violet-700', bg: 'bg-violet-50', owner: 'Security Solutions' },
    { name: 'Document Management', icon: Database, tone: 'text-amber-700', bg: 'bg-amber-50', owner: 'Document Solutions' },
    { name: 'Software Engineering', icon: CircuitBoard, tone: 'text-slate-700', bg: 'bg-slate-100', owner: 'Software Engineering' },
];

const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tickets', label: 'Tickets', icon: Ticket },
    { id: 'clients', label: 'Clients', icon: Building2 },
    { id: 'services', label: 'Services', icon: Server },
    { id: 'teams', label: 'Teams', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
];

const defaultSettings = {
    company_name: 'Nextgen Technology Limited',
    website_url: 'https://nextgenpng.net/',
    support_email: 'support@nextgenpng.net',
    support_phone: '+675 325 2023',
    office_address: 'Mutual Rumana Building Waigani, Port Moresby',
    profile_name: 'Nextgen Support Desk',
    profile_role: 'Service Operations',
    profile_photo: '',
};

function badgeClass(value) {
    const classes = {
        open: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
        in_progress: 'bg-amber-50 text-amber-800 ring-amber-200',
        waiting: 'bg-violet-50 text-violet-700 ring-violet-200',
        resolved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
        closed: 'bg-zinc-100 text-zinc-700 ring-zinc-200',
        low: 'bg-zinc-100 text-zinc-700 ring-zinc-200',
        medium: 'bg-sky-50 text-sky-700 ring-sky-200',
        high: 'bg-orange-50 text-orange-800 ring-orange-200',
        urgent: 'bg-rose-50 text-rose-700 ring-rose-200',
    };

    return classes[value] ?? 'bg-zinc-100 text-zinc-700 ring-zinc-200';
}

function isActive(ticket) {
    return ticket && !['resolved', 'closed'].includes(ticket.status);
}

function isOverdue(ticket) {
    return isActive(ticket) && ticket.due_date && new Date(`${ticket.due_date.slice(0, 10)}T23:59:59`).getTime() < Date.now();
}

function slaState(ticket) {
    if (!ticket?.due_date || !isActive(ticket)) {
        return { label: 'SLA Clear', className: 'text-emerald-700' };
    }

    const due = new Date(`${ticket.due_date.slice(0, 10)}T23:59:59`);
    const hours = Math.round((due.getTime() - Date.now()) / 36e5);

    if (hours < 0) {
        return { label: `${Math.abs(hours)}h overdue`, className: 'text-rose-700' };
    }

    if (hours <= 24) {
        return { label: `${hours}h left`, className: 'text-amber-700' };
    }

    return { label: `${Math.ceil(hours / 24)}d left`, className: 'text-cyan-700' };
}

async function api(path, options = {}) {
    const response = await fetch(`/api${path}`, {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    });

    if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message ?? `Request failed with status ${response.status}.`);
    }

    return response.json();
}

function groupBy(items, keyResolver) {
    return items.reduce((groups, item) => {
        const key = keyResolver(item);
        groups[key] = groups[key] ? [...groups[key], item] : [item];
        return groups;
    }, {});
}

function normalizeDateInput(value) {
    if (!value) {
        return '';
    }

    const parts = value.split('-');
    if (parts[0]?.length > 4) {
        parts[0] = parts[0].slice(0, 4);
    }

    return parts.join('-').slice(0, 10);
}

function isValidDateInput(value) {
    return !value || /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export default function App() {
    const [activeView, setActiveView] = useState('dashboard');
    const [dashboard, setDashboard] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [selected, setSelected] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [comment, setComment] = useState({ author_name: 'Nextgen Support', body: '' });
    const [filters, setFilters] = useState({ search: '', status: 'all', priority: 'all' });
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState(defaultSettings);
    const [settingsSaving, setSettingsSaving] = useState(false);
    const [settingsSaved, setSettingsSaved] = useState('');
    const [error, setError] = useState('');

    const query = useMemo(() => new URLSearchParams(filters).toString(), [filters]);

    const categoryCounts = useMemo(() => {
        return serviceCategories.map((category) => {
            const serviceTickets = tickets.filter((ticket) => ticket.category === category.name);
            return {
                ...category,
                total: serviceTickets.length,
                active: serviceTickets.filter(isActive).length,
                overdue: serviceTickets.filter(isOverdue).length,
                urgent: serviceTickets.filter((ticket) => ticket.priority === 'urgent').length,
            };
        });
    }, [tickets]);

    const clients = useMemo(() => {
        return Object.entries(groupBy(tickets, (ticket) => ticket.department || ticket.requester_name)).map(([name, items]) => {
            const latest = [...items].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
            return {
                name,
                contact: latest?.requester_name ?? 'Unknown',
                email: latest?.requester_email ?? '',
                total: items.length,
                active: items.filter(isActive).length,
                urgent: items.filter((ticket) => ticket.priority === 'urgent').length,
                overdue: items.filter(isOverdue).length,
                latest,
            };
        }).sort((a, b) => b.active - a.active || b.total - a.total);
    }, [tickets]);

    const teams = useMemo(() => {
        return Object.entries(groupBy(tickets, (ticket) => ticket.assignee_name || 'Unassigned')).map(([name, items]) => ({
            name,
            total: items.length,
            active: items.filter(isActive).length,
            overdue: items.filter(isOverdue).length,
            urgent: items.filter((ticket) => ticket.priority === 'urgent').length,
            resolved: items.filter((ticket) => ['resolved', 'closed'].includes(ticket.status)).length,
        })).sort((a, b) => b.active - a.active || b.urgent - a.urgent);
    }, [tickets]);

    const metrics = [
        { label: 'Active Tickets', value: (dashboard?.open ?? 0) + (dashboard?.in_progress ?? 0) + (dashboard?.waiting ?? 0), icon: Ticket, tone: 'text-cyan-700' },
        { label: 'Urgent SLA', value: dashboard?.urgent ?? 0, icon: AlertTriangle, tone: 'text-rose-700' },
        { label: 'Overdue', value: dashboard?.overdue ?? 0, icon: Clock3, tone: 'text-amber-700' },
        { label: 'Resolved', value: dashboard?.resolved ?? 0, icon: CheckCircle2, tone: 'text-emerald-700' },
    ];

    async function loadData(nextSelectedId = selected?.id) {
        setLoading(true);
        setError('');

        try {
            const [dashboardData, ticketData] = await Promise.all([
                api('/dashboard'),
                api(`/tickets?${query}`),
            ]);

            setDashboard(dashboardData);
            setTickets(ticketData.data);

            const nextSelected = ticketData.data.find((ticket) => ticket.id === nextSelectedId) ?? ticketData.data[0] ?? null;
            setSelected(nextSelected ? await api(`/tickets/${nextSelected.id}`) : null);
        } catch (exception) {
            setError(exception.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, [query]);

    useEffect(() => {
        loadSettings();
    }, []);

    async function loadSettings() {
        try {
            setSettings(await api('/settings'));
        } catch (exception) {
            setError(exception.message);
        }
    }

    function startCreate(defaults = {}) {
        setEditingId(null);
        setForm({ ...emptyForm, ...defaults });
        setActiveView('tickets');
    }

    function startEdit(ticket) {
        setEditingId(ticket.id);
        setActiveView('tickets');
        setForm({
            title: ticket.title ?? '',
            description: ticket.description ?? '',
            requester_name: ticket.requester_name ?? '',
            requester_email: ticket.requester_email ?? '',
            assignee_name: ticket.assignee_name ?? '',
            department: ticket.department ?? '',
            category: ticket.category ?? 'Domain Hosting',
            priority: ticket.priority ?? 'medium',
            status: ticket.status ?? 'open',
            due_date: ticket.due_date?.slice(0, 10) ?? '',
        });
    }

    async function submitTicket(event) {
        event.preventDefault();
        setSaving(true);
        setError('');

        try {
            if (!isValidDateInput(form.due_date)) {
                throw new Error('Due date must use a four-digit year.');
            }

            const payload = { ...form, due_date: form.due_date || null };
            const ticket = editingId
                ? await api(`/tickets/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) })
                : await api('/tickets', { method: 'POST', body: JSON.stringify(payload) });

            setEditingId(null);
            setForm(emptyForm);
            await loadData(ticket.id);
        } catch (exception) {
            setError(exception.message);
        } finally {
            setSaving(false);
        }
    }

    async function saveSettings(nextSettings) {
        setSettingsSaving(true);
        setSettingsSaved('');
        setError('');

        try {
            const saved = await api('/settings', {
                method: 'PUT',
                body: JSON.stringify(nextSettings),
            });
            setSettings(saved);
            setSettingsSaved('Settings saved.');
        } catch (exception) {
            setError(exception.message);
        } finally {
            setSettingsSaving(false);
        }
    }

    async function removeTicket(ticket) {
        if (!confirm(`Delete ${ticket.ticket_number}?`)) {
            return;
        }

        await api(`/tickets/${ticket.id}`, { method: 'DELETE' });
        await loadData(null);
    }

    async function addComment(event) {
        event.preventDefault();

        if (!selected || !comment.body.trim()) {
            return;
        }

        try {
            const created = await api(`/tickets/${selected.id}/comments`, {
                method: 'POST',
                body: JSON.stringify(comment),
            });

            setSelected({ ...selected, comments: [created, ...(selected.comments ?? [])] });
            setComment({ ...comment, body: '' });
        } catch (exception) {
            setError(exception.message);
        }
    }

    function showClientTickets(client) {
        setFilters({ ...filters, search: client.name });
        setActiveView('tickets');
    }

    function showServiceTickets(service) {
        setFilters({ ...filters, search: service.name });
        setActiveView('tickets');
    }

    return (
        <main className="min-h-screen overflow-x-hidden bg-[#eef4f8] text-slate-950">
            <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
                <aside className="hidden border-r border-slate-200 bg-[#07172b] text-white lg:block">
                    <div className="flex h-full flex-col">
                        <div className="px-6 py-6">
                            <div className="flex items-center gap-3">
                                <div className="grid h-11 w-11 place-items-center overflow-hidden rounded-md bg-cyan-400 text-lg font-black text-[#07172b]">
                                    {settings.profile_photo ? <img alt="Profile" className="h-full w-full object-cover" src={settings.profile_photo} /> : 'N'}
                                </div>
                                <div className="min-w-0">
                                    <div className="truncate text-lg font-semibold">{settings.profile_name}</div>
                                    <div className="truncate text-xs text-cyan-200">{settings.profile_role}</div>
                                </div>
                            </div>
                        </div>
                        <nav className="space-y-1 px-3 text-sm">
                            {navItems.map((item) => (
                                <NavItem active={activeView === item.id} icon={item.icon} key={item.id} label={item.label} onClick={() => setActiveView(item.id)} />
                            ))}
                        </nav>
                        <div className="mt-auto border-t border-white/10 p-5">
                            <div className="rounded-md border border-cyan-300/30 bg-white/5 p-4">
                                <div className="flex items-center gap-2 text-sm font-semibold text-cyan-100">
                                    <LifeBuoy size={16} /> 24/7 Support Desk
                                </div>
                                <p className="mt-2 text-xs leading-5 text-slate-300">{settings.support_email}</p>
                                <p className="text-xs leading-5 text-slate-300">{settings.support_phone}</p>
                            </div>
                        </div>
                    </div>
                </aside>

                <section className="min-w-0">
                    <header className="border-b border-slate-200 bg-white">
                        <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 xl:flex-row xl:items-center xl:justify-between">
                            <div>
                                <h1 className="text-2xl font-semibold leading-tight text-slate-950">
                                    {navItems.find((item) => item.id === activeView)?.label ?? 'Dashboard'}
                                </h1>
                                <p className="mt-1 text-sm text-slate-500">{settings.company_name} service operations</p>
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <label className="relative">
                                    <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                    <input
                                        className="h-10 w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 text-sm sm:w-72"
                                        onChange={(event) => setFilters({ ...filters, search: event.target.value })}
                                        placeholder="Search client, ticket, service"
                                        value={filters.search}
                                    />
                                </label>
                                <button
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-cyan-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-cyan-700"
                                    onClick={() => startCreate()}
                                    type="button"
                                >
                                    <Plus size={16} /> New Ticket
                                </button>
                            </div>
                        </div>
                    </header>

                    <div className="px-4 py-5 sm:px-6">
                        {error && <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}

                        {activeView === 'dashboard' && (
                            <DashboardView
                                categoryCounts={categoryCounts}
                                clients={clients}
                                loading={loading}
                                metrics={metrics}
                                setActiveView={setActiveView}
                                startCreate={startCreate}
                                tickets={tickets}
                            />
                        )}

                        {activeView === 'tickets' && (
                            <TicketsView
                                addComment={addComment}
                                comment={comment}
                                editingId={editingId}
                                filters={filters}
                                form={form}
                                loading={loading}
                                removeTicket={removeTicket}
                                saving={saving}
                                selected={selected}
                                setComment={setComment}
                                setFilters={setFilters}
                                setForm={setForm}
                                setSelected={setSelected}
                                startCreate={startCreate}
                                startEdit={startEdit}
                                submitTicket={submitTicket}
                                tickets={tickets}
                            />
                        )}

                        {activeView === 'clients' && <ClientsView clients={clients} showClientTickets={showClientTickets} startCreate={startCreate} />}

                        {activeView === 'services' && <ServicesView services={categoryCounts} showServiceTickets={showServiceTickets} startCreate={startCreate} />}

                        {activeView === 'teams' && <TeamsView teams={teams} tickets={tickets} />}

                        {activeView === 'settings' && (
                            <SettingsView
                                loadData={loadData}
                                saveSettings={saveSettings}
                                settings={settings}
                                settingsSaved={settingsSaved}
                                settingsSaving={settingsSaving}
                                setSettings={setSettings}
                            />
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}

function DashboardView({ categoryCounts, clients, loading, metrics, setActiveView, startCreate, tickets }) {
    const recentTickets = tickets.slice(0, 6);
    const riskTickets = tickets.filter((ticket) => isOverdue(ticket) || ticket.priority === 'urgent').slice(0, 6);

    return (
        <div className="space-y-5">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <h2 className="text-base font-semibold">Service Queue</h2>
                        <button className="text-sm font-semibold text-cyan-700" onClick={() => setActiveView('services')} type="button">View services</button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                        {categoryCounts.map((category) => {
                            const Icon = category.icon;

                            return (
                                <button className="rounded-md border border-slate-200 bg-slate-50 p-3 text-left hover:border-cyan-300 hover:bg-cyan-50" key={category.name} onClick={() => startCreate({ category: category.name, assignee_name: category.owner })} type="button">
                                    <div className={`grid h-9 w-9 place-items-center rounded-md ${category.bg} ${category.tone}`}><Icon size={17} /></div>
                                    <div className="mt-3 text-lg font-semibold">{category.active}</div>
                                    <div className="text-xs font-medium text-slate-500">{category.name}</div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                    <h2 className="text-base font-semibold">SLA Risk</h2>
                    <div className="mt-3 space-y-3">
                        {riskTickets.length === 0 && <p className="text-sm text-slate-500">No urgent or overdue tickets.</p>}
                        {riskTickets.map((ticket) => <CompactTicket key={ticket.id} ticket={ticket} />)}
                    </div>
                </section>
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
                <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-base font-semibold">Recent Tickets</h2>
                        <button className="text-sm font-semibold text-cyan-700" onClick={() => setActiveView('tickets')} type="button">Open tickets</button>
                    </div>
                    <TicketList loading={loading} tickets={recentTickets} />
                </section>

                <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-base font-semibold">Client Activity</h2>
                        <button className="text-sm font-semibold text-cyan-700" onClick={() => setActiveView('clients')} type="button">Open clients</button>
                    </div>
                    <div className="space-y-3">
                        {clients.slice(0, 5).map((client) => (
                            <div className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2" key={client.name}>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold">{client.name}</p>
                                    <p className="truncate text-xs text-slate-500">{client.contact}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold">{client.active}</p>
                                    <p className="text-xs text-slate-500">active</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}

function TicketsView(props) {
    return (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_430px]">
            <div className="min-w-0 space-y-5">
                <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <h2 className="text-base font-semibold">Service Queue</h2>
                        <div className="flex flex-wrap gap-2">
                            <SelectFilter label="Status" onChange={(value) => props.setFilters({ ...props.filters, status: value })} options={statusLabels} value={props.filters.status} />
                            <SelectFilter label="Priority" onChange={(value) => props.setFilters({ ...props.filters, priority: value })} options={priorityLabels} value={props.filters.priority} />
                            <button className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium hover:bg-slate-50" onClick={() => props.setFilters({ search: '', status: 'all', priority: 'all' })} type="button">
                                <RefreshCw size={15} /> Reset
                            </button>
                        </div>
                    </div>
                </section>

                <TicketTable loading={props.loading} removeTicket={props.removeTicket} selected={props.selected} setSelected={props.setSelected} startEdit={props.startEdit} tickets={props.tickets} />
            </div>

            <aside className="space-y-5">
                <TicketForm editingId={props.editingId} form={props.form} saving={props.saving} setForm={props.setForm} startCreate={props.startCreate} submitTicket={props.submitTicket} />
                <TicketDetails addComment={props.addComment} comment={props.comment} selected={props.selected} setComment={props.setComment} />
            </aside>
        </div>
    );
}

function ClientsView({ clients, showClientTickets, startCreate }) {
    return (
        <section className="rounded-md border border-slate-200 bg-white shadow-sm">
            <div className="grid gap-3 border-b border-slate-200 p-4 md:grid-cols-4">
                <SummaryTile label="Clients" value={clients.length} />
                <SummaryTile label="Active Cases" value={clients.reduce((total, client) => total + client.active, 0)} />
                <SummaryTile label="Urgent" value={clients.reduce((total, client) => total + client.urgent, 0)} />
                <SummaryTile label="Overdue" value={clients.reduce((total, client) => total + client.overdue, 0)} />
            </div>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                        <tr>
                            <th className="px-4 py-3">Client</th>
                            <th className="px-4 py-3">Contact</th>
                            <th className="px-4 py-3">Latest Ticket</th>
                            <th className="px-4 py-3">Active</th>
                            <th className="px-4 py-3">Risk</th>
                            <th className="px-4 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {clients.map((client) => (
                            <tr className="hover:bg-slate-50" key={client.name}>
                                <td className="px-4 py-3">
                                    <span className="block font-semibold">{client.name}</span>
                                    <span className="block text-xs text-slate-500">{client.total} total tickets</span>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="block font-medium">{client.contact}</span>
                                    <span className="block text-xs text-slate-500">{client.email}</span>
                                </td>
                                <td className="px-4 py-3">{client.latest?.title ?? 'None'}</td>
                                <td className="px-4 py-3 font-semibold">{client.active}</td>
                                <td className="px-4 py-3">
                                    <span className={client.overdue ? 'font-semibold text-rose-700' : 'font-semibold text-emerald-700'}>
                                        {client.overdue ? `${client.overdue} overdue` : 'Clear'}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-2">
                                        <button className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold hover:bg-white" onClick={() => showClientTickets(client)} type="button">Tickets</button>
                                        <button className="rounded-md bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-700" onClick={() => startCreate({ department: client.name, requester_name: client.contact, requester_email: client.email })} type="button">New</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

function ServicesView({ services, showServiceTickets, startCreate }) {
    return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => {
                const Icon = service.icon;
                return (
                    <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm" key={service.name}>
                        <div className="flex items-start justify-between gap-3">
                            <div className={`grid h-11 w-11 place-items-center rounded-md ${service.bg} ${service.tone}`}><Icon size={20} /></div>
                            <Badge labels={{ operational: 'Operational' }} value="operational" />
                        </div>
                        <h2 className="mt-4 text-base font-semibold">{service.name}</h2>
                        <p className="mt-1 text-sm text-slate-500">{service.owner}</p>
                        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                            <SummaryTile label="Total" value={service.total} />
                            <SummaryTile label="Active" value={service.active} />
                            <SummaryTile label="Urgent" value={service.urgent} />
                            <SummaryTile label="Overdue" value={service.overdue} />
                        </div>
                        <div className="mt-4 flex gap-2">
                            <button className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50" onClick={() => showServiceTickets(service)} type="button">Tickets</button>
                            <button className="flex-1 rounded-md bg-cyan-600 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-700" onClick={() => startCreate({ category: service.name, assignee_name: service.owner })} type="button">New</button>
                        </div>
                    </section>
                );
            })}
        </div>
    );
}

function TeamsView({ teams, tickets }) {
    return (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <section className="rounded-md border border-slate-200 bg-white shadow-sm">
                <div className="grid gap-3 border-b border-slate-200 p-4 md:grid-cols-4">
                    <SummaryTile label="Teams" value={teams.length} />
                    <SummaryTile label="Assigned" value={tickets.filter((ticket) => ticket.assignee_name).length} />
                    <SummaryTile label="Unassigned" value={tickets.filter((ticket) => !ticket.assignee_name).length} />
                    <SummaryTile label="Overdue" value={tickets.filter(isOverdue).length} />
                </div>
                <div className="divide-y divide-slate-100">
                    {teams.map((team) => (
                        <div className="grid gap-3 p-4 md:grid-cols-[1fr_90px_90px_90px_90px]" key={team.name}>
                            <div>
                                <p className="font-semibold">{team.name}</p>
                                <p className="text-sm text-slate-500">{team.total} tickets assigned</p>
                            </div>
                            <TeamStat label="Active" value={team.active} />
                            <TeamStat label="Urgent" value={team.urgent} />
                            <TeamStat label="Overdue" value={team.overdue} tone={team.overdue ? 'text-rose-700' : 'text-emerald-700'} />
                            <TeamStat label="Resolved" value={team.resolved} />
                        </div>
                    ))}
                </div>
            </section>

            <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-base font-semibold">Operations Contacts</h2>
                <div className="mt-4 space-y-3">
                    {serviceCategories.map((service) => (
                        <div className="rounded-md border border-slate-200 bg-slate-50 p-3" key={service.name}>
                            <p className="text-sm font-semibold">{service.owner}</p>
                            <p className="text-xs text-slate-500">{service.name}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

function SettingsView({ loadData, saveSettings, settings, settingsSaved, settingsSaving, setSettings }) {
    function updateSetting(key, value) {
        setSettings({ ...settings, [key]: value });
    }

    function uploadProfilePhoto(event) {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        if (!file.type.startsWith('image/')) {
            alert('Choose an image file for the profile photo.');
            return;
        }

        if (file.size > 700 * 1024) {
            alert('Profile photo must be 700KB or smaller.');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => updateSetting('profile_photo', reader.result?.toString() ?? '');
        reader.readAsDataURL(file);
    }

    return (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
            <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-base font-semibold">Company & Profile Settings</h2>
                    {settingsSaved && <span className="text-sm font-semibold text-emerald-700">{settingsSaved}</span>}
                </div>

                <div className="mt-5 grid gap-5 lg:grid-cols-[220px_1fr]">
                    <div>
                        <div className="grid aspect-square w-full place-items-center overflow-hidden rounded-md border border-slate-200 bg-[#07172b] text-white">
                            {settings.profile_photo ? (
                                <img alt="Profile" className="h-full w-full object-cover" src={settings.profile_photo} />
                            ) : (
                                <div className="text-center">
                                    <div className="mx-auto grid h-16 w-16 place-items-center rounded-md bg-cyan-400 text-2xl font-black text-[#07172b]">N</div>
                                    <p className="mt-3 text-sm font-semibold">No Photo</p>
                                </div>
                            )}
                        </div>
                        <label className="mt-3 flex h-10 cursor-pointer items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold hover:bg-slate-50">
                            Change Profile Pic
                            <input accept="image/*" className="sr-only" onChange={uploadProfilePhoto} type="file" />
                        </label>
                        {settings.profile_photo && (
                            <button className="mt-2 h-10 w-full rounded-md border border-rose-200 text-sm font-semibold text-rose-700 hover:bg-rose-50" onClick={() => updateSetting('profile_photo', '')} type="button">
                                Remove Photo
                            </button>
                        )}
                    </div>

                    <form className="grid gap-3" onSubmit={(event) => { event.preventDefault(); saveSettings(settings); }}>
                        <SettingsField label="Company Name" onChange={(value) => updateSetting('company_name', value)} required value={settings.company_name} />
                        <SettingsField label="Website URL" onChange={(value) => updateSetting('website_url', value)} required type="url" value={settings.website_url} />
                        <div className="grid gap-3 md:grid-cols-2">
                            <SettingsField label="Support Email" onChange={(value) => updateSetting('support_email', value)} required type="email" value={settings.support_email} />
                            <SettingsField label="Support Phone" onChange={(value) => updateSetting('support_phone', value)} required value={settings.support_phone} />
                            <SettingsField label="Profile Name" onChange={(value) => updateSetting('profile_name', value)} required value={settings.profile_name} />
                            <SettingsField label="Profile Role" onChange={(value) => updateSetting('profile_role', value)} required value={settings.profile_role} />
                        </div>
                        <label className="grid gap-1 text-sm font-medium text-slate-700">
                            Office Address
                            <textarea className="min-h-20 rounded-md border border-slate-300 px-3 py-2 text-sm font-normal" onChange={(event) => updateSetting('office_address', event.target.value)} value={settings.office_address} />
                        </label>
                        <button className="h-10 rounded-md bg-[#07172b] px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60" disabled={settingsSaving} type="submit">
                            {settingsSaving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </form>
                </div>
            </section>

            <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-base font-semibold">System Status</h2>
                <div className="mt-4 grid gap-3">
                    <StatusLine label="Laravel API" value="Online" />
                    <StatusLine label="Database" value="Connected" />
                    <StatusLine label="Frontend Assets" value="Production build" />
                </div>
                <button className="mt-4 inline-flex h-10 items-center gap-2 rounded-md bg-cyan-600 px-4 text-sm font-semibold text-white hover:bg-cyan-700" onClick={() => loadData()} type="button">
                    <RefreshCw size={16} /> Refresh Data
                </button>
                <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center gap-3">
                        <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-md bg-[#07172b] text-sm font-black text-white">
                            {settings.profile_photo ? <img alt="Profile preview" className="h-full w-full object-cover" src={settings.profile_photo} /> : 'N'}
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{settings.profile_name}</p>
                            <p className="truncate text-xs text-slate-500">{settings.profile_role}</p>
                        </div>
                    </div>
                </div>
                <a className="mt-3 inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 px-4 text-sm font-semibold hover:bg-slate-50" href={settings.website_url} rel="noreferrer" target="_blank">
                    <ExternalLink size={16} /> Website
                </a>
            </section>
        </div>
    );
}

function SettingsField({ label, onChange, required = false, type = 'text', value }) {
    return (
        <label className="grid gap-1 text-sm font-medium text-slate-700">
            {label}
            <input className="h-10 rounded-md border border-slate-300 px-3 text-sm font-normal" onChange={(event) => onChange(event.target.value)} required={required} type={type} value={value} />
        </label>
    );
}

function NavItem({ active = false, icon: Icon, label, onClick }) {
    return (
        <button className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left font-medium ${active ? 'bg-cyan-400 text-[#07172b]' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`} onClick={onClick} type="button">
            <Icon size={17} /> {label}
        </button>
    );
}

function MetricCard({ metric }) {
    const Icon = metric.icon;

    return (
        <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">{metric.label}</span>
                <Icon className={metric.tone} size={19} />
            </div>
            <div className="mt-3 text-3xl font-semibold">{metric.value}</div>
        </div>
    );
}

function SummaryTile({ label, value }) {
    return (
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-lg font-semibold">{value}</p>
            <p className="text-xs font-medium text-slate-500">{label}</p>
        </div>
    );
}

function TeamStat({ label, value, tone = 'text-slate-900' }) {
    return (
        <div>
            <p className={`text-sm font-semibold ${tone}`}>{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
        </div>
    );
}

function SelectFilter({ label, onChange, options, value }) {
    return (
        <select aria-label={label} className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm" onChange={(event) => onChange(event.target.value)} value={value}>
            <option value="all">All {label}</option>
            {Object.entries(options).map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
        </select>
    );
}

function TicketList({ loading, tickets }) {
    if (loading) {
        return <p className="py-6 text-center text-sm text-slate-500">Loading tickets...</p>;
    }

    if (tickets.length === 0) {
        return <p className="py-6 text-center text-sm text-slate-500">No tickets found.</p>;
    }

    return (
        <div className="space-y-3">
            {tickets.map((ticket) => <CompactTicket key={ticket.id} ticket={ticket} />)}
        </div>
    );
}

function CompactTicket({ ticket }) {
    const sla = slaState(ticket);
    return (
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm font-semibold">{ticket.ticket_number}</p>
                <span className={`text-xs font-semibold ${sla.className}`}>{sla.label}</span>
            </div>
            <p className="mt-1 truncate text-sm text-slate-600">{ticket.title}</p>
        </div>
    );
}

function TicketTable({ loading, removeTicket, selected, setSelected, startEdit, tickets }) {
    return (
        <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                        <tr>
                            <th className="px-4 py-3">Ticket</th>
                            <th className="px-4 py-3">Client</th>
                            <th className="px-4 py-3">Service</th>
                            <th className="px-4 py-3">SLA</th>
                            <th className="px-4 py-3">Priority</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading && <tr><td className="px-4 py-8 text-center text-slate-500" colSpan="7">Loading tickets...</td></tr>}
                        {!loading && tickets.length === 0 && <tr><td className="px-4 py-8 text-center text-slate-500" colSpan="7">No tickets match the current filters.</td></tr>}
                        {tickets.map((ticket) => {
                            const sla = slaState(ticket);

                            return (
                                <tr className={selected?.id === ticket.id ? 'bg-cyan-50/70' : 'hover:bg-slate-50'} key={ticket.id}>
                                    <td className="px-4 py-3">
                                        <button className="text-left" onClick={async () => setSelected(await api(`/tickets/${ticket.id}`))} type="button">
                                            <span className="block font-semibold text-slate-950">{ticket.ticket_number}</span>
                                            <span className="block max-w-[330px] truncate text-slate-600">{ticket.title}</span>
                                        </button>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="block font-medium text-slate-800">{ticket.requester_name}</span>
                                        <span className="block text-xs text-slate-500">{ticket.department || ticket.requester_email}</span>
                                    </td>
                                    <td className="px-4 py-3 text-slate-700">{ticket.category}</td>
                                    <td className={`px-4 py-3 font-semibold ${sla.className}`}>{sla.label}</td>
                                    <td className="px-4 py-3"><Badge labels={priorityLabels} value={ticket.priority} /></td>
                                    <td className="px-4 py-3"><Badge labels={statusLabels} value={ticket.status} /></td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2">
                                            <button className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold hover:bg-white" onClick={() => startEdit(ticket)} type="button">Edit</button>
                                            <button aria-label="Delete ticket" className="rounded-md border border-rose-200 p-1.5 text-rose-700 hover:bg-rose-50" onClick={() => removeTicket(ticket)} type="button"><Trash2 size={15} /></button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function Badge({ value, labels }) {
    return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${badgeClass(value)}`}>{labels[value] ?? value}</span>;
}

function TicketForm({ editingId, form, saving, setForm, startCreate, submitTicket }) {
    return (
        <form className="rounded-md border border-slate-200 bg-white p-4 shadow-sm" onSubmit={submitTicket}>
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h2 className="text-base font-semibold">{editingId ? 'Edit Ticket' : 'Log Service Ticket'}</h2>
                </div>
                {editingId && <button className="text-sm font-semibold text-cyan-700" onClick={() => startCreate()} type="button">New</button>}
            </div>
            <div className="grid gap-3">
                <Field form={form} label="Issue Title" name="title" required setForm={setForm} />
                <label className="grid gap-1 text-sm font-medium text-slate-700">
                    Description
                    <textarea className="min-h-24 rounded-md border border-slate-300 px-3 py-2 text-sm font-normal" onChange={(event) => setForm({ ...form, description: event.target.value })} required value={form.description} />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                    <Field form={form} label="Client Contact" name="requester_name" required setForm={setForm} />
                    <Field form={form} label="Email" name="requester_email" required setForm={setForm} type="email" />
                    <Field form={form} label="Assigned Team" name="assignee_name" setForm={setForm} />
                    <Field form={form} label="Client / Department" name="department" setForm={setForm} />
                    <Select form={form} label="Service Line" name="category" options={Object.fromEntries(serviceCategories.map((item) => [item.name, item.name]))} setForm={setForm} />
                    <Field form={form} label="Due Date" name="due_date" setForm={setForm} type="date" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                    <Select form={form} label="Priority" name="priority" options={priorityLabels} setForm={setForm} />
                    <Select form={form} label="Status" name="status" options={statusLabels} setForm={setForm} />
                </div>
                <button className="mt-1 rounded-md bg-[#07172b] px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60" disabled={saving} type="submit">
                    {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Ticket'}
                </button>
            </div>
        </form>
    );
}

function Field({ form, label, name, required = false, setForm, type = 'text' }) {
    const value = form[name];

    function updateValue(nextValue) {
        setForm({ ...form, [name]: type === 'date' ? normalizeDateInput(nextValue) : nextValue });
    }

    return (
        <label className="grid gap-1 text-sm font-medium text-slate-700">
            {label}
            <input
                className="h-10 rounded-md border border-slate-300 px-3 text-sm font-normal"
                max={type === 'date' ? '9999-12-31' : undefined}
                min={type === 'date' ? '1900-01-01' : undefined}
                onChange={(event) => updateValue(event.target.value)}
                onInput={(event) => {
                    if (type === 'date') {
                        event.currentTarget.value = normalizeDateInput(event.currentTarget.value);
                    }
                }}
                required={required}
                type={type}
                value={value}
            />
        </label>
    );
}

function Select({ form, label, name, options, setForm }) {
    return (
        <label className="grid gap-1 text-sm font-medium text-slate-700">
            {label}
            <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-normal" onChange={(event) => setForm({ ...form, [name]: event.target.value })} value={form[name]}>
                {Object.entries(options).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
        </label>
    );
}

function TicketDetails({ addComment, comment, selected, setComment }) {
    if (!selected) {
        return <section className="rounded-md border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">Select a ticket to view service details and activity.</section>;
    }

    const sla = slaState(selected);

    return (
        <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold text-cyan-700">{selected.ticket_number}</p>
                    <h2 className="mt-1 text-lg font-semibold">{selected.title}</h2>
                </div>
                <Badge labels={statusLabels} value={selected.status} />
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{selected.description}</p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <Info label="Client Contact" value={selected.requester_name} />
                <Info label="Email" value={selected.requester_email} />
                <Info label="Assigned Team" value={selected.assignee_name || 'Unassigned'} />
                <Info label="Service Line" value={selected.category} />
                <Info label="Client / Dept" value={selected.department || 'Not specified'} />
                <Info label="SLA" value={sla.label} valueClass={sla.className} />
            </dl>

            <form className="mt-5 border-t border-slate-200 pt-4" onSubmit={addComment}>
                <label className="grid gap-1 text-sm font-medium text-slate-700">
                    Add Activity
                    <textarea className="min-h-20 rounded-md border border-slate-300 px-3 py-2 text-sm font-normal" onChange={(event) => setComment({ ...comment, body: event.target.value })} placeholder="Write the next support update" value={comment.body} />
                </label>
                <button className="mt-2 inline-flex items-center gap-2 rounded-md bg-cyan-600 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-700" type="submit">
                    <MessageSquare size={15} /> Add Update
                </button>
            </form>

            <div className="mt-5 space-y-3">
                {(selected.comments ?? []).map((item) => (
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-3" key={item.id}>
                        <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
                            <span className="font-semibold text-slate-700">{item.author_name}</span>
                            <span>{new Date(item.created_at).toLocaleString()}</span>
                        </div>
                        <p className="mt-1 text-sm text-slate-700">{item.body}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}

function Info({ label, value, valueClass = 'text-slate-800' }) {
    return (
        <div>
            <dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt>
            <dd className={`mt-1 font-medium ${valueClass}`}>{value}</dd>
        </div>
    );
}

function StatusLine({ label, value }) {
    return (
        <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            <span className="font-medium text-slate-600">{label}</span>
            <span className="font-semibold text-emerald-700">{value}</span>
        </div>
    );
}
