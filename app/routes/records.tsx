import { apiFetch } from "../api";
import React from "react";
import { Link } from "react-router";
import Pagination from "~/components/pagination";
import ViewVisit from "~/components/viewVisit";
import { VisitOutcomeDialog } from "~/components/visitoutcome";
import { STAFF_ROLE_NAME } from "../roles";
import { DEPARTMENTS, STAGES, describeLevel } from "../school";
import { DISPOSITIONS, DISPOSITION_SHORT, DISPOSITION_TONES, localDateTime, visitDateParts } from "../visitOutcomes";

interface VisitRow {
    visit_id: number
    visit_datetime: string
    patient_id: number
    patient_name: string
    student_id?: string | null
    department?: string | null
    level?: number | null
    strand?: string | null
    service_name?: string | null
    complaint?: string | null
    disposition?: string | null
    referred_to?: string | null
    time_in?: string | null
    time_out?: string | null
    staff_name?: string | null
}

interface SearchResult {
    visits: VisitRow[]
    total: number
    stats: { today: number; this_week: number; in_clinic: number; left_school_today: number }
    services: { service_id: number; service_name: string }[]
    staff: { staff_id: number; staff_name: string }[]
}

type SortKey = "date" | "patient" | "outcome"

const EMPTY: SearchResult = {
    visits: [], total: 0, stats: { today: 0, this_week: 0, in_clinic: 0, left_school_today: 0 }, services: [], staff: [],
}
const PAGE_SIZE = 20

const today = () => localDateTime().slice(0, 10)
function daysAgo(n: number) {
    const d = new Date()
    d.setDate(d.getDate() - n)
    return localDateTime(d).slice(0, 10)
}
function weekStart() {
    const d = new Date()
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    return localDateTime(d).slice(0, 10)
}
function monthStart() {
    return `${today().slice(0, 7)}-01`
}

const RANGES: { key: string; label: string; from: () => string; to: () => string }[] = [
    { key: "today", label: "Today", from: today, to: today },
    { key: "week", label: "This week", from: weekStart, to: today },
    { key: "month", label: "This month", from: monthStart, to: today },
    { key: "30", label: "Last 30 days", from: () => daysAgo(29), to: today },
    { key: "all", label: "All time", from: () => "", to: () => "" },
]

