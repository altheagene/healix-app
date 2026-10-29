import { apiFetch } from "../api";
import React from "react";
import { Link, useSearchParams } from "react-router";
import { describeLevel } from "../school";
import { DISPOSITIONS, localDateTime, visitDateParts } from "../visitOutcomes";
import { withUnit } from "../inventory";
import { STAFF_ROLE_NAME } from "../roles";

interface Report {
    date_from: string
    date_to: string
    totals: {
        visits: number; students: number; days_open: number; left_school: number; parents_told: number
        repeat_students: number; previous_visits: number; units_given: number
    }
    outcomes: { outcome: string; visits: number }[]
    complaints: { complaint: string; visits: number }[]
    by_group: { group: string; visits: number }[]
    by_hour: { hour: number; visits: number }[]
    by_day: { day: string; visits: number }[]
    medicines: { supply_id: number; supply_name: string; unit?: string | null; units: number }[]
    frequent: {
        patient_id: number; patient_name: string; student_id?: string | null; department?: string | null
        level?: number | null; strand?: string | null; visits: number; last_visit: string; last_complaint?: string | null
    }[]
    stock: {
        expiring: StockBatch[]; expiring_count: number
        to_dispose: StockBatch[]; to_dispose_count: number
        reorder: { supply_id: number; supply_name: string; total_stock: number; unit?: string | null }[]; reorder_count: number
    }
}
interface StockBatch { batch_id: number; supply_id: number; supply_name: string; batch_number: string; expiration_date: string; stock_level: number; unit?: string | null }

// Outcome colours are status colours: checked with the dataviz palette validator
// (lightness, chroma, colour-blind separation). Each segment is also labelled with
// its name and count, so colour is never the only cue.
const OUTCOME_COLORS: Record<string, string> = {
    returned_to_class: "#047857",
    rested_returned: "#34b98a",
    sent_home: "#d97706",
    referred: "#0369a1",
    emergency: "#dc2626",
    in_clinic: "var(--color-sage-400)",
    unrecorded: "var(--color-sage-300)",
}
const OUTCOME_LABELS: Record<string, string> = { ...DISPOSITIONS, in_clinic: "Still in the clinic", unrecorded: "Not recorded" }
const OUTCOME_ORDER = ["returned_to_class", "rested_returned", "sent_home", "referred", "emergency", "in_clinic", "unrecorded"]
// Each chart shows one series in one hue (its bars compare amounts, not identities), and
// each chart takes a different dashboard accent so the page is not one flat green. All
// three pass 3:1 against white (dataviz palette validator); bar values are also written out.
const CHART = {
    deep: { bar: "var(--color-brand-700)", track: "var(--color-brand-50)" },
    leaf: { bar: "var(--color-leaf-600)", track: "var(--color-leaf-50)" },
    citron: { bar: "var(--color-citron-600)", track: "var(--color-citron-100)" },
}
type ChartColor = keyof typeof CHART

const iso = (d: Date) => localDateTime(d).slice(0, 10)
function periodFor(key: string): [string, string] {
    const now = new Date()
    const today = iso(now)
    if (key === "last_month") {
        return [iso(new Date(now.getFullYear(), now.getMonth() - 1, 1)), iso(new Date(now.getFullYear(), now.getMonth(), 0))]
    }
    if (key === "30") return [iso(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29)), today]
    // The Philippine school year starts in June.
    if (key === "school_year") {
        const startYear = now.getMonth() >= 5 ? now.getFullYear() : now.getFullYear() - 1
        return [`${startYear}-06-01`, today]
    }
    return [`${today.slice(0, 7)}-01`, today]
}
const PERIODS = [["this_month", "This month"], ["last_month", "Last month"], ["30", "Last 30 days"], ["school_year", "This school year"]] as const
const TABS = [["visits", "Visits", "bi-clipboard2-pulse"], ["students", "Students", "bi-people"], ["stock", "Medicine & stock", "bi-capsule"]] as const
type TabKey = typeof TABS[number][0]

