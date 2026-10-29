import { apiFetch } from "../api";
import React from "react"
import { ChoiceGroup, Field, ModalForm, Section, inputClass, selectClass, textareaClass } from "./form"
import { notify } from "../notify"

const TIME_SLOTS = ["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM"]
const STATUSES = [["Upcoming", "Upcoming"], ["Completed", "Completed"], ["Cancelled", "Cancelled"]] as const
// Only these are saved; the row the page passes in also carries display fields.
const SAVED_FIELDS = ["appointment_id", "patient_id", "service_id", "appointment_date", "start_time", "status", "notes"]

function patientName(p: any) {
    return [p?.first_name, p?.last_name].filter(Boolean).join(" ")
}

export default function EditAppointment(props: any) {
    const appt = props.appt || {}
    const [services, setServices] = React.useState<any[]>([])
    const [patients, setPatients] = React.useState<any[]>([])
    const [appointments, setAppointments] = React.useState<any[]>([])
    const [details, setDetails] = React.useState<Record<string, any>>({
        ...appt,
        notes: appt.notes ?? appt.Notes ?? "",
        status: appt.status === "Scheduled" ? "Upcoming" : appt.status || "Upcoming",
    })
    const [patientQuery, setPatientQuery] = React.useState(appt.patient_name || "")
    const [showMatches, setShowMatches] = React.useState(false)
    const [saving, setSaving] = React.useState(false)
    const [error, setError] = React.useState("")
    const set = (patch: Record<string, any>) => setDetails(current => ({ ...current, ...patch }))

    React.useEffect(() => {
        apiFetch(`/getallservices`).then(res => res.json()).then(data => setServices(Array.isArray(data) ? data : []))
        apiFetch(`/getallpatients`).then(res => res.json()).then(data => setPatients(Array.isArray(data) ? data : []))
        apiFetch(`/getallappointments`).then(res => res.json()).then(data => setAppointments(Array.isArray(data) ? data : []))
    }, [])

    const term = patientQuery.trim().toLowerCase()
    const matches = term && showMatches
        ? patients.filter(p => patientName(p).toLowerCase().includes(term) || String(p.student_id ?? "").includes(term)).slice(0, 8)
        : []

    // Slots taken by other appointments that day are left out; this one's own time stays,
    // even when it is not one of the usual slots.
    const taken = appointments.filter(a => a.appointment_date === details.appointment_date
        && a.appointment_id !== details.appointment_id && a.status !== "Cancelled").map(a => a.start_time)
    const slots = TIME_SLOTS.filter(t => !taken.includes(t))
    if (details.start_time && !slots.includes(details.start_time)) slots.unshift(details.start_time)

    async function save() {
        if (!details.patient_id) return setError("Choose the patient.")
        if (!details.service_id || Number(details.service_id) === 0) return setError("Choose the service.")
        if (!details.appointment_date) return setError("Choose the date.")
        if (!details.start_time) return setError("Choose the time.")

        setSaving(true)
        setError("")
        const body = Object.fromEntries(SAVED_FIELDS.filter(key => key in details).map(key => [key, details[key]]))
        const response = await apiFetch(`/updateappointmentdetails`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        }).catch(() => null)
        const result = await response?.json().catch(() => ({}))
        setSaving(false)
        if (!response?.ok || result?.success === false) {
            setError(result?.error || "Could not save this appointment.")
            return
        }
        notify("Appointment updated.")
        props.hideForm()
        props.refetch()
    }

    return (
        <ModalForm title="Edit appointment" onClose={props.hideForm} onSubmit={save} submitLabel="Save changes" saving={saving}
            error={error} width={560}>
            <div className="relative">
                <Field label="Patient" htmlFor="appt-patient" required hint="Search by name or student ID.">
                    <input id="appt-patient" className={inputClass} autoComplete="off" value={patientQuery}
                        role="combobox" aria-expanded={matches.length > 0} aria-controls="appt-patient-list"
                        onChange={(e) => { setPatientQuery(e.target.value); setShowMatches(true); set({ patient_id: null }) }} />
                </Field>
                {matches.length > 0 && (
                    <ul id="appt-patient-list" role="listbox"
                        className="absolute inset-x-0 top-[4.6rem] z-30 max-h-60 list-none overflow-y-auto rounded-xl border border-sage-200 bg-white p-1 shadow-lg">
                        {matches.map(p => (
                            <li key={p.patient_id} role="option" aria-selected={details.patient_id === p.patient_id}>
                                <button type="button" className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-sage-50"
                                    onClick={() => { set({ patient_id: p.patient_id }); setPatientQuery(patientName(p)); setShowMatches(false) }}>
                                    <span className="font-medium text-sage-900">{patientName(p)}</span>
                                    {p.student_id && <span className="ml-2 text-xs text-sage-500">{p.student_id}</span>}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <Section>
                <Field label="Service" htmlFor="appt-service" required className="sm:col-span-2">
                    <select id="appt-service" className={selectClass} value={details.service_id ?? 0}
                        onChange={(e) => set({ service_id: Number(e.target.value) })}>
                        <option value={0} disabled>Choose a service</option>
                        {services.map(s => <option key={s.service_id} value={s.service_id}>{s.service_name}</option>)}
                    </select>
                </Field>
                <Field label="Date" htmlFor="appt-date" required>
                    <input id="appt-date" type="date" className={inputClass} value={details.appointment_date || ""}
                        onChange={(e) => set({ appointment_date: e.target.value, start_time: "" })} />
                </Field>
                <Field label="Time" htmlFor="appt-time" required hint={details.appointment_date && !slots.length ? "Every slot that day is taken." : undefined}>
                    <select id="appt-time" className={selectClass} value={details.start_time || ""} disabled={!details.appointment_date}
                        onChange={(e) => set({ start_time: e.target.value })}>
                        <option value="" disabled>{details.appointment_date ? "Choose a time" : "Choose a date first"}</option>
                        {slots.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </Field>
            </Section>

            <ChoiceGroup legend="Status" name="appt-status" value={details.status} options={STATUSES} onChange={(status) => set({ status })} />

            <Field label="Notes" htmlFor="appt-notes" optional>
                <textarea id="appt-notes" rows={2} className={textareaClass} value={details.notes || ""}
                    onChange={(e) => set({ notes: e.target.value })} />
            </Field>
        </ModalForm>
    )
}
