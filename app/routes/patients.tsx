import '../routepages.css'
import '../app.css'
import AddPatientForm from '~/components/addpatientform'
import AddPatient from '~/components/addpatient'
import React from 'react'
import { NavLink, useNavigate } from 'react-router'


export default function Patients(){
    const navigate = useNavigate()
    const [showForm, setShowForm] = React.useState(false);
    const [allPatients, setAllPatients] = React.useState<any[]>([]);
    const [tableData, setTableData] = React.useState<any[]>([]);

    console.log(allPatients)
    React.useEffect(() => {
        fetch(`http://localhost:5000/getallpatients`).
        then(res => res.json()).
        then(data => setAllPatients(data))
    }, [])


    function refetchPatients(){
        fetch(`http://localhost:5000/getallpatients`).
        then(res => res.json()).
        then(data => setAllPatients(data))
    }

    function viewPatientDetails(){
        navigate(`/patientdetails`)
    }
    
    return(
            <div className="route-page">
                <h1 className="route-header">Patients</h1>
                <p className='route-page-desc'>Manage your patients and their medical records.</p>
                <input type="text" id='patient-searchbar' placeholder='Search patient'/>
                <button id='add-patient-btn' onClick={() => setShowForm(true)}>+ Add new patient</button>

                {showForm ? <AddPatient hideForm={() => setShowForm(false)} refetchPatients={refetchPatients}/> : null}
                {/* {showForm ?  <AddPatientForm hideForm={() => setShowForm(false)}/> : null} */}
                <div id='patients-table-container' className='table-container'>
                    <table id='patients-table'>
                        <tr>
                            <th className='photo-col' style={{width: '50px'}}></th>
                            <th className='idno-col' style={{width: '150px'}}>ID No</th>
                            <th style={{width: '150px'}}>Name</th>
                            <th>Department</th>
                            <th>Level</th>
                            <th>Sex</th>
                            <th>Last Record</th>
                        </tr>

                        {allPatients.map(patient => {
                            return(
                                <tr onClick={() => navigate(`/patientdetails/${patient.patient_id}`)}>
                                    <td></td>
                                    <td >{patient.student_id}</td>
                                    <td >{patient.first_name} {patient.last_name}</td>
                                    <td>{patient.department}</td>
                                    <td>{patient.level}</td>
                                    <td>{patient.sex}</td>
                                    <td></td>
                                </tr>
                            )
                        })}
                    </table>
                </div>
                {/* <NavLink to='/patientdetails'>Patient Details</NavLink> */}
               
            </div>
    )
}