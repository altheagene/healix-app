import '../routepages.css'
import '../appointments.css'
import Searchbar from '~/components/searchbar'
import { NavLink } from 'react-router'

import { useNavigate } from 'react-router'

export default function Appointments(){

    const navigate = useNavigate()
    return(
        <div className="route-page">
            <h1 className="route-header">Appointments</h1>
            <p className='route-page-desc'>Manage your clinic's appointments and schedules.</p>
            <Searchbar id='appointments-searchbar' placeholder='Search by patient name'/>
            <button id='add-appointment-btn' onClick={() => navigate('/addappointment')}>+ Add Appointment</button>

            <div id='filter-btns'>
                <button className='filter-btn'>Today</button>
                <button className='filter-btn'>Future</button>
                <button className='filter-btn'>All History</button>
            </div>

            <div id='appointments-list'>
                <div id='today-appointments' className='appointment-div'>
                    <div id='today-appointment-status-bar'>
                        <button className='appointment-status-btn'>Upcoming</button>
                        <button className='appointment-status-btn'>In-Progress</button>
                        <button className='appointment-status-btn'>Completed</button>
                        <button className='appointment-status-btn'>Cancelled</button>
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