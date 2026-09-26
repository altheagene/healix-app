import { apiFetch } from "../api";
import '../routepages.css'
import '../appointments.css'
import React from 'react'
import AddPatient from '~/components/addpatient'
import { useNavigate } from 'react-router'

export default function AddAppointment() {
    
    const navigate = useNavigate()
    const [services, setServices] = React.useState<any[]>([])
    const [patients, setPatients] = React.useState<any[]>([])
    const [showRegister, setShowRegister] = React.useState(false)
    const [appointmentDetails, setAppointmentDetails] = React.useState({
        patient_id: '',
        service_id: 0,
        appointment_date: '',
        start_time: '',
        status: 'Upcoming'
    })



    const [patientQuery, setPatientQuery] = React.useState('')
    const [filteredPatients, setFilteredPatients] = React.useState<any[]>([])
    const [selectedPatient, setSelectedPatient] = React.useState<any>(null)
    const [saving, setSaving] = React.useState(false)
    const [appointments, setAppointments] = React.useState<any[]>()
    const [flashMessage, setFlashMessage] = React.useState<{type: 'success' | 'error', message: string} | null>(null)

    const timeArr = ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM']
    const [availableTime, setAvailableTime] = React.useState<any[]>([])
    
    React.useEffect(() => {
        const filteredAppointments = appointments?.filter(app =>
            app.appointment_date.includes(appointmentDetails.appointment_date)
        )

        const available = timeArr.filter(time =>
            !filteredAppointments?.some(appt =>
            appt.start_time.includes(time) && appt.status != 'Cancelled'
            )
        )

        setAvailableTime(available)
    }, [appointmentDetails.appointment_date, appointments])

    React.useEffect(() => {
        if (
            availableTime.length > 0 &&
            !appointmentDetails.start_time
        ) {
            setAppointmentDetails(prev => ({
            ...prev,
            start_time: availableTime[0]
            }))
        }
    }, [availableTime])

    React.useEffect(() => {
        setAppointmentDetails(prev => ({
            ...prev,
            start_time: ""
        }))
    }, [appointmentDetails.appointment_date])
    

    console.log(availableTime)
    
    React.useEffect(() => {
        apiFetch(`/getallservices`)
            .then(res => res.json())
            .then(data => setServices(data))

        apiFetch(`/getallpatients`)
            .then(res => res.json())
            .then(data => setPatients(data))
        
            apiFetch(`/getallappointments`)
            .then(res => res.json())
            .then(data => setAppointments(data))
    }, [])


    console.log(appointmentDetails)

    React.useEffect(() => {
        if (!patientQuery) {
            setFilteredPatients([])
            return
        }
        const matches = patients.filter(p =>
            `${p.first_name} ${p.last_name}`.toLowerCase().includes(patientQuery.toLowerCase()) || p.student_id.includes(patientQuery)
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
            setFlashMessage({ type: 'error', message: 'Please select a patient first' })
            return
        }
        if (!appointmentDetails.service_id || !appointmentDetails.appointment_date || !appointmentDetails.start_time) {
            setFlashMessage({ type: 'error', message: 'Please fill all appointment details' })
            return
        }

        setSaving(true)

        try {
            const res = await apiFetch(`/addappointment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(appointmentDetails)
            })
            const data = await res.json()

            if (res.ok) {
                setFlashMessage({ type: 'success', message: 'Appointment saved successfully!' })
                // Reset form
                setAppointmentDetails({
                    patient_id: '',
                    service_id: 0,
                    appointment_date: '',
                    start_time: '',
                    status: 'Upcoming'
                })
                setSelectedPatient(null)
                setPatientQuery('')
            } else {
                setFlashMessage({ type: 'error', message: `Error saving appointment: ${data.message}` })
            }
        } catch (err) {
            console.error(err)
            setFlashMessage({ type: 'error', message: 'Error saving appointment' })
        } finally {
            setSaving(false)
            // Remove flash message after 2 seconds
            setTimeout(() => setFlashMessage(null), 2000)
        }
    }

    return (
        <div className="route-page add-appointment-page">
            {showRegister && <AddPatient hideForm={() => {
                setShowRegister(false)
                apiFetch(`/getallpatients`).then(res => res.json()).then(data => setPatients(data))
            }} />}

            <div style={{display: 'flex', gap: '1rem'}}>
                <button onClick={() => navigate(-1)} className='back-btn'>
                    <i className="bi bi-caret-left-fill"></i>
                </button>                
                <h1 className="route-header">Add Appointment</h1>
            </div>

            {flashMessage && (
                <div style={{
                    padding: '10px 15px',
                    borderRadius: '5px',
                    margin: '10px 0',
                    color: flashMessage.type === 'success' ? 'green' : 'red',
                    backgroundColor: flashMessage.type === 'success' ? '#d4edda' : '#f8d7da',
                    border: flashMessage.type === 'success' ? '1px solid #c3e6cb' : '1px solid #f5c6cb'
                }}>
                    {flashMessage.message}
                </div>
            )}

            <div className="appointment-flex">
                {/* LEFT: APPOINTMENT DETAILS */}
                <div className="card appointment-details">
                    <p className="section-title">Appointment Details <span style={{ color: 'red' }}>*</span></p>

                    <label>Service 
                        <select value={appointmentDetails.service_id} onChange={e => setAppointmentDetails({ ...appointmentDetails, service_id: Number(e.target.value) })}>
                            <option value={0}>Select Service</option>
                            {services.map(service => (
                                <option key={service.service_id} value={service.service_id}>{service.service_name}</option>
                            ))}
                        </select>
                    </label>

                    <label>Date
                        <input type="date" value={appointmentDetails.appointment_date} onChange={e => setAppointmentDetails({ ...appointmentDetails, appointment_date: e.target.value })} />
                    </label>

                    {/* <label>Time
                        <input type="time" min="09:00" max="17:00" value={appointmentDetails.start_time} onChange={e => setAppointmentDetails({ ...appointmentDetails, start_time: e.target.value })} />
                    </label> */}

                    {/* <label htmlFor="">Time
                        <select onChange={e => setAppointmentDetails({ ...appointmentDetails, start_time: e.target.value })} disabled={appointmentDetails.appointment_date == ''}>
                            <option disabled>Select Time</option>
                           {availableTime.map(time => {
                            return (<option value={time}>{time}</option>)
                           })} 
                        </select>
                    </label> */}

                    <label>
                        Time
                        <select
                            value={appointmentDetails.start_time || ""}
                            onChange={e =>
                            setAppointmentDetails({
                                ...appointmentDetails,
                                start_time: e.target.value
                            })
                            }
                            disabled={!appointmentDetails.appointment_date}
                        >
                            <option value="" disabled>
                            Select Time
                            </option>

                            {availableTime.map(time => (
                            <option key={time} value={time}>
                                {time}
                            </option>
                            ))}
                        </select>
                    </label>

                    <button className="primary-btn" onClick={handleSaveAppointment} disabled={saving}>
                        {saving ? "Saving..." : "Save Appointment"}
                    </button>
                </div>

                {/* RIGHT: SELECT PATIENT */}
                <div className="card appointment-patient">
                    <p className="section-title">Select Patient <span style={{ color: 'red' }}>*</span></p>

                    <input type="text" className="search-input" placeholder="Search patient..." value={patientQuery} onChange={(e) => setPatientQuery(e.target.value)} />

                    {filteredPatients.length > 0 && (
                        <ul className="search-results">
                            {filteredPatients.map(p => (
                                <li key={p.patient_id} onClick={() => handlePatientSelect(p)}>
                                    <div>{p.first_name} {p.last_name}</div>
                                    <small>ID: {p.student_id}</small>
                                </li>
                            ))}
                        </ul>
                    )}

                    {selectedPatient && (
                        <div className="selected-patient">
                            <p className="name">{selectedPatient.first_name} {selectedPatient.last_name}</p>
                            <p className="sid">Student ID: {selectedPatient.student_id}</p>
                        </div>
                    )}

                    <button className="secondary-btn" onClick={() => setShowRegister(true)}>Register New Patient</button>
                </div>
            </div>
        </div>
    )
}
