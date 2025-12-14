import '../routepages.css'
import '../appointments.css'
import React from 'react'
import { useNavigate } from 'react-router'
import 'bootstrap-icons/font/bootstrap-icons.css'
import EditAppointment from '~/components/editappointment'
import {API_BASE_URL} from '../config'

export default function Appointments() {
    const [width, setWidth] = React.useState(0)
    
    React.useEffect(() => {
        const handleResize = () => setWidth(window.innerWidth)
        handleResize()
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])
    const today = new Date().toISOString().split('T')[0]
    const [apptStatus, setApptStatus] = React.useState('All')
    const [apptID, setApptId] = React.useState()
    const apptStatuses = ['All', 'Today', 'Upcoming', 'Completed', 'Cancelled']
    const [appointments, setAppointments] = React.useState<any[]>([])
    const [searchQuery, setSearchQuery] = React.useState('')
    const [showEdit, setShowEdit] = React.useState(false)
    const [flashMessage, setFlashMessage] = React.useState<{type: 'success' | 'error', message: string} | null>(null)
    const [selectedDate, setSelectedDate] = React.useState(); // default to today


    const navigate = useNavigate()
    

    // Fetch appointments
    React.useEffect(() => {
        refetchAppts()
    }, [])

    function refetchAppts() {
        fetch(`${API_BASE_URL}/getallappointments`) 
            .then(res => res.json())
            .then(data => setAppointments(data))
    }

    // Show flash message
    const showFlash = (type: 'success' | 'error', message: string) => {
        setFlashMessage({ type, message })
        setTimeout(() => setFlashMessage(null), 2000)
    }

    // Mark completed
    async function markCompleted(appointment_id: any) {
        try {
            await fetch(`${API_BASE_URL}/updateappointment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ appointment_id, status: 'Completed' })
            })
            refetchAppts()
            showFlash('success', 'Appointment marked as Completed')
        } catch (err) {
            console.error(err)
            showFlash('error', 'Failed to update appointment')
        }
    }

    // Cancel appointment
    async function cancelAppt(appointment_id: any) {
        try {
            await fetch(`${API_BASE_URL}/updateappointment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ appointment_id, status: 'Cancelled' })
            })
            refetchAppts()
            showFlash('success', 'Appointment Cancelled')
        } catch (err) {
            console.error(err)
            showFlash('error', 'Failed to update appointment')
        }
    }

    // Filter appointments
    const filteredByStatus = appointments.filter(appt => {
        if (apptStatus === 'All') return true
        if (apptStatus === 'Today') return appt.appointment_date === today
        return appt.status === apptStatus
    })

    const filteredAppointments = appointments
    .filter(appt => {
        // Filter by selected date
        if (selectedDate) {
            return appt.appointment_date === selectedDate;
        }
        return true;
    })
    .filter(appt => {
        // Filter by status
        if (apptStatus === 'All') return true;
        return appt.status === apptStatus;
    })
    .filter(appt => {
        // Filter by search query
        const patientName = appt.patient_name?.toLowerCase() || '';
        const serviceName = appt.service_name?.toLowerCase() || '';
        const query = searchQuery.toLowerCase();
        return patientName.includes(query) || serviceName.includes(query);
    });


    

    return (
        <div className="route-page">
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

            {showEdit && <EditAppointment appt={apptID} hideForm={() => setShowEdit(false)} refetch={refetchAppts} />}
            
            <h1 className="route-header">Appointments</h1>
            <p className='route-page-desc'>Manage your clinic's appointments and schedules.</p>

            <input type='text'
                id='searchbar'
                placeholder='Search by patient or service'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            <input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)} 
                style={{ marginLeft: '10px', padding: '5px', borderRadius: '5px' }}
            />
            <div className="appointments-controls">
                <div id="today-appointment-status-bar">
                    {apptStatuses.map(status => (
                        <button
                            key={status}
                            className={`appointment-status-btn ${apptStatus === status ? 'active' : ''}`}
                            onClick={() => setApptStatus(status)}
                        >
                            {status}
                        </button>
                    ))}
                </div>
                <button className='add-button' onClick={() => navigate('/addappointment')}>
                    + Add Appointment
                </button>
            </div>

            <div className='table-container'>
                <table className='appointments-table'>
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
                                    }}>{appt.status}</p>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button
                                            style={{ background: 'white', border: 'none', fontSize: '1.2rem', color: '#80e50dff' }}
                                            title="Mark as Completed"
                                            disabled={appt.status === 'Completed'}
                                            onClick={() => markCompleted(appt.appointment_id)}
                                        ><i className='bi bi-check-circle-fill'></i></button>

                                        <button
                                            style={{ background: 'white', border: 'none', fontSize: '1.2rem', color: '#ED3F27' }}
                                            title="Cancel Appointment"
                                            disabled={appt.status === 'Cancelled'}
                                            onClick={() => cancelAppt(appt.appointment_id)}
                                        ><i className='bi bi-x-circle-fill'></i></button>

                                        <button
                                            style={{ background: 'white', border: 'none', fontSize: '1.2rem', color: 'orange' }}
                                            title='Edit Appointment'
                                            onClick={() => {setApptId(appt); setShowEdit(true)}}
                                        ><i className='bi bi-pen'></i></button>
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
