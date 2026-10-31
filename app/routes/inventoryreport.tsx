import { apiFetch } from "../api";
import React from "react";
import Pagination, { usePaged } from '~/components/pagination'
import { REASONS, withUnit } from "../inventory";
import { localDateTime, visitDateParts } from "../visitOutcomes";
import { SkeletonRows } from "~/components/skeleton"
import { downloadPdf } from "../pdf"
import PdfButton from "~/components/pdfbutton"
import { DateRangeSelect, FilterBar, QuickSelect, type FilterChip, type RangeChoice } from "~/components/filterbar"

interface Movement {
    inv_id: number
    moved_at: string
    supply_name: string
    unit?: string | null
    batch_number: string
    item_in: number
    item_out: number
    reason?: string | null
    note?: string | null
    visit_id?: number | null
    staff_name?: string | null
}

const today = () => localDateTime().slice(0, 10)
function daysAgo(n: number) {
    const d = new Date()
    d.setDate(d.getDate() - n)
    return localDateTime(d).slice(0, 10)
}

// The report always covers a period, so there is no "All time".
const RANGES: RangeChoice[] = [
    { key: "today", label: "Today", from: today, to: today },
    { key: "month", label: "This month", from: () => `${today().slice(0, 7)}-01`, to: today },
    { key: "30", label: "Last 30 days", from: () => daysAgo(29), to: today },
    { key: "year", label: "This year", from: () => `${today().slice(0, 4)}-01-01`, to: today },
]

