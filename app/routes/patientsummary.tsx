import { apiFetch } from "../api";
import React from "react";
import { useNavigate, useParams } from "react-router";
import { describeLevel } from "../school";

interface Visit {
    at: string
    service_name?: string
    complaint?: string
    assessment?: string
    treatment?: string
    medicines?: string
    notes?: string
    staff_name?: string
}

interface Summary {
    patient: Record<string, string | number | null>
    allergies: string[]
    conditions: string[]
    recent_visits: Visit[]
    generated_by?: string
}

// Only the summary prints: no sidebar, no scroll container cutting pages short.
const PRINT_CSS = `
@media print {
  nav, .no-print { display: none !important; }
  #main-content, #main-content > div { overflow: visible !important; height: auto !important; padding: 0 !important; }
  body { background: #fff !important; }
  @page { margin: 16mm; }
}
`

/** One-page summary for a referral or for parents. The server allows clinicians only and logs each one. */
export default function PatientSummary() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [summary, setSummary] = React.useState<Summary | null>(null)
    const [error, setError] = React.useState("")

    React.useEffect(() => {
        apiFetch(`/patientsummary?idnum=${id}`).then(async res => {
            const data = await res.json()
            if (res.ok && data.patient) setSummary(data)
            else setError(res.status === 403 ? "Only nurses, doctors and admins can print patient summaries." : data.error || "Could not load the summary.")
        })
    }, [id])

    const p = summary?.patient
    const fullName = p ? [p.first_name, p.middle_name, p.last_name].filter(Boolean).join(" ") : ""

    return (
        <div className="mx-auto max-w-3xl font-sans text-slate-900">
            <style>{PRINT_CSS}</style>

            <div className="no-print mb-6 flex items-center justify-between gap-3">
                <button
                    type="button"
                    onClick={() => navigate(`/patientdetails/${id}`)}
                    className="inline-flex items-center gap-1.5 border-none bg-transparent p-0 text-sm text-slate-500 hover:text-slate-900"
                >
                    <i className="bi bi-arrow-left" aria-hidden="true" /> Back to patient
                </button>
                {summary && (
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-2 rounded-xl bg-teal-800 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-teal-900"
                    >
                        <i className="bi bi-printer" aria-hidden="true" /> Print / Save as PDF
                    </button>
                )}
            </div>

            {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            {!summary && !error && <p className="text-sm text-slate-500">Loading summary...</p>}

            {summary && p && (
                <article className="rounded-2xl border border-slate-200 bg-white p-8 print:border-0 print:p-0">
                    <header className="mb-6 flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
                        <div>
                            <p className="m-0 text-xs font-semibold uppercase tracking-wide text-teal-800">Healix school clinic</p>
                            <h1 className="m-0 mt-1 text-2xl font-semibold">Patient summary</h1>
                        </div>
                        <p className="m-0 text-right text-xs text-slate-500">
                            Printed {new Date().toLocaleString()}<br />
                            {summary.generated_by && <>by {summary.generated_by}</>}
                        </p>
                    </header>

                    <section className="mb-6 grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm">
                        <Field label="Name" value={fullName} />
                        <Field label="Student ID" value={p.student_id} />
                        <Field label="Birthday" value={p.birthday} />
                        <Field label="Sex" value={p.sex} />
                        <Field label="Department" value={p.department} />
                        <Field label="Level" value={describeLevel(p.department as string, p.level, p.strand as string)} />
                        <Field label="Phone" value={p.phone} />
                        <Field label="Email" value={p.email} />
                    </section>

                    <section className={`mb-6 rounded-xl border px-4 py-3 ${summary.allergies.length ? "border-red-300 bg-red-50" : "border-slate-200"}`}>
                        <h2 className="m-0 text-sm font-semibold">Allergies</h2>
                        <p className={`m-0 mt-1 text-sm ${summary.allergies.length ? "font-semibold text-red-800" : "text-slate-500"}`}>
                            {summary.allergies.length ? summary.allergies.join(", ") : "None recorded"}
                        </p>
                    </section>

                    <section className="mb-6 grid grid-cols-2 gap-6 text-sm">
                        <div>
                            <h2 className="m-0 text-sm font-semibold">Conditions</h2>
                            <p className="m-0 mt-1">{summary.conditions.length ? summary.conditions.join(", ") : "None recorded"}</p>
                        </div>
                        <div>
                            <h2 className="m-0 text-sm font-semibold">Emergency contact</h2>
                            <p className="m-0 mt-1">{p.emergency_contact_name || "-"} {p.emergency_contact_phone ? `· ${p.emergency_contact_phone}` : ""}</p>
                        </div>
                    </section>

                    {p.notes && (
                        <section className="mb-6 text-sm">
                            <h2 className="m-0 text-sm font-semibold">Notes</h2>
                            <p className="m-0 mt-1 whitespace-pre-line">{p.notes}</p>
                        </section>
                    )}

                    <section>
                        <h2 className="m-0 mb-2 text-sm font-semibold">Recent visits</h2>
                        {summary.recent_visits.length === 0 ? (
                            <p className="m-0 text-sm text-slate-500">No visits recorded.</p>
                        ) : (
                            <table className="w-full border-collapse text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-300">
                                        <th className="py-1.5 pr-3 font-semibold">Date</th>
                                        <th className="py-1.5 pr-3 font-semibold">Reason</th>
                                        <th className="py-1.5 pr-3 font-semibold">Assessment and treatment</th>
                                        <th className="py-1.5 font-semibold">Medicines</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {summary.recent_visits.map((visit, idx) => (
                                        <tr key={idx} className="border-b border-slate-100 align-top">
                                            <td className="py-1.5 pr-3 whitespace-nowrap">{String(visit.at).slice(0, 10)}</td>
                                            <td className="py-1.5 pr-3">{visit.complaint || visit.service_name}</td>
                                            <td className="py-1.5 pr-3">
                                                {[visit.assessment, visit.treatment].filter(Boolean).join(" · ") || visit.notes || "-"}
                                            </td>
                                            <td className="py-1.5">{visit.medicines || "-"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </section>

                    <footer className="mt-8 border-t border-slate-200 pt-3 text-[11px] text-slate-500">
                        Confidential: contains health information about a student. Share only with the
                        student, their parent or guardian, or a health professional caring for them.
                    </footer>
                </article>
            )}
        </div>
    )
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
    return (
        <p className="m-0">
            <span className="text-slate-500">{label}: </span>
            <span className="font-medium">{value || "-"}</span>
        </p>
    )
}
