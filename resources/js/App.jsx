import {
    Activity,
    AlertTriangle,
    Building2,
    CheckCircle2,
    CircuitBoard,
    Clock3,
    Database,
    Globe2,
    LayoutDashboard,
    LifeBuoy,
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
    { name: 'Domain Hosting', icon: Globe2, tone: 'text-cyan-700', bg: 'bg-cyan-50' },
    { name: 'Email Support', icon: Server, tone: 'text-blue-700', bg: 'bg-blue-50' },
    { name: 'ISP / VSAT', icon: Network, tone: 'text-emerald-700', bg: 'bg-emerald-50' },
    { name: 'AI CCTV Security', icon: ShieldCheck, tone: 'text-violet-700', bg: 'bg-violet-50' },
    { name: 'Document Management', icon: Database, tone: 'text-amber-700', bg: 'bg-amber-50' },
    { name: 'Software Engineering', icon: CircuitBoard, tone: 'text-slate-700', bg: 'bg-slate-100' },
];

const serviceStatus = [
    { label: 'Hosting Cluster', value: 'Operational', tone: 'text-emerald-700' },
    { label: 'Mail Security', value: 'Monitoring', tone: 'text-cyan-700' },
    { label: 'Fiber / VSAT', value: 'Degraded', tone: 'text-amber-700' },
];

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

function slaState(ticket) {
    if (!ticket?.due_date || ['resolved', 'closed'].includes(ticket.status)) {
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
        throw new Error(payload.message ?? 'Request failed.');
    }

    return response.json();
}

