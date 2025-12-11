import '../routepages.css'
import '../appointments.css'
import Searchbar from '~/components/searchbar'
import React from 'react'
import { useNavigate } from 'react-router'
import 'bootstrap-icons/font/bootstrap-icons.css'
import EditAppointment from '~/components/editappointment'
import {API_BASE_URL} from '../config'


export default function Appointments() {
    const [apptStatus, setApptStatus] = React.useState('All Appointments')
    const [apptID, setApptId] = React.useState();
    const apptStatuses = ['All Appointments', 'Today', 'Upcoming', 'Completed', 'Cancelled']
    const [appointments, setAppointments] = React.useState<any[]>([])
    const [searchQuery, setSearchQuery] = React.useState('')
    const [showEdit, setShowEdit] = React.useState(false);

    const navigate = useNavigate()
    const today = new Date().toISOString().split('T')[0]

    // Fetch appointments
    React.useEffect(() => {
        fetch(`${API_BASE_URL}/getallappointments`) 
            .then(res => res.json())
            .then(data => setAppointments(data))
    }, [])

    // Refetch appointments
    function refetchAppts() {
        fetch(`${API_BASE_URL}/getallappointments`) 
            .then(res => res.json())
            .then(data => setAppointments(data))
    }

    // Mark completed
    async function markCompleted(appointment_id: any) {
        await fetch(`${API_BASE_URL}/updateappointment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ appointment_id, status: 'Completed' })
        })
        refetchAppts()
    }

    // Cancel appointment
    async function cancelAppt(appointment_id: any) {
        await fetch(`${API_BASE_URL}/updateappointment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ appointment_id, status: 'Cancelled' })
        })
        refetchAppts()
    }

    // Filter appointments by status
    const filteredByStatus = appointments.filter(appt => {
        if (apptStatus === 'All Appointments') return true
        if (apptStatus === 'Today') return appt.appointment_date === today
        return appt.status === apptStatus
    })

    // Filter by search query (patient name or service)
    const filteredAppointments = filteredByStatus.filter(appt => {
        const patientName = appt.patient_name?.toLowerCase() || ''
        const serviceName = appt.service_name?.toLowerCase() || ''
        const query = searchQuery.toLowerCase()
        return patientName.includes(query) || serviceName.includes(query)
    })

    return (
        <div className="route-page">
            {showEdit ? <EditAppointment appt={apptID} hideForm={() => setShowEdit(false)} refetch={refetchAppts}/> : null}
            <h1 className="route-header">Appointments</h1>
            <p className='route-page-desc'>Manage your clinic's appointments and schedules.</p>

            {/* Searchbar */}
            <input type='text'
                id='appointments-searchbar'
                placeholder='Search by patient or service'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />

            {/* Add Appointment Button */}
            <button id='add-appointment-btn' onClick={() => navigate('/addappointment')}>
                + Add Appointment
            </button>

            {/* Status Buttons */}
            <div id='today-appointment-status-bar'>
                {apptStatuses.map(status => (
                    <button
                        key={status}
                        className='appointment-status-btn'
                        onClick={() => setApptStatus(status)}
                        style={{ backgroundColor: apptStatus === status ? 'white' : ' rgb(230, 230, 230)' }}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {/* Appointments Table */}
            <div className=' table-container'>
                <table 
                    className='appointments-table'>
                    <thead>
                        <tr>
                            <th>Patient</th>
                            <th>Type</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAppointments.length > 0 ? filteredAppointments.map(appt => (
                            <tr key={appt.appointment_id}>
                                <td>{appt.patient_name}</td>
                                <td>{appt.service_name}</td>
                                <td>{appt.appointment_date}</td>
                                <td>{appt.start_time}</td>
                                <td>
                                    <p style={{
                                        padding: '0.3rem', 
                                        borderRadius: '10px',
                                        color: 'white',
                                        fontSize: '0.8rem',
                                        width: '90px',
                                        textAlign: 'center',
                                        fontWeight: '500',
                                        backgroundColor: appt.status === 'Completed' ? '#6EC207' :
                                                         appt.status === 'Cancelled' ? '#ed3e27' :
                                                         '#799EFF'
                                    }}>
                                        {appt.status}
                                    </p>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button
                                            style={{ background: 'white', border: 'none', fontSize: '1.2rem', color: '#80e50dff' }}
                                            title="Mark as Completed"
                                            disabled={appt.status === 'Completed'}
                                            onClick={() => markCompleted(appt.appointment_id)}
                                        >
                                            <i className='bi bi-check-circle-fill'></i>
                                        </button>
                                        <button
                                            style={{ background: 'white', border: 'none', fontSize: '1.2rem', color: '#ED3F27' }}
                                            title="Cancel Appointment"
                                            disabled={appt.status === 'Cancelled'}
                                            onClick={() => cancelAppt(appt.appointment_id)}
                                        >
                                            <i className='bi bi-x-circle-fill'></i>
                                        </button>
                                        <button
                                            style={{ background: 'white', border: 'none', fontSize: '1.2rem', color: 'orange' }}
                                            title='Edit Appointment'
                                            onClick={() => {setApptId(appt); setShowEdit(true)}}
                                        >
                                            <i className='bi bi-pen'></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '15px' }}>
                                    No appointments found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