/** The report's sections. Arrow keys move between tabs, as screen reader users expect. */
function ReportTabs({ tab, onChange, counts }: { tab: TabKey; onChange: (key: TabKey) => void; counts: Partial<Record<TabKey, number>> }) {
    const refs = React.useRef<(HTMLButtonElement | null)[]>([])
    function onKeyDown(event: React.KeyboardEvent, index: number) {
        const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0
        if (!step) return
        event.preventDefault()
        const next = (index + step + TABS.length) % TABS.length
        onChange(TABS[next][0])
        refs.current[next]?.focus()
    }
    return (
        // Wraps rather than scrolls, so on a phone every tab stays in view.
        <div role="tablist" aria-label="Report sections" className="no-print mb-4 flex flex-wrap gap-x-1 border-b border-sage-200">
            {TABS.map(([key, label, icon], index) => {
                const selected = tab === key
                return (
                    <button key={key} ref={el => { refs.current[index] = el }} type="button" role="tab" id={`report-tab-${key}`}
                        aria-selected={selected} aria-controls={`report-panel-${key}`} tabIndex={selected ? 0 : -1}
                        onClick={() => onChange(key)} onKeyDown={(e) => onKeyDown(e, index)}
                        className={`-mb-px inline-flex flex-shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition ${selected ? "border-brand-800 text-brand-900" : "border-transparent text-sage-500 hover:text-sage-800"}`}>
                        <i className={`bi ${icon}`} aria-hidden="true" />
                        {label}
                        {counts[key] ? (
                            <span className={`rounded-full px-1.5 text-xs ${selected ? "bg-brand-100 text-brand-900" : "bg-sage-100 text-sage-600"}`}>{counts[key]}</span>
                        ) : null}
                    </button>
                )
            })}
        </div>
    )
}