export default function InventoryReport() {
    const [period, setPeriod] = React.useState({ key: "month", from: `${today().slice(0, 7)}-01`, to: today() })
    const dateRange = React.useMemo(() => ({ from_date: period.from, to_date: period.to }), [period.from, period.to])
    const [logs, setLogs] = React.useState<Movement[]>([])
    const [loading, setLoading] = React.useState(true)
    const [reasonFilter, setReasonFilter] = React.useState("")

    React.useEffect(() => {
        if (!dateRange.from_date || !dateRange.to_date) return
        let stale = false
        setLoading(true)
        apiFetch(`/getinvlogs?fromdate=${dateRange.from_date}&todate=${dateRange.to_date}`)
            .then(res => res.json())
            .then(data => { if (!stale) { setLogs(Array.isArray(data) ? data : []); setLoading(false) } })
        return () => { stale = true }
    }, [dateRange])

    async function downloadReport() {
        const response = await apiFetch(`/download/inventorylogs?fromdate=${dateRange.from_date}&todate=${dateRange.to_date}`)
        if (!response.ok) return
        const url = URL.createObjectURL(await response.blob())
        const link = document.createElement("a")
        link.href = url
        link.download = `inventory-${dateRange.from_date}-to-${dateRange.to_date}.csv`
        link.click()
        URL.revokeObjectURL(url)
    }

    const shown = reasonFilter ? logs.filter(log => (log.reason || "") === reasonFilter) : logs
    const totalIn = shown.reduce((sum, log) => sum + log.item_in, 0)
    const totalOut = shown.reduce((sum, log) => sum + log.item_out, 0)
    const dispensed = logs.filter(log => log.reason === "dispensed").reduce((sum, log) => sum + log.item_out, 0)
    const reasonsSeen = Array.from(new Set(logs.map(log => log.reason || "")))

    const { pageRows: pagedLogs, pager } = usePaged(shown, "inventory-report")

    const reasonOptions: [string, string][] = [["", "Every reason"], ...reasonsSeen.filter(Boolean).map(reason => [reason, REASONS[reason] || reason] as [string, string])]
    const chips: FilterChip[] = []
    if (period.key !== "month") {
        const preset = RANGES.find(r => r.key === period.key)
        chips.push({
            key: "period",
            label: preset ? preset.label : `${visitDateParts(period.from).date} to ${visitDateParts(period.to).date}`,
            onRemove: () => setPeriod({ key: "month", from: RANGES[1].from(), to: RANGES[1].to() }),
        })
    }
    if (reasonFilter) chips.push({ key: "reason", label: REASONS[reasonFilter] || reasonFilter, onRemove: () => setReasonFilter("") })

    function downloadPdfReport() {
        // Units given per medicine, as a short summary before the full list.
        const given = new Map<string, number>()
        for (const log of shown) if (log.reason === "dispensed") given.set(log.supply_name, (given.get(log.supply_name) ?? 0) + log.item_out)
        return downloadPdf({
            title: "Inventory report",
            subtitle: `${visitDateParts(period.from).date} – ${visitDateParts(period.to).date}`,
            filename: `inventory-${period.from}-to-${period.to}.pdf`,
            landscape: true,
            summary: [["Units in", `+${totalIn}`], ["Units out", `-${totalOut}`], ["Given at visits", dispensed], ["Movements", shown.length]],
            notes: reasonFilter ? [`Only movements for: ${REASONS[reasonFilter] || reasonFilter}`] : [],
            tables: [
                { title: "Given at visits, by medicine", columns: ["Medicine", "Units"], numeric: [1], bar: 1,
                    rows: [...given.entries()].sort((a, b) => b[1] - a[1]), empty: "No medicine was given in these dates." },
                { title: "Every movement", columns: ["When", "Item", "Batch", "In", "Out", "Reason", "Note", "Recorded by"], numeric: [3, 4],
                    rows: shown.map(log => {
                        const when = visitDateParts(log.moved_at)
                        return [`${when.date} ${when.time}`, log.supply_name, log.batch_number, log.item_in ? withUnit(log.item_in, log.unit) : "",
                            log.item_out ? withUnit(log.item_out, log.unit) : "", log.reason ? REASONS[log.reason] || log.reason : "Not recorded", log.note, log.staff_name]
                    }),
                    empty: "No stock movements in these dates." },
            ],
        })
    }

    return (
        <div className="min-h-full font-sans text-sage-900">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="m-0 text-[2rem] font-semibold tracking-tight">Inventory Report</h1>
                    <p className="m-0 mt-1 text-sm text-sage-500">Every stock movement: what, how many, why, and who recorded it.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 self-start">
                    <PdfButton build={downloadPdfReport} />
                    <button type="button" onClick={downloadReport}
                        className="inline-flex h-9 items-center gap-2 rounded-full bg-brand-800 px-4 text-sm font-medium text-white hover:bg-brand-900">
                        <i className="bi bi-download" aria-hidden="true" /> Download CSV
                    </button>
                </div>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Stat label="Units in" value={`+${totalIn}`} tone="text-emerald-700" />
                <Stat label="Units out" value={`-${totalOut}`} tone="text-red-700" />
                <Stat label="Given at visits" value={String(dispensed)} tone="text-sage-900" />
            </div>

            <div className="overflow-hidden rounded-2xl border border-sage-200 bg-white shadow-card">
                <FilterBar
                    quick={<>
                        <DateRangeSelect ranges={RANGES} value={period} onChange={setPeriod} idleKey="month" />
                        <QuickSelect label="Reason" value={reasonFilter} onChange={setReasonFilter} options={reasonOptions} />
                    </>}
                    chips={chips}
                    onClearAll={() => { setPeriod({ key: "month", from: RANGES[1].from(), to: RANGES[1].to() }); setReasonFilter("") }}
                    summary={`${shown.length} movement${shown.length === 1 ? "" : "s"}`}
                />
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr className="bg-sage-50/60 text-left text-xs text-sage-400">
                                {["When", "Item", "Batch", "In", "Out", "Reason", "Recorded by"].map(label => (
                                    <th key={label} className="border-b border-sage-100 px-5 py-3 font-medium">{label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? <SkeletonRows cols={7} /> : shown.length === 0 ? (
                                <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-sage-400">No stock movements in these dates.</td></tr>
                            ) : pagedLogs.map(log => {
                                const when = visitDateParts(log.moved_at)
                                return (
                                    <tr key={log.inv_id} className="align-top">
                                        <td className="whitespace-nowrap border-b border-sage-100 px-5 py-3">
                                            {when.date}<span className="block text-xs text-sage-400">{when.time}</span>
                                        </td>
                                        <td className="border-b border-sage-100 px-5 py-3 font-medium">{log.supply_name}</td>
                                        <td className="border-b border-sage-100 px-5 py-3 text-sage-500">{log.batch_number}</td>
                                        <td className="border-b border-sage-100 px-5 py-3 text-emerald-700">{log.item_in ? `+${withUnit(log.item_in, log.unit)}` : ""}</td>
                                        <td className="border-b border-sage-100 px-5 py-3 text-red-700">{log.item_out ? `-${withUnit(log.item_out, log.unit)}` : ""}</td>
                                        <td className="border-b border-sage-100 px-5 py-3">
                                            {log.reason ? REASONS[log.reason] || log.reason : <span className="text-sage-400">Not recorded</span>}
                                            {log.visit_id ? <span className="block text-xs text-sage-400">Visit #{log.visit_id}</span> : null}
                                            {log.note ? <span className="block text-xs text-sage-500">{log.note}</span> : null}
                                        </td>
                                        <td className="border-b border-sage-100 px-5 py-3 text-sage-600">{log.staff_name || <span className="text-sage-400">-</span>}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
                <Pagination {...pager} />
            </div>
        </div>
    )
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
    return (
        <div className="rounded-2xl border border-sage-200 bg-white p-4 shadow-card">
            <div className={`text-xl font-bold leading-none ${tone}`}>{value}</div>
            <div className="mt-1 text-xs text-sage-400">{label}</div>
        </div>
    )
}
