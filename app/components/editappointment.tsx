import { apiFetch } from "../api";
import CancelSaveBtn from "./cancelsavebtn"
import React from "react"

export default function EditAppointment(props:any){

    const [services, setServices] = React.useState<any[]>([])
        const [patients, setPatients] = React.useState<any[]>([])
        const [appointmentDetails, setAppointmentDetails] = React.useState({
        })
        const [availableTime, setAvailableTime] = React.useState<string[]>([]);
        const timeArr = ["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM"];

        const [patientQuery, setPatientQuery] = React.useState('')
        const [filteredPatients, setFilteredPatients] = React.useState<any[]>([])
        const [selectedPatient, setSelectedPatient] = React.useState<any>(null)
        const [saving, setSaving] = React.useState(false)
        const [appointments, setAppointments] = React.useState<any[]>([])
        console.log(appointmentDetails)

        React.useEffect(() => {
            apiFetch(`/getallservices`)
                .then(res => res.json())
                .then(data => setServices(data))
    
            apiFetch(`/getallpatients`)
                .then(res => res.json())
                .then(data => setPatients(data))

            apiFetch(`/getallappointments`)
                .then(res => res.json())
                .then(data => setAppointments(data));

            setAppointmentDetails(props.appt)
        }, [])

            React.useEffect(() => {
                if (!patientQuery) {
                    setFilteredPatients([])
                    return
                }
                const matches = patients.filter(p =>
                    p.student_id.toString().includes(patientQuery) || `${p.first_name} ${p.last_name}`.toLowerCase().includes(patientQuery.toLowerCase())
                )

                setFilteredPatients(matches)
            }, [patientQuery, patients])

             
            React.useEffect(() => {
                if (!appointmentDetails.appointment_date) {
                    setAvailableTime([]);
                    return;
                }

                const filteredAppointments = appointments?.filter(
                    app => app.appointment_date === appointmentDetails.appointment_date && app.appointment_id !== appointmentDetails.appointment_id
                );

                const available = timeArr.filter(
                    time => !filteredAppointments?.some(appt => appt.start_time === time && appt.status != 'Cancelled')
                );

                setAvailableTime(available);
            }, [appointmentDetails.appointment_date, appointments]);

            // Automatically set first available time if none selected
            React.useEffect(() => {
                if (availableTime.length > 0 && !appointmentDetails.start_time) {
                setAppointmentDetails(prev => ({ ...prev, start_time: availableTime[0] }));
                }
            }, [availableTime]);
                    
        
            const handlePatientSelect = (patient: any) => {
                setSelectedPatient(patient)
                setAppointmentDetails({ ...appointmentDetails, patient_id: patient.patient_id })
                setPatientQuery(`${patient.first_name} ${patient.last_name}`)
                setFilteredPatients([])
            }
        
            const handleSubmit = async () => {
        
                try {
                    const res = await apiFetch(`/updateappointmentdetails`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(appointmentDetails)
                    })
                    const data = await res.json()
        
                    if (res.ok) {
                        alert("Appointment updated successfully!")
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
                        props.hideForm()
                        props.refetch()
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

    return(
        <div className="modal-form-div">
            <div className="gray-bg"></div>
            <div className="modal-form">
                <div className="modal-header-div">
                    <p className="modal-header">Edit Appointment</p>
                </div>

                <div className="main-form-content">
                    
                    <div>
                        <label htmlFor="">Select Patient
                            <input
                                type='text'
                                placeholder='Search patient...'
                                value={appointmentDetails?.patient_name}
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
                        </label>
                            {selectedPatient && (
                                <div id='patient-chosen' style={{ marginTop: '8px' }}>
                                    <p>{selectedPatient.first_name} {selectedPatient.last_name}</p>
                                    <p>ID: {selectedPatient.student_id}</p>
                                </div>
                            )}
                        
                    <label htmlFor="">Service
                        <select name="" id="" value={appointmentDetails?.service_id}  onChange={(e) => setAppointmentDetails({...appointmentDetails, service_id: e.target.value})}> 
                            <option value={0}>Select Service</option>
                            {services.map(service => (
                                <option key={service.service_id} value={service.service_id}>
                                    {service.service_name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label htmlFor="date">Date
                        <input
                            type="date"
                            id='date'
                            value={appointmentDetails?.appointment_date}
                            onChange={(e) => setAppointmentDetails({ ...appointmentDetails, appointment_date: e.target.value })}
                        />
                    </label>

                    {/* <label htmlFor="time">Time
                        <input
                            type="time"
                            min="09:00" 
                            max="17:00"
                            value={appointmentDetails?.start_time}
                            onChange={(e) => setAppointmentDetails({ ...appointmentDetails, start_time: e.target.value })}
                        />
                    </label> */}

                    <label>Time
                        <select
                        value={appointmentDetails.start_time || ""}
                        onChange={e => setAppointmentDetails({ ...appointmentDetails, start_time: e.target.value })}
                        disabled={!appointmentDetails.appointment_date}
                        >
                        <option value="" disabled>Select Time</option>
                        {availableTime.map(time => (
                            <option key={time} value={time}>{time}</option>
                        ))}
                        </select>
                    </label>

                    <label htmlFor="">Status
                        <select name="" id="" value={appointmentDetails?.status} onChange={(e) => setAppointmentDetails({...appointmentDetails, status: e.target.value})}>
                            <option value='Upcoming'>Upcoming</option>
                            <option value='Completed'>Completed</option>
                            <option value='Cancelled'>Cancelled</option>
                        </select>
                    </label>

                </div>

            </div>
            <CancelSaveBtn hideForm={props.hideForm} submit={handleSubmit}/>         
        </div>
        </div>
    )
}