import '../routepages.css'
import '../appointments.css'
import Searchbar from '~/components/searchbar'
import { NavLink } from 'react-router'
import React from 'react'

import { useNavigate } from 'react-router'

export default function Appointments(){

    const [apptType, setApptType] = React.useState('Today');
    const [apptStatus, setApptStatus] = React.useState('Upcoming')
    const apptTypes = ['Today', 'Future', 'Past'];
    const apptStatuses = ['Upcoming', 'In-Progress', 'Completed', 'Cancelled'];

    // DYNAMIC COMPONENTS
    const apptTypeBtns = apptTypes.map(type => {
        return(
             <button className='filter-btn' 
                    onClick={() => setApptType(type)}
                    style={{backgroundColor: type === apptType ? '#FACB38' : 'white'}}>
                        {type}</button>
        )
    })

    const apptStatusBtns = apptStatuses.map(status => {
        return(
            <button className='appointment-status-btn' 
                    onClick={() => setApptStatus(status)}
                    style={{backgroundColor: apptStatus === status ? 'white' : ' rgb(230, 230, 230)'}}>
                        {status}</button>
        )
    })



    const navigate = useNavigate()
    return(
        <div className="route-page">
            <h1 className="route-header">Appointments</h1>
            <p className='route-page-desc'>Manage your clinic's appointments and schedules.</p>
            <Searchbar id='appointments-searchbar' placeholder='Search by patient name'/>
            <button id='add-appointment-btn' onClick={() => navigate('/addappointment')}>+ Add Appointment</button>

            <div id='filter-btns'>
                {apptTypeBtns}
            </div>

            <div id='appointments-list'>
                <div id='today-appointments' className='appointment-div'>
                    <div id='today-appointment-status-bar'>
                       {apptStatusBtns}
                    </div>
                    <div className='appointments-table-container'>
                        <table className='appointments-table'>
                            <tr>
                                <th style={{width: '50px'}}></th>
                                <th>ID No</th>
                                <th>Name</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th></th>
                            </tr>
                        </table>
                    </div>
                </div>

            </div>
           
        </div>
    )
}