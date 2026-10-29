import { apiFetch } from "../api";
import { useParams } from "react-router"
import React from "react"
import { DISPOSITIONS, LEAVES_SCHOOL, localDateTime, visitDateParts } from "../visitOutcomes"
import 'bootstrap-icons/font/bootstrap-icons.css';
import { Field, ModalForm, Section, inputClass, selectClass, secondaryButton } from "./form"
import VisitFields, { type MedicineChoice, type MedicineRow } from "./visitfields"
import { notify } from "../notify"

export default function AddRecord(props: any) {
    const { id } = useParams()
    const [services, setServices] = React.useState<any[]>([])
    const [staff, setStaff] = React.useState<any[]>([])
    const [medicines, setMedicines] = React.useState<MedicineChoice[]>([])
    const [medications, setMedications] = React.useState<MedicineRow[]>([])
    const [newService, setNewService] = React.useState("")
    const [addingService, setAddingService] = React.useState(false)
    const [saving, setSaving] = React.useState(false)
    const [error, setError] = React.useState("")
    const [details, setDetails] = React.useState<Record<string, any>>({
        patient_id: id,
        appointment_id: null,
        weight: '',
        temperature: '',
        // Local clinic time; toISOString() gave UTC, hours off from the wall clock.
        visit_datetime: localDateTime(new Date()),
        service_id: 1,
        staff_id: 0,
        notes: '',
        complaint: '',
        assessment: '',
        treatment: '',
        // Empty means the student stays in the clinic and shows on the board.
        disposition: '',
        referred_to: '',
        picked_up_by: '',
    })
    const set = (patch: Record<string, any>) => setDetails(current => ({ ...current, ...patch }))

    React.useEffect(() => {
        apiFetch(`/getallservices`).then(res => res.json()).then(data => {
            const list = Array.isArray(data) ? data : []
            setServices(list)
            if (list.length) setDetails(current => ({ ...current, service_id: list[0].service_id }))
        })
        apiFetch(`/getstaffandcateg`).then(res => res.json()).then(data => {
            // Staff who have left cannot attend new visits. The signed-in person attends by default.
            const list = Array.isArray(data) ? data.filter((person: any) => person.is_active !== 0) : []
            setStaff(list)
            const me = Number(localStorage.getItem("userid"))
            const pick = list.find((p: any) => p.staff_id === me) || list[0]
            if (pick) setDetails(current => ({ ...current, staff_id: pick.staff_id }))
        })
        apiFetch(`/getallmedicine`).then(res => res.json()).then(data => setMedicines(Array.isArray(data) ? data : []))
    }, [])

    async function addServiceInline() {
        const name = newService.trim()
        if (!name) return
        const res = await apiFetch(`/addservice`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ service_name: name })
        })
        const result = await res.json().catch(() => ({}))
        const refreshed = await apiFetch(`/getallservices`).then(r => r.json())
        setServices(Array.isArray(refreshed) ? refreshed : services)
        const created = result?.service_id ?? refreshed?.find?.((s: any) => s.service_name === name)?.service_id
        if (created) set({ service_id: created })
        setNewService("")
        setAddingService(false)
    }

    async function save() {
        // A visit needs a reason: the complaint, or failing that some notes.
        if (!details.complaint?.trim() && !details.notes?.trim()) return setError("Enter the chief complaint.")
        if ((details.disposition === "referred" || details.disposition === "emergency") && !details.referred_to?.trim()) {
            return setError(details.disposition === "emergency" ? "Say where the student was taken." : "Say where the student was referred.")
        }
        if (details.disposition === "sent_home" && !details.picked_up_by?.trim()) return setError("Say who picked the student up.")

        setSaving(true)
        setError("")
        const response = await apiFetch(`/addvisitlog`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // The visit and its medicines are saved together, all or nothing.
            body: JSON.stringify({ ...details, medications })
        }).catch(() => null)
        const result = await response?.json().catch(() => ({}))
        setSaving(false)
        if (!response?.ok || !result?.visit_id) {
            setError(result?.error || "Could not save the visit.")
            return
        }
        notify(details.disposition ? "Visit saved." : "Visit saved. The student shows as in the clinic until you close it.")
        props.hideForm()
        props.refetch()
    }

    const when = visitDateParts(details.visit_datetime)
    const leavesWith = details.disposition === "emergency" ? "Taken to" : "Referred to"
    return (
        <ModalForm title="Record a visit" onClose={props.hideForm} onSubmit={save} submitLabel="Save visit" saving={saving}
            error={error} width={680}>
            <p className="m-0 text-sm text-sage-500">
                <i className="bi bi-clock mr-1.5" aria-hidden="true" />{when.date} at {when.time}
            </p>

            <VisitFields details={details} onChange={set} services={services} staff={staff} medicines={medicines}
                rows={medications} onRowsChange={setMedications} allergies={props.allergies || []}
                extraService={addingService ? (
                    <div className="mt-2 flex gap-2">
                        <label htmlFor="new-service" className="sr-only">New service name</label>
                        <input id="new-service" className={inputClass} placeholder="New service name" value={newService} autoFocus
                            onChange={(e) => setNewService(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addServiceInline() } }} />
                        <button type="button" onClick={addServiceInline} className={`${secondaryButton} flex-shrink-0`}>Add</button>
                    </div>
                ) : (
                    <button type="button" onClick={() => setAddingService(true)}
                        className="mt-1.5 text-xs font-semibold text-brand-800 hover:underline">+ Add a service that isn't listed</button>
                )} />

            <Section title="How did it end?" description="Leave as 'still in the clinic' to close the visit later from the clinic board.">
                <Field label="Outcome" htmlFor="visit-outcome" className="sm:col-span-2">
                    <select id="visit-outcome" className={selectClass} value={details.disposition} onChange={(e) => set({ disposition: e.target.value })}>
                        <option value="">Still in the clinic</option>
                        {Object.entries(DISPOSITIONS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                </Field>
                {(details.disposition === "referred" || details.disposition === "emergency") && (
                    <Field label={leavesWith} htmlFor="visit-referred" required>
                        <input id="visit-referred" className={inputClass} value={details.referred_to}
                            placeholder={details.disposition === "emergency" ? "e.g. City General Hospital" : "e.g. Dentist, guidance office"}
                            onChange={(e) => set({ referred_to: e.target.value })} />
                    </Field>
                )}
                {LEAVES_SCHOOL.has(details.disposition) && (
                    <Field label="Picked up by" htmlFor="visit-picked-up" required={details.disposition === "sent_home"}>
                        <input id="visit-picked-up" className={inputClass} value={details.picked_up_by} placeholder="e.g. Maria Cruz (mother)"
                            onChange={(e) => set({ picked_up_by: e.target.value })} />
                    </Field>
                )}
            </Section>
        </ModalForm>
    )
}
