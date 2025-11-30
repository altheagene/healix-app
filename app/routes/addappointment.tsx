import '../routepages.css'
import '../appointments.css'
import Searchbar from '~/components/searchbar'
import { NavLink } from 'react-router'

export default function AddAppointment(){
    return(
        <div className="route-page" id='add-appointment-div'>
            <h1 className="route-header">Add Appointment</h1>
            <div>
                <div id='appointment-details'>
                    <p className='div-header'>Appointment Details</p>
                    <label htmlFor="reason">Reason
                        <input type="text" id='reason' />
                    </label>

                    <label htmlFor="date">Date
                        <input type="date" id='date'/>
                    </label>

                    <label htmlFor="time"> Time
                        <select name="time" id="time">
                            <option value="9:00">9:00</option>
                        </select>
                    </label>

                    <label htmlFor="notes">Notes
                        <input type="text" id='notes' />
                    </label>
                </div>

                <div id='appointment-patient'>
                    <p className='div-header'>Select Patient</p>
                    <div>
                        <div>
                            <input type='text' placeholder='Search patient'/>
                            <div id='search-patients-container'></div>
                        </div>
                        <div id='patient-chosen'>
                            <img></img>
                            <p id='patient-name'></p>
                            <p id='patient-idnum'></p>
                        </div>
                        <button id='register-patient-btn' style={{}}>
                            Register New Patient
                        </button>
                    </div>
                    
                </div>
            </div>
        </div>
    )
}