export default function App() {
    const [dashboard, setDashboard] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [selected, setSelected] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [comment, setComment] = useState({ author_name: 'Nextgen Support', body: '' });
    const [filters, setFilters] = useState({ search: '', status: 'all', priority: 'all' });
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const query = useMemo(() => new URLSearchParams(filters).toString(), [filters]);
    const categoryCounts = useMemo(() => {
        return serviceCategories.map((category) => ({
            ...category,
            total: tickets.filter((ticket) => ticket.category === category.name).length,
        }));
    }, [tickets]);

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

    function startCreate() {
        setEditingId(null);
        setForm(emptyForm);
    }

    function startEdit(ticket) {
        setEditingId(ticket.id);
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

        const created = await api(`/tickets/${selected.id}/comments`, {
            method: 'POST',
            body: JSON.stringify(comment),
        });

        setSelected({ ...selected, comments: [created, ...(selected.comments ?? [])] });
        setComment({ ...comment, body: '' });
    }

    const metrics = [
        { label: 'Active Tickets', value: (dashboard?.open ?? 0) + (dashboard?.in_progress ?? 0) + (dashboard?.waiting ?? 0), icon: Ticket, tone: 'text-cyan-700' },
        { label: 'Urgent SLA', value: dashboard?.urgent ?? 0, icon: AlertTriangle, tone: 'text-rose-700' },
        { label: 'Overdue', value: dashboard?.overdue ?? 0, icon: Clock3, tone: 'text-amber-700' },
        { label: 'Resolved', value: dashboard?.resolved ?? 0, icon: CheckCircle2, tone: 'text-emerald-700' },
    ];

    return (
        <main className="min-h-screen overflow-x-hidden bg-[#eef4f8] text-slate-950">
            <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
                <aside className="hidden border-r border-slate-200 bg-[#07172b] text-white lg:block">
                    <div className="flex h-full flex-col">
                        <div className="px-6 py-6">
                            <div className="flex items-center gap-3">
                                <div className="grid h-11 w-11 place-items-center rounded-md bg-cyan-400 text-lg font-black text-[#07172b]">N</div>
                                <div>
                                    <div className="text-lg font-semibold">Nextgen</div>
                                    <div className="text-xs text-cyan-200">Technology Limited</div>
                                </div>
                            </div>
                        </div>
                        <nav className="space-y-1 px-3 text-sm">
                            <NavItem active icon={LayoutDashboard} label="Command Center" />
                            <NavItem icon={Ticket} label="Tickets" />
                            <NavItem icon={Building2} label="Clients" />
                            <NavItem icon={Server} label="Services" />
                            <NavItem icon={Users} label="Teams" />
                            <NavItem icon={Settings} label="Settings" />
                        </nav>
                        <div className="mt-auto border-t border-white/10 p-5">
                            <div className="rounded-md border border-cyan-300/30 bg-white/5 p-4">
                                <div className="flex items-center gap-2 text-sm font-semibold text-cyan-100">
                                    <LifeBuoy size={16} /> 24/7 Support Desk
                                </div>
                                <p className="mt-2 text-xs leading-5 text-slate-300">support@nextgenpng.net</p>
                                <p className="text-xs leading-5 text-slate-300">+675 325 2023</p>
                            </div>
                        </div>
                    </div>
                </aside>

                <section className="min-w-0">
                    <header className="border-b border-slate-200 bg-white">
                        <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 xl:flex-row xl:items-center xl:justify-between">
                            <div>
                                <h1 className="text-2xl font-semibold leading-tight text-slate-950">
                                    <span className="sm:hidden">Nextgen Support</span>
                                    <span className="hidden sm:inline">Nextgen Support Command Center</span>
                                </h1>
                                <p className="mt-1 text-sm text-slate-500">Service desk for hosting, email, network, CCTV, document, and software support.</p>
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
                                    onClick={startCreate}
                                    type="button"
                                >
                                    <Plus size={16} /> New Ticket
                                </button>
                            </div>
                        </div>
                    </header>

                    <div className="px-4 py-5 sm:px-6">
                        {error && <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}

                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            {metrics.map((metric) => {
                                const Icon = metric.icon;

                                return (
                                    <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm" key={metric.label}>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-slate-500">{metric.label}</span>
                                            <Icon className={metric.tone} size={19} />
                                        </div>
                                        <div className="mt-3 text-3xl font-semibold">{metric.value}</div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-5 grid gap-3 md:grid-cols-3">
                            {serviceStatus.map((item) => (
                                <div className="rounded-md border border-slate-200 bg-white px-4 py-3 shadow-sm" key={item.label}>
                                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                                        <span className="text-sm font-medium text-slate-600">{item.label}</span>
                                        <span className={`text-sm font-semibold ${item.tone}`}>{item.value}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1fr)_430px]">
                            <div className="min-w-0 space-y-5">
                                <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                                    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                        <div>
                                            <h2 className="text-base font-semibold">Service Queue</h2>
                                            <p className="mt-1 text-sm text-slate-500">Prioritize operational requests by SLA, service line, and client impact.</p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <SelectFilter label="Status" onChange={(value) => setFilters({ ...filters, status: value })} options={statusLabels} value={filters.status} />
                                            <SelectFilter label="Priority" onChange={(value) => setFilters({ ...filters, priority: value })} options={priorityLabels} value={filters.priority} />
                                            <button className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium hover:bg-slate-50" onClick={() => loadData()} type="button">
                                                <RefreshCw size={15} /> Refresh
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                                        {categoryCounts.map((category) => {
                                            const Icon = category.icon;

                                            return (
                                                <div className="rounded-md border border-slate-200 bg-slate-50 p-3" key={category.name}>
                                                    <div className={`grid h-9 w-9 place-items-center rounded-md ${category.bg} ${category.tone}`}><Icon size={17} /></div>
                                                    <div className="mt-3 text-lg font-semibold">{category.total}</div>
                                                    <div className="text-xs font-medium text-slate-500">{category.name}</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <TicketTable loading={loading} removeTicket={removeTicket} selected={selected} setSelected={setSelected} startEdit={startEdit} tickets={tickets} />
                            </div>

                            <aside className="space-y-5">
                                <TicketForm editingId={editingId} form={form} saving={saving} setForm={setForm} startCreate={startCreate} submitTicket={submitTicket} />
                                <TicketDetails addComment={addComment} comment={comment} selected={selected} setComment={setComment} />
                            </aside>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}

function NavItem({ active = false, icon: Icon, label }) {
    return (
        <button className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left font-medium ${active ? 'bg-cyan-400 text-[#07172b]' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`} type="button">
            <Icon size={17} /> {label}
        </button>
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

function TicketTable({ loading, removeTicket, selected, setSelected, startEdit, tickets }) {
    return (
        <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-sm">
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
                    <p className="mt-1 text-xs text-slate-500">Capture the client impact, affected service, and SLA target.</p>
                </div>
                {editingId && <button className="text-sm font-semibold text-cyan-700" onClick={startCreate} type="button">New</button>}
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
    return (
        <label className="grid gap-1 text-sm font-medium text-slate-700">
            {label}
            <input className="h-10 rounded-md border border-slate-300 px-3 text-sm font-normal" onChange={(event) => setForm({ ...form, [name]: event.target.value })} required={required} type={type} value={form[name]} />
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