export default function Records() {
    const isClinician = (typeof window !== "undefined" ? localStorage.getItem("role") : null) !== STAFF_ROLE_NAME
    const [view, setView] = React.useState<"list" | "daily">("list")

    return (
        <div className="min-h-full font-sans text-sage-900">
            <style>{PRINT_CSS}</style>
            <div className="no-print mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="m-0 text-[2rem] font-semibold tracking-tight">Visit Records</h1>
                    <p className="m-0 mt-1 text-sm text-sage-500">Every clinic visit, how it ended, and who was seen.</p>
                </div>
                <div role="tablist" aria-label="View" className="inline-flex self-start rounded-xl border border-sage-200 bg-sage-50 p-1">
                    {([["list", "All visits"], ["daily", "Daily log"]] as const).map(([key, label]) => (
                        <button key={key} role="tab" type="button" aria-selected={view === key} onClick={() => setView(key)}
                            className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${view === key ? "bg-white text-sage-900 shadow-sm" : "text-sage-500 hover:text-sage-800"}`}>
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {view === "list" ? <VisitList isClinician={isClinician} /> : <DailyLog />}
        </div>
    )
}

function VisitList({ isClinician }: { isClinician: boolean }) {
    const [searchTerm, setSearchTerm] = React.useState("")
    const [query, setQuery] = React.useState("")
    // All time by default: a quiet clinic can go weeks without a visit, and an empty
    // "this month" list reads as if the records were gone.
    const [range, setRange] = React.useState("all")
    const [dateFrom, setDateFrom] = React.useState("")
    const [dateTo, setDateTo] = React.useState("")
    const [filters, setFilters] = React.useState({ outcome: "", service_id: "", staff_id: "", department: "", stage: "" })
    const [sort, setSort] = React.useState<{ key: SortKey; direction: "asc" | "desc" }>({ key: "date", direction: "desc" })
    const [page, setPage] = React.useState(1)
    const [result, setResult] = React.useState<SearchResult>(EMPTY)
    const [loading, setLoading] = React.useState(false)
    const [reloadKey, setReloadKey] = React.useState(0)
    const [viewing, setViewing] = React.useState<number | null>(null)
    const [closing, setClosing] = React.useState<any>(null)

    React.useEffect(() => {
        const timer = setTimeout(() => { setQuery(searchTerm); setPage(1) }, 250)
        return () => clearTimeout(timer)
    }, [searchTerm])

    const params = React.useMemo(() => {
        const p = new URLSearchParams({ q: query, sort: sort.key, direction: sort.direction })
        if (dateFrom) p.set("date_from", dateFrom)
        if (dateTo) p.set("date_to", dateTo)
        for (const [key, value] of Object.entries(filters)) if (value) p.set(key, value)
        return p
    }, [query, sort, dateFrom, dateTo, filters])

    React.useEffect(() => {
        let stale = false
        setLoading(true)
        const p = new URLSearchParams(params)
        p.set("page", String(page))
        p.set("page_size", String(PAGE_SIZE))
        apiFetch(`/searchvisits?${p}`)
            .then(res => res.json())
            .then(data => {
                if (stale) return
                setResult(data && Array.isArray(data.visits) ? data : EMPTY)
                setLoading(false)
            })
        return () => { stale = true }
    }, [params, page, reloadKey])

    function chooseRange(key: string) {
        const chosen = RANGES.find(r => r.key === key)
        setRange(key)
        if (chosen) { setDateFrom(chosen.from()); setDateTo(chosen.to()) }
        setPage(1)
    }

    function updateFilter(key: keyof typeof filters, value: string) {
        setFilters(current => ({ ...current, [key]: value, ...(key === "department" && value ? { stage: "" } : {}), ...(key === "stage" && value ? { department: "" } : {}) }))
        setPage(1)
    }

    function toggleSort(key: SortKey) {
        setSort(current => current.key === key
            ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
            : { key, direction: key === "date" ? "desc" : "asc" })
        setPage(1)
    }

    async function openClose(visitId: number) {
        const visit = await apiFetch(`/getvisit?idnum=${visitId}`).then(res => res.json())
        if (visit?.visit_id) setClosing(visit)
    }

    async function exportCsv() {
        const response = await apiFetch(`/download/visits?${params}`)
        if (!response.ok) return
        const url = URL.createObjectURL(await response.blob())
        const link = document.createElement("a")
        link.href = url
        link.download = `visits${dateFrom ? `-${dateFrom}` : ""}${dateTo ? `-to-${dateTo}` : ""}.csv`
        link.click()
        URL.revokeObjectURL(url)
    }

    const activeFilters = Object.values(filters).filter(Boolean).length + (query ? 1 : 0)
    const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE))

    return (
        <>
            {viewing !== null && <ViewVisit visitId={viewing} hideForm={() => setViewing(null)} />}
            {closing && (
                <VisitOutcomeDialog
                    visit={closing}
                    onClose={() => setClosing(null)}
                    onDone={() => { setClosing(null); setReloadKey(k => k + 1) }}
                />
            )}

            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard icon="bi-calendar-check" value={result.stats.today} label="Visits today" />
                <StatCard icon="bi-calendar-week" value={result.stats.this_week} label="Visits this week" />
                <StatCard icon="bi-hospital" value={result.stats.in_clinic} label="In the clinic now" tone="emerald"
                    onClick={() => { chooseRange("all"); updateFilter("outcome", "in_clinic") }} />
                <StatCard icon="bi-box-arrow-right" value={result.stats.left_school_today} label="Sent home or referred today" tone="amber" />
            </div>

            <div className="overflow-hidden rounded-2xl border border-sage-200 bg-white shadow-card">
                <div className="flex flex-col gap-3 border-b border-sage-100 px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div role="group" aria-label="Date range" className="flex flex-wrap items-center gap-1.5">
                            {RANGES.map(r => (
                                <button key={r.key} type="button" aria-pressed={range === r.key} onClick={() => chooseRange(r.key)}
                                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${range === r.key ? "border-brand-300 bg-brand-50 text-brand-900" : "border-sage-200 text-sage-600 hover:bg-sage-50"}`}>
                                    {r.label}
                                </button>
                            ))}
                            <label className="ml-1 inline-flex items-center gap-1.5 text-xs text-sage-500">
                                From
                                <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setRange("custom"); setPage(1) }}
                                    className="rounded-lg border border-sage-200 px-2 py-1 text-xs" />
                            </label>
                            <label className="inline-flex items-center gap-1.5 text-xs text-sage-500">
                                to
                                <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setRange("custom"); setPage(1) }}
                                    className="rounded-lg border border-sage-200 px-2 py-1 text-xs" />
                            </label>
                        </div>
                        {isClinician && (
                            <button type="button" onClick={exportCsv}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-sage-200 px-3 py-1.5 text-xs font-medium text-sage-700 hover:bg-sage-50">
                                <i className="bi bi-download" aria-hidden="true" /> Export CSV
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <label className="flex w-full items-center gap-2 rounded-full border border-sage-200 bg-sage-50 px-3.5 py-1.5 text-sage-400 focus-within:border-brand-300 sm:w-72">
                            <i className="bi bi-search text-sm" aria-hidden="true" />
                            <span className="sr-only">Search visits</span>
                            <input type="text" placeholder="Patient, student ID, complaint or #visit" value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full border-none bg-transparent text-sm text-sage-900 outline-none placeholder:text-sage-400" />
                        </label>
                        <Select label="Outcome" value={filters.outcome} onChange={v => updateFilter("outcome", v)}
                            options={[["", "Any outcome"], ["in_clinic", "Still in the clinic"], ...Object.entries(DISPOSITIONS), ["unrecorded", "Not recorded"]]} />
                        <Select label="Service" value={filters.service_id} onChange={v => updateFilter("service_id", v)}
                            options={[["", "Any service"], ...result.services.map(s => [String(s.service_id), s.service_name] as [string, string])]} />
                        <Select label="Attending" value={filters.staff_id} onChange={v => updateFilter("staff_id", v)}
                            options={[["", "Anyone attending"], ...result.staff.map(s => [String(s.staff_id), s.staff_name] as [string, string])]} />
                        <Select label="Department" value={filters.department} onChange={v => updateFilter("department", v)}
                            options={[["", "All departments"], ...DEPARTMENTS.map(d => [d, d] as [string, string])]} />
                        <Select label="Basic Education stage" value={filters.stage} onChange={v => updateFilter("stage", v)}
                            options={[["", "All stages"], ...Object.entries(STAGES).map(([key, s]) => [key, s.label] as [string, string])]} />
                        {activeFilters > 0 && (
                            <button type="button" className="text-xs font-medium text-brand-800 hover:underline"
                                onClick={() => { setFilters({ outcome: "", service_id: "", staff_id: "", department: "", stage: "" }); setSearchTerm(""); setPage(1) }}>
                                Clear filters
                            </button>
                        )}
                    </div>
                    <p className="m-0 text-xs text-sage-400" aria-live="polite">
                        {loading ? "Loading..." : `${result.total} visit${result.total === 1 ? "" : "s"}`}
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-sage-50/60">
                                <SortHeader label="Date" sortKey="date" sort={sort} onSort={toggleSort} />
                                <SortHeader label="Patient" sortKey="patient" sort={sort} onSort={toggleSort} />
                                <th className="border-b border-sage-100 px-5 py-3 text-left text-xs font-medium text-sage-400">Reason</th>
                                <SortHeader label="Outcome" sortKey="outcome" sort={sort} onSort={toggleSort} />
                                <th className="border-b border-sage-100 px-5 py-3 text-left text-xs font-medium text-sage-400">Attending</th>
                                <th className="border-b border-sage-100 px-5 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {result.visits.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-12 text-center">
                                        <i className="bi bi-clipboard-x text-2xl text-sage-300" aria-hidden="true" />
                                        <p className="m-0 mt-2 text-sm text-sage-400">
                                            {loading ? "Loading..." : (dateFrom || dateTo) ? "No visits in these dates." : "No visits match these filters."}
                                        </p>
                                        {!loading && (dateFrom || dateTo) && (
                                            <button type="button" onClick={() => chooseRange("all")}
                                                className="mt-2 text-sm font-medium text-brand-800 hover:underline">
                                                Show all dates
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ) : result.visits.map(visit => {
                                const when = visitDateParts(visit.visit_datetime)
                                return (
                                    <tr key={visit.visit_id} className="align-top transition hover:bg-brand-50/30">
                                        <td className="whitespace-nowrap border-b border-sage-100 px-5 py-3 text-sm">
                                            <span className="block font-medium">{when.date}</span>
                                            <span className="block text-xs text-sage-400">{when.time} · #{visit.visit_id}</span>
                                        </td>
                                        <td className="border-b border-sage-100 px-5 py-3 text-sm">
                                            <Link to={`/patientdetails/${visit.patient_id}`} className="font-medium text-sage-900 no-underline hover:underline">
                                                {visit.patient_name || "Unnamed patient"}
                                            </Link>
                                            <span className="block text-xs text-sage-400">
                                                {[visit.student_id, describeLevel(visit.department, visit.level, visit.strand, true)].filter(Boolean).join(" · ")}
                                            </span>
                                        </td>
                                        <td className="border-b border-sage-100 px-5 py-3 text-sm">
                                            <span className="block">{visit.complaint || <span className="text-sage-400">No complaint recorded</span>}</span>
                                            <span className="block text-xs text-sage-400">{visit.service_name}</span>
                                        </td>
                                        <td className="border-b border-sage-100 px-5 py-3 text-sm">
                                            <Outcome visit={visit} canClose={isClinician} onClose={() => openClose(visit.visit_id)} />
                                        </td>
                                        <td className="border-b border-sage-100 px-5 py-3 text-sm text-sage-600">{visit.staff_name}</td>
                                        <td className="border-b border-sage-100 px-5 py-3 text-right">
                                            <button type="button" onClick={() => setViewing(visit.visit_id)}
                                                className="rounded-lg bg-sage-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-sage-700">
                                                View<span className="sr-only"> visit #{visit.visit_id}</span>
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
        </>
    )
}

/** One day's visits in time order, grouped by hour, ready to print as the clinic logbook. */
function DailyLog() {
    const [day, setDay] = React.useState(today())
    const [visits, setVisits] = React.useState<VisitRow[]>([])
    const [total, setTotal] = React.useState(0)
    const [viewing, setViewing] = React.useState<number | null>(null)

    React.useEffect(() => {
        let stale = false
        const p = new URLSearchParams({ date_from: day, date_to: day, sort: "date", direction: "asc", page_size: "200" })
        apiFetch(`/searchvisits?${p}`).then(res => res.json()).then(data => {
            if (stale) return
            setVisits(Array.isArray(data?.visits) ? data.visits : [])
            setTotal(data?.total ?? 0)
        })
        return () => { stale = true }
    }, [day])

    const byHour = new Map<string, VisitRow[]>()
    for (const visit of visits) {
        const hour = visitDateParts(visit.visit_datetime).time.slice(0, 2) || "--"
        byHour.set(hour, [...(byHour.get(hour) ?? []), visit])
    }
    const counts = Object.keys(DISPOSITIONS).map(key => [key, visits.filter(v => v.disposition === key).length] as const)
    const open = visits.filter(v => !v.disposition && v.time_in && !v.time_out).length

    return (
        <section className="rounded-2xl border border-sage-200 bg-white p-6 shadow-card print:border-0 print:p-0 print:shadow-none" aria-labelledby="daily-heading">
            {viewing !== null && <ViewVisit visitId={viewing} hideForm={() => setViewing(null)} />}
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                    <p className="m-0 text-xs font-semibold uppercase tracking-wide text-brand-800">Clinic daily log</p>
                    <h2 id="daily-heading" className="m-0 mt-1 text-xl font-semibold">{visitDateParts(day).date}</h2>
                    <p className="m-0 mt-1 text-sm text-sage-500">
                        {total} visit{total === 1 ? "" : "s"}
                        {counts.filter(([, n]) => n).map(([key, n]) => ` · ${n} ${DISPOSITION_SHORT[key].toLowerCase()}`).join("")}
                        {open ? ` · ${open} still in the clinic` : ""}
                    </p>
                </div>
                <div className="no-print flex items-center gap-2">
                    <label className="text-sm text-sage-600">
                        <span className="sr-only">Day</span>
                        <input type="date" value={day} max={today()} onChange={(e) => e.target.value && setDay(e.target.value)}
                            className="rounded-lg border border-sage-200 px-2.5 py-1.5 text-sm" />
                    </label>
                    <button type="button" onClick={() => window.print()}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-800 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-900">
                        <i className="bi bi-printer" aria-hidden="true" /> Print
                    </button>
                </div>
            </div>

            {visits.length === 0 ? (
                <p className="m-0 text-sm text-sage-400">No visits on this day.</p>
            ) : (
                <table className="w-full border-collapse text-sm">
                    <thead>
                        <tr className="border-b border-sage-200 text-left text-xs text-sage-500">
                            <th className="py-2 pr-3 font-medium">Time</th>
                            <th className="py-2 pr-3 font-medium">Patient</th>
                            <th className="py-2 pr-3 font-medium">Complaint</th>
                            <th className="py-2 pr-3 font-medium">Outcome</th>
                            <th className="py-2 pr-3 font-medium">Out</th>
                            <th className="py-2 font-medium">Attending</th>
                        </tr>
                    </thead>
                    {[...byHour.entries()].map(([hour, rows]) => (
                        <tbody key={hour}>
                            <tr><th colSpan={6} className="bg-sage-50 px-2 py-1 text-left text-xs font-semibold text-sage-500">{hour}:00</th></tr>
                            {rows.map(visit => (
                                <tr key={visit.visit_id} className="border-b border-sage-100 align-top">
                                    <td className="py-2 pr-3 tabular-nums">{visitDateParts(visit.visit_datetime).time}</td>
                                    <td className="py-2 pr-3">
                                        <button type="button" onClick={() => setViewing(visit.visit_id)} className="text-left font-medium text-sage-900 hover:underline print:no-underline">
                                            {visit.patient_name}
                                        </button>
                                        <span className="block text-xs text-sage-400">{describeLevel(visit.department, visit.level, visit.strand, true)}</span>
                                    </td>
                                    <td className="py-2 pr-3">{visit.complaint || visit.service_name}</td>
                                    <td className="py-2 pr-3">
                                        {visit.disposition ? `${DISPOSITIONS[visit.disposition]}${visit.referred_to ? ` (${visit.referred_to})` : ""}` : visit.time_in ? "In clinic" : "-"}
                                    </td>
                                    <td className="py-2 pr-3 tabular-nums">{visit.time_out ? visitDateParts(visit.time_out).time : ""}</td>
                                    <td className="py-2">{visit.staff_name}</td>
                                </tr>
                            ))}
                        </tbody>
                    ))}
                </table>
            )}
        </section>
    )
}

function Outcome({ visit, canClose, onClose }: { visit: VisitRow; canClose: boolean; onClose: () => void }) {
    if (!visit.disposition) {
        if (!visit.time_in) return <span className="text-xs text-sage-400">Not recorded</span>
        return (
            <span className="inline-flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" /> In clinic
                </span>
                {canClose && <button type="button" onClick={onClose} className="text-xs font-semibold text-brand-800 underline">Close visit</button>}
            </span>
        )
    }
    return (
        <span className="inline-flex flex-col gap-0.5">
            <span title={DISPOSITIONS[visit.disposition]}
                className={`inline-flex w-fit whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${DISPOSITION_TONES[visit.disposition] || ""}`}>
                {DISPOSITION_SHORT[visit.disposition] || visit.disposition}
            </span>
            {visit.referred_to && <span className="text-xs text-sage-500">{visit.referred_to}</span>}
        </span>
    )
}

function SortHeader({ label, sortKey, sort, onSort }: {
    label: string; sortKey: SortKey; sort: { key: SortKey; direction: "asc" | "desc" }; onSort: (key: SortKey) => void
}) {
    const active = sort.key === sortKey
    return (
        <th aria-sort={active ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}
            className="border-b border-sage-100 px-5 py-3 text-left text-xs font-medium text-sage-400">
            <button type="button" onClick={() => onSort(sortKey)} className="inline-flex items-center gap-1 hover:text-sage-700">
                {label}
                <i aria-hidden="true" className={`bi ${active ? (sort.direction === "asc" ? "bi-caret-up-fill" : "bi-caret-down-fill") : "bi-chevron-expand"} text-[10px]`} />
            </button>
        </th>
    )
}

function Select({ label, value, onChange, options }: {
    label: string; value: string; onChange: (value: string) => void; options: [string, string][]
}) {
    return (
        <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}
            className={`rounded-full border px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-brand-100 ${value ? "border-brand-300 bg-brand-50 text-brand-900" : "border-sage-200 bg-white text-sage-600"}`}>
            {options.map(([optionValue, text]) => <option key={optionValue} value={optionValue}>{text}</option>)}
        </select>
    )
}

function StatCard({ icon, value, label, tone, onClick }: {
    icon: string; value: number; label: string; tone?: "emerald" | "amber"; onClick?: () => void
}) {
    const iconTone = tone === "emerald" ? "bg-emerald-50 text-emerald-700" : tone === "amber" ? "bg-amber-50 text-amber-800" : "bg-brand-50 text-brand-800"
    const body = (
        <>
            <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-lg ${iconTone}`}>
                <i className={`bi ${icon}`} aria-hidden="true" />
            </div>
            <div className="text-left">
                <div className="text-xl font-bold leading-none">{value}</div>
                <div className="mt-1 text-xs text-sage-400">{label}</div>
            </div>
        </>
    )
    const base = "flex items-center gap-3.5 rounded-2xl border border-sage-200 bg-white p-4 shadow-card"
    return onClick
        ? <button type="button" onClick={onClick} className={`${base} transition hover:border-brand-300`}>{body}</button>
        : <div className={base}>{body}</div>
}

// Printing the daily log: just the log, no sidebar or controls.
const PRINT_CSS = `
@media print {
  nav, .no-print { display: none !important; }
  #main-content, #main-content > div { overflow: visible !important; height: auto !important; padding: 0 !important; }
  body { background: #fff !important; }
  @page { margin: 14mm; }
}
`
