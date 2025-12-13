import React from "react"
import CancelSaveBtn from "./cancelsavebtn"
import '../app.css'

export default function EditRecord(props: any) {
  const now = new Date()

  const [services, setServices] = React.useState<any[]>([])
  const [staff, setStaff] = React.useState<any[]>([])
  const [medicines, setMedicines] = React.useState<any[]>([])
  const [medications, setMedications] = React.useState<any[]>([])

  const [recordDetails, setRecordDetails] = React.useState<any>(null)

  /* ------------------ LOAD STATIC DATA ------------------ */
  React.useEffect(() => {
    fetch(`http://localhost:5000/getall?table=services`)
      .then(res => res.json())
      .then(setServices)

    fetch(`http://localhost:5000/getall?table=staff`)
      .then(res => res.json())
      .then(setStaff)

    fetch(`http://localhost:5000/getallmedicine`)
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
      notes: props.record.notes ?? ""
    })

    // load existing medications
    fetch(
      `http://localhost:5000/getmedicationdetails?idnum=${props.record.visit_id}`
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
    const response = await fetch(`http://localhost:5000/updatevisitlog`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recordDetails)
      })

    const result = await response.json()

    const response2 = await fetch(`http://localhost:5000/updatemedicationdetails`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visit_id: recordDetails.visit_id,
        medications
      })
    })

    const result2 = await response.json()

    console.log(result2)
    props.refetch()
    props.hideForm()
  }

  if (!recordDetails) return null

  /* ------------------ UI ------------------ */
  return (
    <div id="add-record-div" className="modal-form-div">
      <div className="gray-bg"></div>

      <div id="add-record-form" className="modal-form">
        <div className="modal-header-div">
          <p className="modal-header">Edit Visit Record</p>
        </div>

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

          <label>Medications</label>
          {medications.map((med, index) => (
            <div key={index} style={{ display: "flex", gap: "1rem" }}>
              <select
                value={med.supply_id}
                onChange={e =>
                  updateMedication(index, "supply_id", e.target.value)
                }
              >
                {medicines.map(m => (
                  <option key={m.supply_id} value={m.supply_id}>
                    {m.supply_name}
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
            Notes
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
    </div>
  )
}