export default function Reports() {
    const [period, setPeriod] = React.useState("this_month")
    const [[dateFrom, dateTo], setRange] = React.useState<[string, string]>(() => periodFor("this_month"))
    const [report, setReport] = React.useState<Report | null>(null)
    const [error, setError] = React.useState("")
    const [isStaffRole, setIsStaffRole] = React.useState(false)
    // The tab lives in the address, so a refresh or a shared link opens the same one.
    const [searchParams, setSearchParams] = useSearchParams()
    const tab: TabKey = TABS.some(([key]) => key === searchParams.get("tab")) ? searchParams.get("tab") as TabKey : "visits"
    const chooseTab = (key: TabKey) => setSearchParams(params => { params.set("tab", key); return params }, { replace: true })

    React.useEffect(() => { setIsStaffRole(localStorage.getItem("role") === STAFF_ROLE_NAME) }, [])

    React.useEffect(() => {
        if (!dateFrom || !dateTo || dateFrom > dateTo) return
        let stale = false
        setError("")
        apiFetch(`/getclinicreport?date_from=${dateFrom}&date_to=${dateTo}`).then(async res => {
            const data = await res.json().catch(() => null)
            if (stale) return
            if (res.ok && data?.totals) setReport(data)
            else setError(data?.error || "Could not load the report.")
        })
        return () => { stale = true }
    }, [dateFrom, dateTo])

    function choose(key: string) {
        setPeriod(key)
        setRange(periodFor(key))
    }

    async function download(path: string, name: string) {
        const response = await apiFetch(path)
        if (!response.ok) return
        const url = URL.createObjectURL(await response.blob())
        const link = document.createElement("a")
        link.href = url
        link.download = name
        link.click()
        URL.revokeObjectURL(url)
    }

    if (isStaffRole) {
        return <p className="text-sm text-sage-500">Reports are for the nurse, doctor and admins.</p>
    }

    const t = report?.totals
    const range = `${visitDateParts(dateFrom).date} – ${visitDateParts(dateTo).date}`
    return (
        <div className="min-h-full font-sans text-sage-900">
            <style>{PRINT_CSS}</style>

            {/* HEADER */}
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="m-0 text-[2rem] font-semibold tracking-tight">Reports</h1>
                    <p className="m-0 mt-1 text-sm text-sage-500">Clinic activity for {range}, for the school office and the clinic's own planning.</p>
                </div>
                <div className="no-print flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => window.print()}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-sage-200 bg-white px-3 py-2 text-sm font-medium text-sage-700 hover:bg-sage-50">
                        <i className="bi bi-printer" aria-hidden="true" /> Print
                    </button>
                    <DownloadMenu onPick={(kind) => {
                        if (kind === "visits") download(`/download/visits?date_from=${dateFrom}&date_to=${dateTo}`, `visits-${dateFrom}-to-${dateTo}.csv`)
                        if (kind === "inventory") download(`/download/inventorylogs?fromdate=${dateFrom}&todate=${dateTo}`, `inventory-${dateFrom}-to-${dateTo}.csv`)
                        if (kind === "appointments") download(`/download/appointmentlogs?fromdate=${dateFrom}&todate=${dateTo}`, `appointments-${dateFrom}-to-${dateTo}.csv`)
                    }} />
                </div>
            </div>

            {/* PERIOD: one row of filters above everything it controls */}
            <div role="group" aria-label="Period" className="no-print mb-6 flex flex-wrap items-center gap-2">
                {PERIODS.map(([key, text]) => (
                    <button key={key} type="button" aria-pressed={period === key} onClick={() => choose(key)}
                        className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${period === key ? "border-brand-300 bg-brand-50 text-brand-900" : "border-sage-200 bg-white text-sage-600 hover:bg-sage-50"}`}>
                        {text}
                    </button>
                ))}
                <label className="ml-1 inline-flex items-center gap-1.5 text-xs text-sage-500">
                    From
                    <input type="date" value={dateFrom} max={dateTo} onChange={(e) => { setPeriod("custom"); setRange([e.target.value, dateTo]) }}
                        className="rounded-lg border border-sage-200 bg-white px-2 py-1 text-xs" />
                </label>
                <label className="inline-flex items-center gap-1.5 text-xs text-sage-500">
                    to
                    <input type="date" value={dateTo} min={dateFrom} onChange={(e) => { setPeriod("custom"); setRange([dateFrom, e.target.value]) }}
                        className="rounded-lg border border-sage-200 bg-white px-2 py-1 text-xs" />
                </label>
            </div>

            {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            {!report && !error && <p className="text-sm text-sage-500">Loading...</p>}

            {report && t && (
                <>
                    {/* KPI ROW */}
                    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <Kpi icon="bi-clipboard2-pulse" look="citron" value={t.visits} label="Clinic visits"
                            note={<Change now={t.visits} before={t.previous_visits} days={report.by_day.length} />} />
                        <Kpi icon="bi-people" look="leaf" value={t.students} label="Students seen"
                            note={<><Strong>{t.repeat_students}</Strong> came more than once</>} />
                        <Kpi icon="bi-box-arrow-right" look="deep" value={t.left_school} label="Sent home or referred"
                            note={t.left_school ? <>Parents told for <Strong>{t.parents_told}</Strong> of {t.left_school}</> : "No one left school"} />
                        <Kpi icon="bi-capsule" look="pale" value={t.units_given} label="Medicine units given"
                            note={<>Across <Strong>{report.medicines.length}</Strong> medicine{report.medicines.length === 1 ? "" : "s"}</>} />
                    </div>

                    {t.visits === 0 ? (
                        <Panel title="No visits">
                            <p className="m-0 text-sm text-sage-500">No clinic visits were recorded in {range}. Try a longer period.</p>
                        </Panel>
                    ) : (
                        <>
                            <ReportTabs tab={tab} onChange={chooseTab} counts={{
                                students: report.frequent.length,
                                stock: report.stock.to_dispose_count + report.stock.expiring_count + report.stock.reorder_count,
                            }} />

                            <div role="tabpanel" id={`report-panel-${tab}`} aria-labelledby={`report-tab-${tab}`}
                                className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                                {tab === "visits" && (
                                    <>
                                        <Panel title="How visits ended" icon="bi-signpost-split" chip="leaf">
                                            <OutcomeBar outcomes={report.outcomes} total={t.visits} />
                                        </Panel>
                                        <Panel title="Visits per day" icon="bi-calendar3" chip="deep" wide>
                                            <Columns busiest="Busiest day" color="deep" rows={report.by_day.map(d => ({ key: d.day, value: d.visits, tick: tickForDay(d.day, report.by_day.length), tip: visitDateParts(d.day).date }))} />
                                        </Panel>
                                        <Panel title="Busiest hours" icon="bi-clock" chip="leaf">
                                            <Columns busiest="Busiest hour" color="leaf" rows={report.by_hour.map(h => ({
                                                key: String(h.hour), value: h.visits, tip: `${hourLabel(h.hour)} to ${hourLabel(h.hour + 1)}`,
                                                // Every other hour, so the labels never run into each other on a narrow screen.
                                                tick: (h.hour - report.by_hour[0].hour) % 2 === 0 ? hourLabel(h.hour) : "",
                                            }))} />
                                        </Panel>
                                        <Panel title="Top complaints" icon="bi-thermometer-half" chip="citron" wide action={<Link to="/records" className="text-xs font-medium text-brand-800 hover:underline">View visits</Link>}>
                                            <RankBars color="citron" rows={report.complaints.map(c => ({ label: c.complaint, value: c.visits }))} unit="visit" />
                                        </Panel>
                                    </>
                                )}

                                {tab === "students" && (
                                    <>
                                        <Panel title="Students who came back most" icon="bi-arrow-repeat" chip="citron" wide>
                                            <FrequentTable rows={report.frequent} />
                                        </Panel>
                                        <Panel title="Visits by grade or college" icon="bi-mortarboard" chip="leaf">
                                            <RankBars color="leaf" rows={report.by_group.map(g => ({ label: g.group, value: g.visits }))} unit="visit" />
                                        </Panel>
                                    </>
                                )}

                                {tab === "stock" && (
                                    <>
                                        <Panel title="Medicines given" icon="bi-capsule" chip="citron">
                                            <RankBars color="citron" rows={report.medicines.map(m => ({ label: m.supply_name, value: m.units, display: withUnit(m.units, m.unit) }))} />
                                        </Panel>
                                        <Panel title="Stock to watch" icon="bi-exclamation-triangle" chip="amber" wide action={<Link to="/inventory" className="text-xs font-medium text-brand-800 hover:underline">Inventory</Link>}>
                                            <StockList stock={report.stock} />
                                        </Panel>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    )
}

function Strong({ children }: { children: React.ReactNode }) {
    return <span className="font-semibold text-current">{children}</span>
}

function Change({ now, before, days }: { now: number; before: number; days: number }) {
    if (!before) return <>No visits in the {days} days before</>
    const change = Math.round(((now - before) / before) * 100)
    if (change === 0) return <>Same as the {days} days before</>
    return (
        <>
            <span className="font-semibold text-current">
                <i className={`bi ${change > 0 ? "bi-arrow-up-short" : "bi-arrow-down-short"}`} aria-hidden="true" />
                {Math.abs(change)}% {change > 0 ? "more" : "fewer"}
            </span>{" "}than the {days} days before ({before})
        </>
    )
}

// The dashboard's card colours: lime, leaf green and deep green, plus a pale leaf.
const KPI_LOOKS = {
    citron: { card: "bg-citron-200 text-brand-900", icon: "bg-white/70 text-brand-800", muted: "text-brand-800/75", line: "border-citron-400" },
    leaf: { card: "bg-leaf-400 text-brand-900", icon: "bg-white/60 text-brand-800", muted: "text-brand-900/85", line: "border-leaf-500" },
    deep: { card: "bg-brand-800 text-white", icon: "bg-white/15 text-white", muted: "text-white/75", line: "border-white/15" },
    pale: { card: "bg-leaf-100 text-brand-900", icon: "bg-white/80 text-brand-800", muted: "text-brand-800/75", line: "border-leaf-300" },
}

function Kpi({ icon, look, value, label, note }: { icon: string; look: keyof typeof KPI_LOOKS; value: number; label: string; note: React.ReactNode }) {
    const style = KPI_LOOKS[look]
    return (
        <div className={`kpi-card rounded-[24px] p-5 shadow-card ${style.card}`}>
            <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-xl ${style.icon}`}>
                    <i className={`bi ${icon}`} aria-hidden="true" />
                </div>
                <div>
                    <div className="text-3xl font-bold leading-none tabular-nums">{value}</div>
                    <div className={`mt-1 text-xs font-medium ${style.muted}`}>{label}</div>
                </div>
            </div>
            <p className={`m-0 mt-4 border-t pt-3 text-xs ${style.line} ${style.muted}`}>{note}</p>
        </div>
    )
}

const CHIP = {
    deep: "bg-brand-800 text-white",
    leaf: "bg-leaf-400 text-brand-900",
    citron: "bg-citron-300 text-brand-900",
    amber: "bg-amber-100 text-amber-800",
}

function Panel({ title, icon, chip = "leaf", action, wide, children }: {
    title: string; icon?: string; chip?: keyof typeof CHIP; action?: React.ReactNode; wide?: boolean; children: React.ReactNode
}) {
    const id = React.useId()
    return (
        <section aria-labelledby={id} className={`rounded-2xl border border-sage-200 bg-white p-5 shadow-card ${wide ? "lg:col-span-2" : ""}`}>
            <div className="mb-4 flex items-center justify-between gap-2">
                <h2 id={id} className="m-0 flex items-center gap-2.5 text-base font-semibold">
                    {icon && (
                        <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm ${CHIP[chip]}`} aria-hidden="true">
                            <i className={`bi ${icon}`} />
                        </span>
                    )}
                    {title}
                </h2>
                <span className="no-print">{action}</span>
            </div>
            {children}
        </section>
    )
}

/** Share of visits by outcome: one 100% bar, then every outcome named with its count. */
function OutcomeBar({ outcomes, total }: { outcomes: Report["outcomes"]; total: number }) {
    const rows = OUTCOME_ORDER.map(key => ({ key, visits: outcomes.find(o => o.outcome === key)?.visits ?? 0 })).filter(r => r.visits)
    const [hover, setHover] = React.useState<string | null>(null)
    return (
        <div>
            <div className="flex h-4 w-full gap-[2px] overflow-hidden rounded" role="img"
                aria-label={rows.map(r => `${OUTCOME_LABELS[r.key]}: ${r.visits}`).join(", ")}>
                {rows.map(r => (
                    <div key={r.key} style={{ flexGrow: r.visits, background: OUTCOME_COLORS[r.key], opacity: hover && hover !== r.key ? 0.35 : 1 }}
                        className="min-w-[4px] transition-opacity first:rounded-l last:rounded-r"
                        onMouseEnter={() => setHover(r.key)} onMouseLeave={() => setHover(null)} title={`${OUTCOME_LABELS[r.key]}: ${r.visits}`} />
                ))}
            </div>
            <ul className="m-0 mt-4 list-none space-y-2 p-0">
                {rows.map(r => (
                    <li key={r.key} className="flex items-center justify-between gap-3 text-sm"
                        onMouseEnter={() => setHover(r.key)} onMouseLeave={() => setHover(null)}>
                        <span className="flex items-center gap-2 text-sage-700">
                            <span className="h-2.5 w-2.5 flex-shrink-0 rounded-sm" style={{ background: OUTCOME_COLORS[r.key] }} aria-hidden="true" />
                            {OUTCOME_LABELS[r.key]}
                        </span>
                        <span className="tabular-nums text-sage-900">
                            {r.visits} <span className="text-xs text-sage-400">{Math.round((r.visits / total) * 100)}%</span>
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    )
}

/** Ranked amounts: one hue, longest first, the number at the end of each bar. */
function RankBars({ rows, unit, color = "leaf" }: { rows: { label: string; value: number; display?: string }[]; unit?: string; color?: ChartColor }) {
    if (!rows.length) return <p className="m-0 text-sm text-sage-400">Nothing recorded.</p>
    const max = Math.max(...rows.map(r => r.value), 1)
    return (
        <ul className="m-0 list-none space-y-3 p-0">
            {rows.map(r => (
                <li key={r.label} className="text-sm" title={`${r.label}: ${r.display ?? `${r.value} ${unit ?? ""}${unit && r.value !== 1 ? "s" : ""}`}`}>
                    <div className="mb-1 flex items-baseline justify-between gap-3">
                        <span className="truncate text-sage-700">{r.label}</span>
                        <span className="flex-shrink-0 tabular-nums text-sage-900">{r.display ?? r.value}</span>
                    </div>
                    <div className="h-2 rounded-full" style={{ background: CHART[color].track }}>
                        <div className="h-2 rounded-full" style={{ width: `${(r.value / max) * 100}%`, background: CHART[color].bar }} />
                    </div>
                </li>
            ))}
        </ul>
    )
}

/** Counts along a scale (days, hours): columns from a shared baseline, a readout on hover. */
function Columns({ rows, busiest, color = "deep" }: { rows: { key: string; value: number; tick: string; tip: string }[]; busiest: string; color?: ChartColor }) {
    const [hover, setHover] = React.useState<number | null>(null)
    const max = Math.max(...rows.map(r => r.value), 1)
    const top = rows.reduce((best, r) => (r.value > best.value ? r : best), rows[0])
    const shown = hover !== null ? rows[hover] : null
    return (
        <div>
            <p className="m-0 mb-2 h-4 text-xs text-sage-500" aria-live="polite">
                {shown
                    ? <><span className="font-semibold text-sage-900">{shown.value}</span> visit{shown.value === 1 ? "" : "s"} · {shown.tip}</>
                    : top && top.value > 0 ? <>{busiest}: <span className="font-semibold text-sage-900">{top.tip}</span>, {top.value} visit{top.value === 1 ? "" : "s"}</> : "No visits"}
            </p>
            <div className="relative h-36 border-b border-sage-200" onMouseLeave={() => setHover(null)}>
                <div className="absolute inset-x-0 top-0 border-t border-dashed border-sage-100" aria-hidden="true" />
                <div className="absolute inset-0 flex items-end gap-[2px]">
                    {rows.map((r, i) => (
                        <div key={r.key} className="flex h-full min-w-0 flex-1 cursor-default items-end" onMouseEnter={() => setHover(i)}
                            title={`${r.tip}: ${r.value}`}>
                            <div className="w-full rounded-t-[4px] transition-opacity"
                                style={{ height: r.value ? `${Math.max((r.value / max) * 100, 3)}%` : 0, background: CHART[color].bar, opacity: hover !== null && hover !== i ? 0.45 : 1 }} />
                        </div>
                    ))}
                </div>
            </div>
            <div className="mt-1 flex gap-[2px]" aria-hidden="true">
                {rows.map(r => <span key={r.key} className="min-w-0 flex-1 overflow-visible whitespace-nowrap text-center text-[10px] text-sage-400">{r.tick}</span>)}
            </div>
            <table className="sr-only">
                <tbody>{rows.map(r => <tr key={r.key}><th>{r.tip}</th><td>{r.value}</td></tr>)}</tbody>
            </table>
        </div>
    )
}

function tickForDay(day: string, count: number) {
    const date = Number(day.slice(8, 10))
    const every = count > 60 ? 14 : count > 31 ? 7 : count > 14 ? 5 : 1
    if (date === 1 || (date - 1) % every === 0) return date === 1 && count > 31 ? visitDateParts(day).date.slice(0, 3) : String(date)
    return ""
}

function hourLabel(hour: number) {
    const h = hour % 24
    return `${h % 12 || 12}${h < 12 ? "am" : "pm"}`
}

function StockList({ stock }: { stock: Report["stock"] }) {
    const items = [
        ...stock.to_dispose.map(b => ({ key: `d${b.batch_id}`, id: b.supply_id, icon: "bi-trash3", tone: "text-red-700", title: b.supply_name,
            detail: `Expired ${visitDateParts(b.expiration_date).date} · ${withUnit(b.stock_level, b.unit)} to dispose` })),
        ...stock.expiring.map(b => ({ key: `e${b.batch_id}`, id: b.supply_id, icon: "bi-hourglass-split", tone: "text-amber-700", title: b.supply_name,
            detail: `Expires ${visitDateParts(b.expiration_date).date} · ${withUnit(b.stock_level, b.unit)}` })),
        ...stock.reorder.map(s => ({ key: `r${s.supply_id}`, id: s.supply_id, icon: "bi-cart-plus", tone: "text-brand-600", title: s.supply_name,
            detail: `Reorder · ${withUnit(s.total_stock, s.unit)} left` })),
    ]
    if (!items.length) return <p className="m-0 text-sm text-sage-400">Nothing needs attention.</p>
    const shown = Math.min(items.length, 6)
    const hidden = stock.to_dispose_count + stock.expiring_count + stock.reorder_count - shown
    return (
        <>
            <ul className="m-0 list-none divide-y divide-sage-100 p-0">
                {items.slice(0, shown).map(item => (
                    <li key={item.key} className="flex items-start gap-3 py-2.5">
                        <i className={`bi ${item.icon} mt-0.5 ${item.tone}`} aria-hidden="true" />
                        <div className="min-w-0 text-sm">
                            <Link to={`/itemdetails/${item.id}`} className="font-medium text-sage-900 no-underline hover:underline">{item.title}</Link>
                            <span className="block text-xs text-sage-500">{item.detail}</span>
                        </div>
                    </li>
                ))}
            </ul>
            {hidden > 0 && <p className="m-0 mt-2 text-xs text-sage-400">and {hidden} more on the Inventory page</p>}
        </>
    )
}

function FrequentTable({ rows }: { rows: Report["frequent"] }) {
    if (!rows.length) return <p className="m-0 text-sm text-sage-400">No student visited more than once in this period.</p>
    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
                <thead>
                    <tr className="text-left text-xs text-sage-400">
                        {["Student", "Grade or college", "Visits", "Last visit", "Last complaint"].map(h => (
                            <th key={h} className="border-b border-sage-100 py-2 pr-4 font-medium">{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map(r => (
                        <tr key={r.patient_id}>
                            <td className="border-b border-sage-100 py-2.5 pr-4">
                                <Link to={`/patientdetails/${r.patient_id}`} className="font-medium text-sage-900 no-underline hover:underline">{r.patient_name}</Link>
                                {r.student_id && <span className="block text-xs text-sage-400">{r.student_id}</span>}
                            </td>
                            <td className="border-b border-sage-100 py-2.5 pr-4 text-sage-600">{describeLevel(r.department, r.level, r.strand, true)}</td>
                            <td className="border-b border-sage-100 py-2.5 pr-4 font-semibold tabular-nums">{r.visits}</td>
                            <td className="whitespace-nowrap border-b border-sage-100 py-2.5 pr-4 text-sage-600">{visitDateParts(r.last_visit).date}</td>
                            <td className="border-b border-sage-100 py-2.5 text-sage-600">{r.last_complaint || "-"}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <p className="m-0 mt-3 text-xs text-sage-400">Students who keep coming back may need a follow-up or a talk with their parents.</p>
        </div>
    )
}

function DownloadMenu({ onPick }: { onPick: (kind: "visits" | "inventory" | "appointments") => void }) {
    const [open, setOpen] = React.useState(false)
    return (
        <div className="relative">
            <button type="button" aria-expanded={open} onClick={() => setOpen(o => !o)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-800 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-900">
                <i className="bi bi-download" aria-hidden="true" /> Download CSV <i className="bi bi-chevron-down text-xs" aria-hidden="true" />
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-xl border border-sage-200 bg-white shadow-lg">
                        {([["visits", "Clinic visits"], ["inventory", "Stock movements"], ["appointments", "Appointments"]] as const).map(([kind, text]) => (
                            <button key={kind} type="button" onClick={() => { setOpen(false); onPick(kind) }}
                                className="flex w-full items-center px-4 py-2.5 text-left text-sm text-sage-700 hover:bg-sage-50">{text}</button>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}

const PRINT_CSS = `
@media print {
  nav, .no-print { display: none !important; }
  #main-content, #main-content > div { overflow: visible !important; height: auto !important; }
  body { background: #fff !important; }
  section, .rounded-2xl, .kpi-card { break-inside: avoid; box-shadow: none !important; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  @page { margin: 12mm; }
}
`
