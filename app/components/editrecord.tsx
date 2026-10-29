import { apiFetch } from "../api";
import React from "react"
import { visitDateParts } from "../visitOutcomes"
import { ModalForm } from "./form"
import VisitFields, { type MedicineChoice, type MedicineRow } from "./visitfields"
import { notify } from "../notify"

export default function EditRecord(props: any) {
  const [services, setServices] = React.useState<any[]>([])
  const [staff, setStaff] = React.useState<any[]>([])
  const [medicines, setMedicines] = React.useState<MedicineChoice[]>([])
  const [medications, setMedications] = React.useState<MedicineRow[]>([])
  const [allergies, setAllergies] = React.useState<any[]>([])
  const [details, setDetails] = React.useState<Record<string, any> | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    apiFetch(`/getallservices`).then(res => res.json()).then(data => setServices(Array.isArray(data) ? data : []))
    apiFetch(`/getstaffandcateg`).then(res => res.json()).then(data => setStaff(Array.isArray(data) ? data : []))
    apiFetch(`/getallmedicine`).then(res => res.json()).then(data => setMedicines(Array.isArray(data) ? data : []))
  }, [])

  React.useEffect(() => {
    const record = props.record
    if (!record) return
    setDetails({
      visit_id: record.visit_id,
      patient_id: record.patient_id,
      appointment_id: record.appointment_id,
      // The server takes these lower-case; older rows hold them capitalised.
      weight: record.Weight ?? record.weight ?? "",
      temperature: record.Temperature ?? record.temperature ?? "",
      visit_datetime: record.visit_datetime,
      service_id: record.service_id,
      staff_id: record.staff_id,
      notes: record.notes ?? "",
      complaint: record.complaint ?? "",
      assessment: record.assessment ?? "",
      treatment: record.treatment ?? "",
    })
    apiFetch(`/getpatientallergies?idnum=${record.patient_id}`).then(res => res.json())
      .then(data => setAllergies(Array.isArray(data) ? data : []))
    apiFetch(`/getmedicationdetails?idnum=${record.visit_id}`).then(res => res.json())
      .then(data => setMedications(Array.isArray(data) ? data.map((m: any) => ({ supply_id: m.supply_id, quantity: m.quantity, auto_deduct: m.auto_deduct })) : []))
  }, [props.record])

  async function save() {
    if (!details) return
    if (!details.complaint?.trim() && !details.notes?.trim()) return setError("Enter the chief complaint.")
    setSaving(true)
    setError("")
    // The visit and its medicines are updated together, all or nothing.
    const response = await apiFetch(`/updatevisitlog`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...details, medications }),
    }).catch(() => null)
    const result = await response?.json().catch(() => ({}))
    setSaving(false)
    if (!response?.ok || !result?.success) {
      setError(result?.error || "Could not save the visit.")
      return
    }
    notify("Visit updated.")
    props.refetch()
    props.hideForm()
  }

  if (!details) return null
  const when = visitDateParts(details.visit_datetime)
  // Staff who have left still show here if they attended this visit.
  const staffChoices = staff.filter(p => p.is_active !== 0 || p.staff_id === details.staff_id)
  return (
    <ModalForm title="Edit visit" onClose={props.hideForm} onSubmit={save} submitLabel="Save changes" saving={saving}
      error={error} width={680}>
      <p className="m-0 text-sm text-sage-500">
        <i className="bi bi-clock mr-1.5" aria-hidden="true" />{when.date}{when.time ? ` at ${when.time}` : ""}
      </p>
      <VisitFields details={details} onChange={(patch) => setDetails(current => ({ ...(current || {}), ...patch }))}
        services={services} staff={staffChoices} medicines={medicines} rows={medications} onRowsChange={setMedications}
        allergies={allergies} />
    </ModalForm>
  )
}
