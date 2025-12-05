import '../routepages.css'
import '../appointments.css'
import React from 'react'

export default function AddAppointment() {

    const [services, setServices] = React.useState<any[]>([])
    const [patients, setPatients] = React.useState<any[]>([])
    const [appointmentDetails, setAppointmentDetails] = React.useState({
        patient_id: '',
        service_id: 0,
        appointment_date: '',
        start_time: '',
        status: 'Upcoming'
        // notes: ''
    })

    const [patientQuery, setPatientQuery] = React.useState('')
    const [filteredPatients, setFilteredPatients] = React.useState<any[]>([])
    const [selectedPatient, setSelectedPatient] = React.useState<any>(null)
    const [saving, setSaving] = React.useState(false)

    React.useEffect(() => {
        fetch(`http://localhost:5000/getallservices`)
            .then(res => res.json())
            .then(data => setServices(data))

        fetch(`http://localhost:5000/getallpatients`)
            .then(res => res.json())
            .then(data => setPatients(data))
    }, [])

    // Filter patients when query changes
    React.useEffect(() => {
        if (!patientQuery) {
            setFilteredPatients([])
            return
        }
        const matches = patients.filter(p =>
            `${p.first_name} ${p.last_name}`.toLowerCase().includes(patientQuery.toLowerCase())
        )
        setFilteredPatients(matches)
    }, [patientQuery, patients])


    const handlePatientSelect = (patient: any) => {
        setSelectedPatient(patient)
        setAppointmentDetails({ ...appointmentDetails, patient_id: patient.patient_id })
        setPatientQuery(`${patient.first_name} ${patient.last_name}`)
        setFilteredPatients([])
    }

    const handleSaveAppointment = async () => {
        if (!appointmentDetails.patient_id) {
            alert("Please select a patient first")
            return
        }
        if (!appointmentDetails.service_id || !appointmentDetails.appointment_date || !appointmentDetails.start_time) {
            alert("Please fill all appointment details")
            return
        }

        setSaving(true)

        try {
            const res = await fetch('http://localhost:5000/addappointment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(appointmentDetails)
            })
            const data = await res.json()

            if (res.ok) {
                alert("Appointment saved successfully!")
                // Reset form
                setAppointmentDetails({
                    patient_id: '',
                    service_id: 0,
                    appointment_date: '',
                    start_time: '',
                    status: 'Upcoming',
                    notes: ''
                })
                setSelectedPatient(null)
                setPatientQuery('')
            } else {
                alert("Error saving appointment: " + data.message)
            }
        } catch (err) {
            console.error(err)
            alert("Error saving appointment")
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="route-page" id='add-appointment-div'>
            <h1 className="route-header">Add Appointment</h1>

            <div>
                <div id='appointment-details'>
                    <p className='div-header'>Appointment Details</p>

                    <select value={appointmentDetails.service_id} onChange={e => setAppointmentDetails({ ...appointmentDetails, service_id: Number(e.target.value) })}>
                        <option value={0}>Select Service</option>
                        {services.map(service => (
                            <option key={service.service_id} value={service.service_id}>
                                {service.service_name}
                            </option>
                        ))}
                    </select>

                    <label htmlFor="date">Date
                        <input
                            type="date"
                            id='date'
                            value={appointmentDetails.appointment_date}
                            onChange={(e) => setAppointmentDetails({ ...appointmentDetails, appointment_date: e.target.value })}
                        />
                    </label>

                    <label htmlFor="time">Time
                        <input
                            type="time"
                            value={appointmentDetails.start_time}
                            onChange={(e) => setAppointmentDetails({ ...appointmentDetails, start_time: e.target.value })}
                        />
                    </label>

                    {/* <label htmlFor="notes">Notes
                        <input
                            type="text"
                            id='notes'
                            value={appointmentDetails.notes}
                            onChange={(e) => setAppointmentDetails({ ...appointmentDetails, notes: e.target.value })}
                        />
                    </label> */}

                    <button onClick={handleSaveAppointment} disabled={saving}>
                        {saving ? "Saving..." : "Save Appointment"}
                    </button>
                </div>

                <div id='appointment-patient'>
                    <p className='div-header'>Select Patient</p>
                    <div>
                        <input
                            type='text'
                            placeholder='Search patient...'
                            value={patientQuery}
                            onChange={(e) => setPatientQuery(e.target.value)}
                        />

                        {filteredPatients.length > 0 && (
                            <ul id='search-patients-container' style={{ border: '1px solid #ccc', maxHeight: 150, overflowY: 'auto', padding: 0, margin: 0, listStyle: 'none' }}>
                                {filteredPatients.map(p => (
                                    <li key={p.patient_id} onClick={() => handlePatientSelect(p)} style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #eee' }}>
                                        <div>{p.first_name} {p.last_name}</div>
                                        <small>Student ID: {p.student_id}</small>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {selectedPatient && (
                            <div id='patient-chosen' style={{ marginTop: '8px' }}>
                                <p>{selectedPatient.first_name} {selectedPatient.last_name}</p>
                                <p>ID: {selectedPatient.student_id}</p>
                            </div>
                        )}

                        <button id='register-patient-btn'>
                            Register New Patient
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
