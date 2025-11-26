import '../routepages.css'
import '../app.css'
import AddPatientForm from '~/components/addpatientform'
import AddPatient from '~/components/addpatient'
import React from 'react'
import { NavLink } from 'react-router'

export default function Patients(){

    const [showForm, setShowForm] = React.useState(false)
    
    return(
            <div className="route-page">
                <h1 className="route-header">Patients</h1>
                <p className='route-page-desc'>Manage your patients and their medical records.</p>
                <input type="text" id='patient-searchbar' placeholder='Search patient'/>
                <button id='add-patient-btn' onClick={() => setShowForm(true)}>+ Add new patient</button>

                {showForm ? <AddPatient hideForm={() => setShowForm(false)} /> : null}
                {/* {showForm ?  <AddPatientForm hideForm={() => setShowForm(false)}/> : null} */}
                <div id='patients-table-container'>
                    <table id='patients-table'>
                    <tr>
                            <th className='photo-col' style={{width: '50px'}}></th>
                            <th className='idno-col' style={{width: '100px'}}>ID No</th>
                            <th style={{width: '250px'}}>Name</th>
                            <th>Department</th>
                            <th>Level</th>
                            <th>Sex</th>
                            <th>Last Record</th>
                        </tr>
                    </table>
                </div>
                <NavLink to='/patientdetails'>PATIENTdETAILS</NavLink>
            </div>
    )
}