import { apiFetch } from "../api";
import React from "react";
import Pagination, { usePaged } from '~/components/pagination'
import { REASONS, withUnit } from "../inventory";
import { localDateTime, visitDateParts } from "../visitOutcomes";

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

export default function InventoryReport() {
    const [dateRange, setDateRange] = React.useState({ from_date: `${today().slice(0, 7)}-01`, to_date: today() })
    const [logs, setLogs] = React.useState<Movement[]>([])
    const [reasonFilter, setReasonFilter] = React.useState("")

    React.useEffect(() => {
        if (!dateRange.from_date || !dateRange.to_date) return
        let stale = false
        apiFetch(`/getinvlogs?fromdate=${dateRange.from_date}&todate=${dateRange.to_date}`)
            .then(res => res.json())
            .then(data => { if (!stale) setLogs(Array.isArray(data) ? data : []) })
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

    return (
        <div className="min-h-full font-sans text-sage-900">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="m-0 text-[2rem] font-semibold tracking-tight">Inventory Report</h1>
                    <p className="m-0 mt-1 text-sm text-sage-500">Every stock movement: what, how many, why, and who recorded it.</p>
                </div>
                <button type="button" onClick={downloadReport}
                    className="inline-flex items-center gap-2 self-start rounded-lg bg-brand-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-900">
                    <i className="bi bi-download" aria-hidden="true" /> Download CSV
                </button>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Stat label="Units in" value={`+${totalIn}`} tone="text-emerald-700" />
                <Stat label="Units out" value={`-${totalOut}`} tone="text-red-700" />
                <Stat label="Given at visits" value={String(dispensed)} tone="text-sage-900" />
            </div>

            <div className="overflow-hidden rounded-2xl border border-sage-200 bg-white shadow-card">
                <div className="flex flex-wrap items-center gap-3 border-b border-sage-100 px-5 py-4 text-sm text-sage-600">
                    <label className="inline-flex items-center gap-1.5">
                        From
                        <input type="date" value={dateRange.from_date} max={dateRange.to_date}
                            onChange={(e) => setDateRange({ ...dateRange, from_date: e.target.value })}
                            className="rounded-lg border border-sage-200 px-2 py-1" />
                    </label>
                    <label className="inline-flex items-center gap-1.5">
                        to
                        <input type="date" value={dateRange.to_date} min={dateRange.from_date}
                            onChange={(e) => setDateRange({ ...dateRange, to_date: e.target.value })}
                            className="rounded-lg border border-sage-200 px-2 py-1" />
                    </label>
                    <select aria-label="Reason" value={reasonFilter} onChange={(e) => setReasonFilter(e.target.value)}
                        className="rounded-full border border-sage-200 px-3 py-1.5 text-xs">
                        <option value="">Every reason</option>
                        {reasonsSeen.map(reason => <option key={reason} value={reason}>{reason ? REASONS[reason] || reason : "Not recorded"}</option>)}
                    </select>
                    <span className="text-xs text-sage-400">{shown.length} movement{shown.length === 1 ? "" : "s"}</span>
                </div>
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
                            {shown.length === 0 ? (
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
