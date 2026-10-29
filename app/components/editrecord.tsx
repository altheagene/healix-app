import { apiFetch } from "../api";
import { withUnit } from "../inventory";
import Modal from "./modal"
import React from "react"
import CancelSaveBtn from "./cancelsavebtn"
import '../app.css'

export default function EditRecord(props: any) {

  const [services, setServices] = React.useState<any[]>([])
  const [staff, setStaff] = React.useState<any[]>([])
  const [medicines, setMedicines] = React.useState<any[]>([])
  const [medications, setMedications] = React.useState<any[]>([])

  const [recordDetails, setRecordDetails] = React.useState<any>(null)
  const [allergies, setAllergies] = React.useState<any[]>([])

  /* ------------------ LOAD STATIC DATA ------------------ */
  React.useEffect(() => {
    apiFetch(`/getallservices`)
      .then(res => res.json())
      .then(setServices)

    apiFetch(`/getstaffandcateg`)
      .then(res => res.json())
      .then(setStaff)

    apiFetch(`/getallmedicine`)
      .then(res => res.json())
      .then(setMedicines)
  }, [])
  

  /* ------------------ LOAD RECORD DATA ------------------ */
  React.useEffect(() => {
    if (!props.record) return

    setRecordDetails({
      visit_id: props.record.visit_id,
      patient_id: props.record.patient_id,
      appointment_id: props.record.appointment_id,
      Weight: props.record.Weight ?? "",
      Temperature: props.record.Temperature ?? "",
      visit_datetime: props.record.visit_datetime,
      service_id: props.record.service_id,
      staff_id: props.record.staff_id,
      notes: props.record.notes ?? "",
      complaint: props.record.complaint ?? "",
      assessment: props.record.assessment ?? "",
      treatment: props.record.treatment ?? ""
    })

    // The allergy warning next to the medicines.
    apiFetch(`/getpatientallergies?idnum=${props.record.patient_id}`)
      .then(res => res.json())
      .then(data => setAllergies(Array.isArray(data) ? data : []))

    // load existing medications
    apiFetch(`/getmedicationdetails?idnum=${props.record.visit_id}`
    )
      .then(res => res.json())
      .then(setMedications)
  }, [props.record])

  /* ------------------ MEDICATION HANDLERS ------------------ */
  function addMedication() {
    setMedications([
      ...medications,
      {
        supply_id: medicines[0]?.supply_id,
        auto_deduct: medicines[0]?.auto_deduct,
        quantity: 1
      }
    ])
  }

  function updateMedication(index: number, field: string, value: any) {
    const updated = [...medications]
    updated[index][field] = value

    if (field === "supply_id") {
      const med = medicines.find(m => m.supply_id === parseInt(value))
      if (med?.auto_deduct === 0) {
        updated[index].auto_deduct = false
        updated[index].quantity = 0
      } else {
        updated[index].auto_deduct = true
      }
    }

    setMedications(updated)
  }

  function removeMedication(index: number) {
    setMedications(medications.filter((_, i) => i !== index))
  }

  /* ------------------ SUBMIT UPDATE ------------------ */
  async function handleUpdate() {
    try {
        // The visit and its medicines are updated together, all or nothing.
        const response = await apiFetch(`/updatevisitlog`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...recordDetails, medications })
        })
        const result = await response.json()
        if (!response.ok || !result.success) {
            alert(result.error || "Failed to update record")
            return
        }

        props.refetch()
        props.hideForm()
    } catch (err) {
        console.error(err)
        alert("Failed to update record")
    }
}

  if (!recordDetails) return null

  /* ------------------ UI ------------------ */
  return (
    <Modal title="Edit Visit Record" onClose={props.hideForm} width={560}>
      <div className="contents">
        <div className="main-form-content">
          <label>
            Date
            <input
              type="date"
              value={recordDetails.visit_datetime.split(" ")[0]}
              readOnly
              style={{ width: "70%" }}
            />
          </label>

          <label>Reason</label>
          <select
            style={{ width: "70%" }}
            value={recordDetails.service_id}
            onChange={e =>
              setRecordDetails({
                ...recordDetails,
                service_id: parseInt(e.target.value)
              })
            }
          >
            {services.map(s => (
              <option key={s.service_id} value={s.service_id}>
                {s.service_name}
              </option>
            ))}
          </select>

          <label>
            Chief complaint
            <input
              value={recordDetails.complaint}
              onChange={e => setRecordDetails({ ...recordDetails, complaint: e.target.value })}
            />
          </label>

          <label>
            Assessment
            <textarea
              rows={2}
              value={recordDetails.assessment}
              onChange={e => setRecordDetails({ ...recordDetails, assessment: e.target.value })}
            />
          </label>

          <label>
            Treatment
            <textarea
              rows={2}
              value={recordDetails.treatment}
              onChange={e => setRecordDetails({ ...recordDetails, treatment: e.target.value })}
            />
          </label>

          <div style={{ display: "flex", gap: "1rem" }}>
            <label>
              Weight
              <input
                value={recordDetails.Weight}
                onChange={e =>
                  setRecordDetails({
                    ...recordDetails,
                    Weight: e.target.value
                  })
                }
              />
            </label>

            <label>
              Temperature
              <input
                value={recordDetails.Temperature}
                onChange={e =>
                  setRecordDetails({
                    ...recordDetails,
                    Temperature: e.target.value
                  })
                }
              />
            </label>
          </div>

          {allergies.length > 0 && (
            <p role="alert" className="m-0 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-800">
              <i className="bi bi-exclamation-octagon-fill mr-2" aria-hidden="true" />
              <strong>Allergic to {allergies.map(a => a.allergy_name).join(", ")}.</strong> Check every medicine against this.
            </p>
          )}

          <label>Medications</label>
          {medications.map((med, index) => (
            <div key={index} style={{ display: "flex", gap: "1rem" }}>
              <select
                value={med.supply_id != null ? String(med.supply_id) : ""}
                onChange={e =>
                  updateMedication(index, "supply_id", e.target.value)
                }
              >
                {medicines.map(m => (
                  <option key={m.supply_id} value={String(m.supply_id)}>
                    {m.supply_name} ({withUnit(m.available_stock, m.unit)} on the shelf)
                  </option>
                ))}
              </select>

              {med.auto_deduct && (
                <input
                  type="number"
                  min="1"
                  value={med.quantity}
                  onChange={e =>
                    updateMedication(index, "quantity", +e.target.value)
                  }
                />
              )}

              <button onClick={() => removeMedication(index)}>X</button>
            </div>
          ))}

          <button onClick={addMedication}>+ Add medication</button>

          <label>
            Staff
            <select
              value={recordDetails.staff_id}
              onChange={e =>
                setRecordDetails({
                  ...recordDetails,
                  staff_id: parseInt(e.target.value)
                })
              }
            >
              {staff.map(p => (
                <option key={p.staff_id} value={p.staff_id}>
                  {p.first_name} {p.last_name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Other notes
            <textarea
              value={recordDetails.notes}
              onChange={e =>
                setRecordDetails({
                  ...recordDetails,
                  notes: e.target.value
                })
              }
            />
          </label>
        </div>

        <CancelSaveBtn hideForm={props.hideForm} submit={handleUpdate} />
      </div>
    </Modal>
  )
}
