import '../routepages.css'
import '../appointments.css'
import Searchbar from '~/components/searchbar'
import React from 'react'
import { useNavigate } from 'react-router'
import 'bootstrap-icons/font/bootstrap-icons.css';


export default function Appointments() {

    const [apptStatus, setApptStatus] = React.useState('All Appointments')
    const apptStatuses = ['All Appointments', 'Today', 'Upcoming','Completed', 'Cancelled']
    const [appointments, setAppointments] = React.useState<any[]>([])
    const [searchQuery, setSearchQuery] = React.useState('')

    const navigate = useNavigate()
    const today = new Date().toISOString().split('T')[0]
    console.log(appointments)

    // Fetch appointments
    React.useEffect(() => {
        fetch(`http://localhost:5000/getallappointments`) 
            .then(res => res.json())
            .then(data => setAppointments(data))
    }, [])

    // Filter by status
    const filteredByStatus = appointments.filter(appt => {
        if (apptStatus === 'All Appointments') return true
        if (apptStatus === 'Today') return appt.appointment_date === today
        return appt.status === apptStatus
    })

    // Filter by search query
    const finalFiltered = filteredByStatus.filter(appt => {
        const name = appt.patient_name || ''
        return name.toLowerCase().includes(searchQuery.toLowerCase())
    })

    // Status filter buttons (keep your styling)
    const apptStatusBtns = apptStatuses.map(status => (
        <button
            key={status}
            className='appointment-status-btn'
            onClick={() => setApptStatus(status)}
            style={{ backgroundColor: apptStatus === status ? 'white' : ' rgb(230, 230, 230)' }}
        >
            {status}
        </button>
    ))

    function refetchAppts(){
        fetch(`http://localhost:5000/getallappointments`) 
            .then(res => res.json())
            .then(data => setAppointments(data))
    }
    
    async function markCompleted(appointment_id:any){
        const response = await fetch(`http://localhost:5000/updateappointment`, {
            method: 'POST',
            headers: {
                'Content-Type' : 'application/json'
            },
            body: JSON.stringify({appointment_id: appointment_id, status: 'Completed'})
        })

        console.log(await response.json())
        refetchAppts()
    }

    async function cancelAppt(appointment_id:any){
        const response = await fetch(`http://localhost:5000/updateappointment`, {
            method: 'POST',
            headers: {
                'Content-Type' : 'application/json'
            },
            body: JSON.stringify({appointment_id: appointment_id, status: 'Cancelled'})
        })

        console.log(await response.json())
        refetchAppts()
    }


    return (
        <div className="route-page">
            <h1 className="route-header">Appointments</h1>
            <p className='route-page-desc'>Manage your clinic's appointments and schedules.</p>

            {/* Searchbar */}
            <Searchbar
                id='appointments-searchbar'
                placeholder='Search by patient name'
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            />

            {/* Add Appointment Button */}
            <button id='add-appointment-btn' onClick={() => navigate('/addappointment')}>
                + Add Appointment
            </button>

            {/* Status Buttons */}
            <div id='today-appointment-status-bar'>
                {apptStatusBtns}
            </div>

            {/* Appointments Table */}
            <div className='appointments-table-container'>
                <table className='appointments-table'>
                    <thead>
                        <tr>
                            <th style={{width: '50px'}}></th>
                            <th>Patient</th>
                            <th>Type</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {finalFiltered.length > 0 ? finalFiltered.map(appt => (
                            <tr key={appt.appointment_id}>
                                <td></td>
                                <td>{appt.patient_name || ` ${appt.patient_name}`}</td>
                                <td>{appt.service_name}</td>
                                <td>{appt.appointment_date}</td>
                                <td>{appt.start_time}</td>
                                <td><p style={{padding: '0.3rem', 
                                                borderRadius: '10px',
                                                color:  'white',
                                                fontSize: '0.8rem',
                                                width: '90px',
                                                textAlign: 'center',
                                                fontWeight: '500',
                                                backgroundColor: appt.status === 'Completed' ? '#6EC207' : 
                                                appt.status === 'Cancelled' ? '#ed3e27' :
                                                 '#799EFF'}}>{appt.status}</p></td>
                                <td>
                                    {/* <button
                                        onClick={() => navigate(`/viewappointment/${appt.appointment_id}`)}
                                        className='view-appt-btn'
                                    >
                                        View
                                    </button> */}
                                    <div style={{display: 'flex', gap: '1rem'}}>
                                        <button style={{background: 'white', border: 'none', fontSize: '1.2rem', color: '#80e50dff'}}
                                                 title="Mark as Completed"
                                                  disabled={appt.status == 'Completed'}
                                                 onClick={() => markCompleted(appt.appointment_id)}><i className='bi bi-check-circle-fill'
                                                ></i></button>
                                        <button style={{background: 'white', border: 'none', fontSize: '1.2rem', color: '#ED3F27'}}
                                                 title="Cancel Appointment"
                                                 disabled={appt.status == 'Cancelled'}
                                                 onClick={() => cancelAppt(appt.appointment_id)}><i className='bi bi-x-circle-fill'
                                                 ></i></button>
                                        <button style={{background: 'white', border: 'none', fontSize: '1.2rem', color: 'orange'}}
                                                title='Edit Appointment'><i className='bi bi-pen'></i></button>
                                    </div>
                                    
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '15px' }}>
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
