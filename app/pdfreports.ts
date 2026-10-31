/*
 * The data behind each PDF report: fetches it from the API and lays it out as a PdfReport.
 * Pages that show one report use one of these; the Reports page offers all of them.
 */

import { apiFetch } from "./api";
import type { PdfReport } from "./pdf";
import { REASONS, withUnit } from "./inventory";
import { describeLevel } from "./school";
import { DISPOSITIONS, visitDateParts } from "./visitOutcomes";

// Enough for months of visits; past this, a PDF is too long to be read anyway.
export const PDF_ROW_LIMIT = 2000

export const periodLabel = (from: string, to: string) =>
    from || to ? `${from ? visitDateParts(from).date : "The start"} – ${to ? visitDateParts(to).date : "today"}` : "All dates"

const dateSpan = (from: string, to: string) => `${from ? `-${from}` : ""}${to ? `-to-${to}` : ""}`

/* ---------- Visits ---------- */

export interface VisitPdfRow {
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

export function outcomeText(visit: VisitPdfRow) {
    if (visit.disposition) return `${DISPOSITIONS[visit.disposition] || visit.disposition}${visit.referred_to ? ` (${visit.referred_to})` : ""}`
    return visit.time_in && !visit.time_out ? "Still in the clinic" : "Not recorded"
}

/** Every visit a /searchvisits query matches, up to PDF_ROW_LIMIT. */
export async function fetchVisits(params: URLSearchParams) {
    const rows: VisitPdfRow[] = []
    let total = 0
    for (let page = 1; rows.length < PDF_ROW_LIMIT; page++) {
        const p = new URLSearchParams(params)
        p.set("page", String(page))
        p.set("page_size", "200")
        const data = await apiFetch(`/searchvisits?${p}`).then(res => res.json())
        const batch: VisitPdfRow[] = Array.isArray(data?.visits) ? data.visits : []
        total = data?.total ?? rows.length + batch.length
        rows.push(...batch)
        if (batch.length < 200 || rows.length >= total) break
    }
    return { rows: rows.slice(0, PDF_ROW_LIMIT), total }
}

export function visitsReport({ rows, total, from, to, notes = [] }: {
    rows: VisitPdfRow[]; total: number; from: string; to: string; notes?: string[]
}): PdfReport {
    const left = rows.filter(v => v.disposition === "sent_home" || v.disposition === "referred" || v.disposition === "emergency").length
    return {
        title: "Visit records",
        subtitle: periodLabel(from, to),
        landscape: true,
        filename: `visits${dateSpan(from, to)}.pdf`,
        summary: [
            ["Visits", total],
            ["Students and others seen", new Set(rows.map(v => v.patient_id)).size],
            ["Sent home, referred or emergency", left],
            ["Still in the clinic", rows.filter(v => !v.disposition && v.time_in && !v.time_out).length],
        ],
        notes: [
            ...notes,
            ...(total > rows.length ? [`Showing the first ${rows.length} of ${total} visits. Narrow the dates to include the rest.`] : []),
        ],
        tables: [{
            title: "Visits",
            columns: ["Date", "Time", "Patient", "Student ID", "Grade or college", "Complaint", "Outcome", "Attending"],
            rows: rows.map(v => [
                visitDateParts(v.visit_datetime).date, visitDateParts(v.visit_datetime).time, v.patient_name, v.student_id,
                describeLevel(v.department, v.level, v.strand, true), v.complaint || v.service_name, outcomeText(v), v.staff_name,
            ]),
            empty: "No visits in these dates.",
        }],
    }
}

/* ---------- Patients ---------- */

interface PatientRow {
    patient_id: number; student_id?: string | null; first_name?: string; last_name?: string; department?: string | null
    level?: number | string | null; strand?: string | null; sex?: string | null; is_student?: number
    last_visit?: string | null; allergies?: string | null; recent_visits?: number; missing_info?: number
}

/** The patient list: who is on record, by grade, with allergies and when they were last seen. */
export async function patientsReport(): Promise<PdfReport> {
    const rows: PatientRow[] = []
    let stats: Record<string, number> = {}
    for (let page = 1; rows.length < PDF_ROW_LIMIT; page++) {
        const p = new URLSearchParams({ page: String(page), page_size: "100", sort: "name", direction: "asc" })
        const data = await apiFetch(`/searchpatients?${p}`).then(res => res.json())
        const batch: PatientRow[] = Array.isArray(data?.patients) ? data.patients : []
        stats = data?.stats ?? stats
        rows.push(...batch)
        if (batch.length < 100 || rows.length >= (data?.total ?? 0)) break
    }
    const byGroup = new Map<string, number>()
    for (const row of rows) {
        const group = row.is_student === 0 ? "Staff and visitors" : describeLevel(row.department, row.level, null, true) || row.department || "Not set"
        byGroup.set(group, (byGroup.get(group) ?? 0) + 1)
    }
    return {
        title: "Patient list",
        subtitle: `As of ${visitDateParts(new Date().toISOString().slice(0, 10)).date}`,
        landscape: true,
        filename: `patients-${new Date().toISOString().slice(0, 10)}.pdf`,
        summary: [
            ["Patients on record", stats.total ?? rows.length],
            ["Male", stats.male ?? 0],
            ["Female", stats.female ?? 0],
            ["With allergies", rows.filter(r => r.allergies).length],
            ["Missing contact or birthday", stats.missing_info ?? 0],
            ["Frequent visitors (30 days)", stats.frequent ?? 0],
        ],
        notes: rows.length >= PDF_ROW_LIMIT ? [`Showing the first ${PDF_ROW_LIMIT} patients.`] : [],
        tables: [
            { title: "Patients by grade or college", columns: ["Grade or college", "Patients"], numeric: [1], bar: 1,
                rows: [...byGroup.entries()].sort((a, b) => b[1] - a[1]) },
            { title: "Patients", columns: ["Name", "Student ID", "Grade or college", "Sex", "Allergies", "Last visit"],
                rows: rows.map(r => [
                    [r.last_name, r.first_name].filter(Boolean).join(", "), r.student_id,
                    r.is_student === 0 ? "Staff or visitor" : describeLevel(r.department, r.level, r.strand, true),
                    r.sex, r.allergies, r.last_visit ? visitDateParts(r.last_visit).date : "Never",
                ]),
                empty: "No patients on record." },
        ],
    }
}

/* ---------- Appointments ---------- */

interface AppointmentRow {
    appointment_id: number; patient_name?: string; service_name?: string; appointment_date: string; start_time?: string; status?: string
}

export async function appointmentsReport(from: string, to: string): Promise<PdfReport> {
    const all: AppointmentRow[] = await apiFetch("/getallappointments").then(res => res.json()).then(d => (Array.isArray(d) ? d : []))
    const rows = all
        .filter(a => { const day = String(a.appointment_date || "").trim(); return (!from || day >= from) && (!to || day <= to) })
        .sort((a, b) => `${a.appointment_date} ${a.start_time}`.localeCompare(`${b.appointment_date} ${b.start_time}`))
    const count = (status: string) => rows.filter(a => (a.status || "").toLowerCase() === status).length
    const byService = new Map<string, number>()
    for (const a of rows) byService.set(a.service_name || "Other", (byService.get(a.service_name || "Other") ?? 0) + 1)
    return {
        title: "Appointments",
        subtitle: periodLabel(from, to),
        filename: `appointments${dateSpan(from, to)}.pdf`,
        summary: [["Appointments", rows.length], ["Completed", count("completed")], ["Upcoming", count("upcoming")], ["Cancelled", count("cancelled")]],
        tables: [
            { title: "By service", columns: ["Service", "Appointments"], numeric: [1], bar: 1, rows: [...byService.entries()].sort((a, b) => b[1] - a[1]) },
            { title: "Appointments", columns: ["Date", "Time", "Patient", "Service", "Status"],
                rows: rows.map(a => [visitDateParts(a.appointment_date).date, a.start_time, a.patient_name, a.service_name, a.status]),
                empty: "No appointments in these dates." },
        ],
    }
}

/* ---------- Inventory movements ---------- */

export interface Movement {
    inv_id: number; moved_at: string; supply_name: string; unit?: string | null; batch_number: string
    item_in: number; item_out: number; reason?: string | null; note?: string | null; visit_id?: number | null; staff_name?: string | null
}

export async function fetchMovements(from: string, to: string): Promise<Movement[]> {
    const data = await apiFetch(`/getinvlogs?fromdate=${from}&todate=${to}`).then(res => res.json())
    return Array.isArray(data) ? data : []
}

export function movementsReport({ logs, from, to, reason = "" }: { logs: Movement[]; from: string; to: string; reason?: string }): PdfReport {
    const shown = reason ? logs.filter(log => (log.reason || "") === reason) : logs
    const totalIn = shown.reduce((sum, log) => sum + log.item_in, 0)
    const totalOut = shown.reduce((sum, log) => sum + log.item_out, 0)
    const given = new Map<string, number>()
    for (const log of shown) if (log.reason === "dispensed") given.set(log.supply_name, (given.get(log.supply_name) ?? 0) + log.item_out)
    return {
        title: "Inventory report",
        subtitle: periodLabel(from, to),
        filename: `inventory${dateSpan(from, to)}.pdf`,
        landscape: true,
        summary: [["Units in", `+${totalIn}`], ["Units out", `-${totalOut}`], ["Given at visits", [...given.values()].reduce((a, b) => a + b, 0)], ["Movements", shown.length]],
        notes: reason ? [`Only movements for: ${REASONS[reason] || reason}`] : [],
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
    }
}

/* ---------- Stock on hand ---------- */

interface StockBatch { batch_id: number; batch_number: string; expiration_date: string; stock_level: number; supply_name: string; unit?: string | null }

/** What is on the shelves today: every active item, its stock and reorder level, and batches to act on. */
export async function stockReport(days = 60): Promise<PdfReport> {
    const [supplies, alerts] = await Promise.all([
        apiFetch("/getallsupplies").then(res => res.json()).then(d => (Array.isArray(d) ? d : [])),
        apiFetch(`/getinventoryalerts?days=${days}`).then(res => res.json()).catch(() => null),
    ])
    const active = supplies.filter((s: { is_active?: number }) => s.is_active)
    const expiring: StockBatch[] = alerts?.expiring ?? []
    const toDispose: StockBatch[] = alerts?.to_dispose ?? []
    const low = active.filter((s: { needs_reorder?: boolean }) => s.needs_reorder)
    const today = new Date().toISOString().slice(0, 10)
    return {
        title: "Medicine and stock",
        subtitle: `As of ${visitDateParts(today).date}`,
        filename: `stock-${today}.pdf`,
        summary: [["Items in stock", active.length], ["Need reordering", low.length], [`Expiring in ${days} days`, expiring.length], ["Expired, to dispose", toDispose.length]],
        tables: [
            { title: "Expired, to dispose", columns: ["Item", "Batch", "Expired", "Quantity"], numeric: [3],
                rows: toDispose.map(b => [b.supply_name, b.batch_number, visitDateParts(b.expiration_date).date, withUnit(b.stock_level, b.unit)]),
                empty: "No expired stock." },
            { title: `Expiring in the next ${days} days`, columns: ["Item", "Batch", "Expires", "Quantity"], numeric: [3],
                rows: expiring.map(b => [b.supply_name, b.batch_number, visitDateParts(b.expiration_date).date, withUnit(b.stock_level, b.unit)]),
                empty: "Nothing expiring soon." },
            { title: "Every item", columns: ["Item", "Category", "In stock", "Reorder level", "Nearest expiry", "Status"], numeric: [2, 3],
                rows: active.map((s: { supply_name: string; category_name?: string; total_stock: number; unit?: string | null; reorder_level?: number; nearest_expiry?: string | null; needs_reorder?: boolean }) => [
                    s.supply_name, s.category_name, withUnit(s.total_stock, s.unit), s.reorder_level,
                    s.nearest_expiry ? visitDateParts(s.nearest_expiry).date : "", s.needs_reorder ? "Reorder" : "OK",
                ]),
                empty: "No items on record." },
        ],
    }
}
