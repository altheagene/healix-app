import { apiFetch } from "../api";
import React from "react"
import { Link } from "react-router"
import { STAFF_ROLE_NAME } from "../roles"
import { durationLabel, telHref } from "../visitOutcomes"
import { NotifyParentDialog, type OpenVisit, VisitOutcomeDialog } from "./visitoutcome"

interface BoardRow extends OpenVisit {
    patient_id: number
    student_id?: string
    complaint?: string
    service_name?: string
    time_in: string
    minutes_in_clinic: number | null
    allergies?: string | null
    notified_method?: string | null
}

// Longer than this and someone should check why the student is still here.
const LONG_STAY_MINUTES = 60

/** Everyone currently in the clinic, so no student is forgotten on a cot. */
export default function ClinicNow({ reloadKey = 0 }: { reloadKey?: number }) {
    const isClinician = (typeof window !== "undefined" ? localStorage.getItem("role") : null) !== STAFF_ROLE_NAME
    const [rows, setRows] = React.useState<BoardRow[]>([])
    const [closing, setClosing] = React.useState<BoardRow | null>(null)
    const [notifying, setNotifying] = React.useState<BoardRow | null>(null)

    const load = React.useCallback(() => {
        apiFetch("/clinicnow")
            .then(res => res.json())
            .then(data => setRows(Array.isArray(data) ? data : []))
    }, [])

    React.useEffect(() => {
        load()
        const timer = setInterval(load, 60_000)
        return () => clearInterval(timer)
    }, [load, reloadKey])

    return (
        <section aria-labelledby="clinic-now" className="mb-6 rounded-2xl border border-sage-200 bg-white shadow-card">
            {closing && <VisitOutcomeDialog visit={closing} onClose={() => setClosing(null)} onDone={() => { setClosing(null); load() }} />}
            {notifying && <NotifyParentDialog visit={notifying} onClose={() => setNotifying(null)} onDone={() => { setNotifying(null); load() }} />}

            <div className="flex items-center justify-between border-b border-sage-200 px-5 py-3">
                <h2 id="clinic-now" className="m-0 flex items-center gap-2 text-sm font-semibold">
                    <span className={`h-2.5 w-2.5 rounded-full ${rows.length ? "bg-emerald-500" : "bg-sage-300"}`} aria-hidden="true" />
                    In the clinic now
                    <span className="rounded-full bg-sage-100 px-2 py-0.5 text-xs font-medium text-sage-600">{rows.length}</span>
                </h2>
                <button type="button" onClick={load} className="text-xs font-medium text-brand-800 hover:underline">Refresh</button>
            </div>

            {rows.length === 0 ? (
                <p className="m-0 px-5 py-4 text-sm text-sage-400">No one is in the clinic right now.</p>
            ) : (
                <ul className="m-0 list-none divide-y divide-sage-100 p-0">
                    {rows.map(row => {
                        const long = (row.minutes_in_clinic ?? 0) >= LONG_STAY_MINUTES
                        return (
                            <li key={row.visit_id} className={`flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center ${long ? "bg-amber-50/60" : ""}`}>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2 text-sm">
                                        <Link to={`/patientdetails/${row.patient_id}`} className="font-semibold text-sage-900 no-underline hover:underline">
                                            {row.first_name} {row.last_name}
                                        </Link>
                                        {row.student_id && <span className="text-xs text-sage-400">{row.student_id}</span>}
                                        {row.allergies && (
                                            <span title={`Allergies: ${row.allergies}`} className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
                                                <i className="bi bi-exclamation-octagon-fill" aria-hidden="true" /> {row.allergies}
                                            </span>
                                        )}
                                    </div>
                                    <p className="m-0 mt-0.5 text-xs text-sage-500">
                                        {row.complaint || row.service_name || "Visit"} · in since {row.time_in.slice(11, 16)}
                                        {" "}<span className={long ? "font-semibold text-amber-800" : ""}>({durationLabel(row.minutes_in_clinic)})</span>
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    {row.parent_notified ? (
                                        <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                                            <i className="bi bi-check-circle-fill" aria-hidden="true" /> Parent notified
                                        </span>
                                    ) : (
                                        <>
                                            {row.emergency_contact_phone && (
                                                <a href={telHref(row.emergency_contact_phone)} className="inline-flex items-center gap-1 rounded-full border border-sage-200 px-3 py-1.5 text-xs font-medium text-sage-700 no-underline hover:bg-sage-50">
                                                    <i className="bi bi-telephone" aria-hidden="true" /> Call parent
                                                </a>
                                            )}
                                            <button type="button" onClick={() => setNotifying(row)}
                                                className="rounded-full border border-sage-200 px-3 py-1.5 text-xs font-medium text-sage-700 hover:bg-sage-50">
                                                Mark notified
                                            </button>
                                        </>
                                    )}
                                    {isClinician && (
                                        <button type="button" onClick={() => setClosing(row)}
                                            className="rounded-full bg-brand-800 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-900">
                                            Close visit
                                        </button>
                                    )}
                                </div>
                            </li>
                        )
                    })}
                </ul>
            )}
        </section>
    )
}
