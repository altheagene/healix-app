import { apiFetch } from "../api";
import React from "react";
import { Link, useNavigate } from "react-router";
import Pagination, { usePageSize } from "~/components/pagination";
import ViewVisit from "~/components/viewVisit";
import RowActions, { inlineActionClass, rowLinkClass } from "~/components/rowactions";
import { VisitOutcomeDialog } from "~/components/visitoutcome";
import { STAFF_ROLE_NAME } from "../roles";
import { describeLevel } from "../school";
import { downloadPdf } from "../pdf";
import PdfButton from "~/components/pdfbutton";
import { DateRangeSelect, FilterBar, PanelSelect, QuickSelect, gradeLabel, gradeOptions, gradeValue, parseGrade, useUrlFilters, type FilterChip } from "~/components/filterbar";
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

// Enough for months of visits; past this, a PDF is too long to be read anyway.
const PDF_LIMIT = 2000

function outcomeText(visit: VisitRow) {
    if (visit.disposition) return `${DISPOSITIONS[visit.disposition] || visit.disposition}${visit.referred_to ? ` (${visit.referred_to})` : ""}`
    return visit.time_in && !visit.time_out ? "Still in the clinic" : "Not recorded"
}

const NO_FILTERS = { range: "all", from: "", to: "", outcome: "", service_id: "", staff_id: "", department: "", stage: "" }

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
    const navigate = useNavigate()
    const [searchTerm, setSearchTerm] = React.useState("")
    const [query, setQuery] = React.useState("")
    // All time by default: a quiet clinic can go weeks without a visit, and an empty
    // "this month" list reads as if the records were gone.
    // Kept in the address, so Back from a visit returns to the same filtered list.
    const [filters, setFilters] = useUrlFilters(NO_FILTERS)
    const preset = RANGES.find(r => r.key === filters.range)
    const dateFrom = preset ? preset.from() : filters.from
    const dateTo = preset ? preset.to() : filters.to
    const [sort, setSort] = React.useState<{ key: SortKey; direction: "asc" | "desc" }>({ key: "date", direction: "desc" })
    const [page, setPage] = React.useState(1)
    const [pageSize, setPageSize] = usePageSize("visits")
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
        for (const key of ["outcome", "service_id", "staff_id", "department", "stage"] as const) {
            if (filters[key]) p.set(key, filters[key])
        }
        return p
    }, [query, sort, dateFrom, dateTo, filters])

    React.useEffect(() => {
        let stale = false
        setLoading(true)
        const p = new URLSearchParams(params)
        p.set("page", String(page))
        p.set("page_size", String(pageSize))
        apiFetch(`/searchvisits?${p}`)
            .then(res => res.json())
            .then(data => {
                if (stale) return
                setResult(data && Array.isArray(data.visits) ? data : EMPTY)
                setLoading(false)
            })
        return () => { stale = true }
    }, [params, page, pageSize, reloadKey])

    function change(next: Partial<typeof NO_FILTERS>) {
        setFilters({ ...filters, ...next })
        setPage(1)
    }
    const chooseRange = (key: string) => change({ range: key, from: "", to: "" })
    const updateFilter = (key: "outcome" | "service_id" | "staff_id", value: string) => change({ [key]: value })

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

    /** Every visit the current search and filters match, as a PDF (up to PDF_LIMIT). */
    async function exportPdf() {
        const rows: VisitRow[] = []
        for (let page = 1; rows.length < PDF_LIMIT; page++) {
            const p = new URLSearchParams(params)
            p.set("page", String(page))
            p.set("page_size", "200")
            const data = await apiFetch(`/searchvisits?${p}`).then(res => res.json())
            const batch: VisitRow[] = Array.isArray(data?.visits) ? data.visits : []
            rows.push(...batch)
            if (batch.length < 200 || rows.length >= (data?.total ?? 0)) break
        }
        const shown = rows.slice(0, PDF_LIMIT)
        const period = dateFrom || dateTo
            ? `${dateFrom ? visitDateParts(dateFrom).date : "The start"} – ${dateTo ? visitDateParts(dateTo).date : "today"}`
            : "All dates"
        const left = shown.filter(v => v.disposition === "sent_home" || v.disposition === "referred" || v.disposition === "emergency").length
        await downloadPdf({
            title: "Visit records",
            subtitle: period,
            landscape: true,
            filename: `visits${dateFrom ? `-${dateFrom}` : ""}${dateTo ? `-to-${dateTo}` : ""}.pdf`,
            summary: [
                ["Visits", result.total],
                ["Students and others seen", new Set(shown.map(v => v.patient_id)).size],
                ["Sent home, referred or emergency", left],
                ["Still in the clinic", shown.filter(v => !v.disposition && v.time_in && !v.time_out).length],
            ],
            notes: [
                ...(chips.length || query ? [`Filtered by: ${[query && `search "${query}"`, ...chips.map(c => c.label)].filter(Boolean).join(", ")}`] : []),
                ...(result.total > PDF_LIMIT ? [`Showing the first ${PDF_LIMIT} of ${result.total} visits. Narrow the dates to include the rest.`] : []),
            ],
            tables: [{
                title: "Visits",
                columns: ["Date", "Time", "Patient", "Student ID", "Grade or college", "Complaint", "Outcome", "Attending"],
                rows: shown.map(v => [
                    visitDateParts(v.visit_datetime).date, visitDateParts(v.visit_datetime).time, v.patient_name, v.student_id,
                    describeLevel(v.department, v.level, v.strand, true), v.complaint || v.service_name, outcomeText(v), v.staff_name,
                ]),
                empty: "No visits match these filters.",
            }],
        })
    }

    const outcomes: [string, string][] = [["", "Any outcome"], ["in_clinic", "Still in the clinic"], ...Object.entries(DISPOSITIONS), ["unrecorded", "Not recorded"]]
    const services: [string, string][] = [["", "Any service"], ...result.services.map(s => [String(s.service_id), s.service_name] as [string, string])]
    const staffChoices: [string, string][] = [["", "Anyone attending"], ...result.staff.map(s => [String(s.staff_id), s.staff_name] as [string, string])]
    const label = (options: [string, string][], value: string) => options.find(([key]) => key === value)?.[1] ?? value

    const chips: FilterChip[] = []
    if (filters.range !== "all") {
        const text = preset ? preset.label : [dateFrom && `From ${visitDateParts(dateFrom).date}`, dateTo && `to ${visitDateParts(dateTo).date}`].filter(Boolean).join(" ") || "Custom dates"
        chips.push({ key: "range", label: text, onRemove: () => chooseRange("all") })
    }
    if (filters.outcome) chips.push({ key: "outcome", label: label(outcomes, filters.outcome), onRemove: () => updateFilter("outcome", "") })
    if (filters.service_id) chips.push({ key: "service", label: label(services, filters.service_id), onRemove: () => updateFilter("service_id", "") })
    if (filters.staff_id) chips.push({ key: "staff", label: `Attended by ${label(staffChoices, filters.staff_id)}`, onRemove: () => updateFilter("staff_id", "") })
    if (filters.department || filters.stage) chips.push({ key: "grade", label: gradeLabel(filters.department, filters.stage), onRemove: () => change({ department: "", stage: "" }) })
    const panelCount = [filters.service_id, filters.staff_id, filters.department || filters.stage].filter(Boolean).length
    const totalPages = Math.max(1, Math.ceil(result.total / pageSize))

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
                    onClick={() => change({ range: "all", from: "", to: "", outcome: "in_clinic" })} />
                <StatCard icon="bi-box-arrow-right" value={result.stats.left_school_today} label="Sent home or referred today" tone="amber" />
            </div>

            <div className="overflow-hidden rounded-2xl border border-sage-200 bg-white shadow-card">
                <FilterBar
                    search={{ value: searchTerm, onChange: setSearchTerm, placeholder: "Patient, student ID, complaint or #visit", label: "Search visits" }}
                    quick={<>
                        <DateRangeSelect ranges={RANGES} value={{ key: filters.range, from: dateFrom, to: dateTo }}
                            onChange={v => change({ range: v.key, from: v.from, to: v.to })} />
                        <QuickSelect label="Outcome" value={filters.outcome} onChange={v => updateFilter("outcome", v)} options={outcomes} />
                    </>}
                    panelCount={panelCount}
                    panel={<>
                        <PanelSelect label="Service" value={filters.service_id} onChange={v => updateFilter("service_id", v)} options={services} />
                        <PanelSelect label="Attending" value={filters.staff_id} onChange={v => updateFilter("staff_id", v)} options={staffChoices} />
                        <PanelSelect label="Grade or department" value={gradeValue(filters.department, filters.stage)}
                            onChange={v => change(parseGrade(v))} options={gradeOptions()} />
                    </>}
                    actions={isClinician && (<>
                        <PdfButton build={exportPdf} label="PDF" />
                        <button type="button" onClick={exportCsv}
                            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-sage-200 px-3.5 text-sm font-medium text-sage-700 hover:bg-sage-50">
                            <i className="bi bi-download" aria-hidden="true" /> Export CSV
                        </button>
                    </>)}
                    chips={chips}
                    onClearAll={() => { setFilters(NO_FILTERS); setSearchTerm(""); setPage(1) }}
                    summary={loading ? "Loading…" : `${result.total} visit${result.total === 1 ? "" : "s"}`}
                />

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
                                            <button type="button" onClick={() => setViewing(visit.visit_id)} className={rowLinkClass}>
                                                {when.date}<span className="sr-only">, view visit #{visit.visit_id}</span>
                                            </button>
                                            <span className="block text-xs text-sage-400">{when.time} · #{visit.visit_id}</span>
                                        </td>
                                        <td className="border-b border-sage-100 px-5 py-3 text-sm">
                                            <Link to={`/patientdetails/${visit.patient_id}`} className={rowLinkClass}>
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
                                            <RowActions label={`Actions for visit #${visit.visit_id}`} actions={[
                                                { label: "View visit", icon: "bi-file-earmark-text", onSelect: () => setViewing(visit.visit_id) },
                                                { label: "Open patient", icon: "bi-person", onSelect: () => navigate(`/patientdetails/${visit.patient_id}`) },
                                                { label: "Close visit", icon: "bi-box-arrow-right", hidden: !isClinician || Boolean(visit.disposition) || !visit.time_in || Boolean(visit.time_out), onSelect: () => openClose(visit.visit_id) },
                                            ]} />
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} pageSize={pageSize}
                    onPageSizeChange={(size) => { setPageSize(size); setPage(1) }} totalItems={result.total} />
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

    function dailyPdf() {
        return downloadPdf({
            title: "Clinic daily log",
            subtitle: visitDateParts(day).date,
            filename: `daily-log-${day}.pdf`,
            summary: [
                ["Visits", total],
                ...counts.filter(([, n]) => n).map(([key, n]) => [DISPOSITION_SHORT[key], n] as [string, number]),
                ...(open ? [["Still in the clinic", open] as [string, number]] : []),
            ],
            tables: [{
                title: "Visits",
                columns: ["Time in", "Patient", "Grade or college", "Complaint", "Outcome", "Time out", "Attending"],
                rows: visits.map(v => [
                    visitDateParts(v.visit_datetime).time, v.patient_name, describeLevel(v.department, v.level, v.strand, true),
                    v.complaint || v.service_name, outcomeText(v), v.time_out ? visitDateParts(v.time_out).time : "", v.staff_name,
                ]),
                empty: "No visits on this day.",
            }],
        })
    }

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
                    <PdfButton build={dailyPdf} />
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
                {canClose && (
                    <button type="button" onClick={onClose} className={inlineActionClass}>
                        <i className="bi bi-box-arrow-right" aria-hidden="true" /> Close visit
                    </button>
                )}
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
