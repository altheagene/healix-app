import '../patients.css'
import '../app.css'
import AddRecord from '~/components/addrecord'
import React from 'react'
import { useParams } from 'react-router';
import 'bootstrap-icons/font/bootstrap-icons.css';


export default function PatientDetails(){

    const { id } = useParams()
    const [showAddRecord, setShowAddRecord] = React.useState(false)
    const [studentData, setStudentData] = React.useState()
    const [allergies, setAllergies] = React.useState()
    const [conditions, setConditions] = React.useState()
    const [clinicLogs, setClinicLogs]= React.useState<any[]>();

    React.useEffect(() => {
        fetch(`http://localhost:5000/getpatient?idnum=${id}`).then
        (res => res.json()).then(data => setStudentData(data[0]))

        fetch(`http://localhost:5000/getpatientcliniclogs?idnum=${id}`)
        .then(res => res.json())
        .then(data => setClinicLogs(data))
    }, [])

     React.useEffect(() => {
        fetch(`http://localhost:5000/getpatientallergies?idnum=${id}`).then
        (res => res.json()).then(data => setAllergies(data))
    }, [])

    React.useEffect(() => {
        fetch(`http://localhost:5000/getpatientconditions?idnum=${id}`).then
        (res => res.json()).then(data => setConditions(data))
    }, [])

    console.log(studentData)
    console.log(allergies)
    console.log(conditions)
    console.log(clinicLogs)
    return(
        <div className="route-page" id="patient-details-div" style={{backgroundColor: '#EEEEEE'}}>
            <h1 className='route-header'>Patient Details</h1>
            {showAddRecord ? <AddRecord hideForm={() => setShowAddRecord(false)}/> : null}
            <div id="patient-overview-div">
                <div id="photo-name-div">
                    <img></img>
                    <p>{studentData?.first_name} {studentData?.middle_name} {studentData?.last_name}</p>
                </div>
                <div id="patient-information" >
                    <div id="student-info">
                        <p className='patient-info'>Student Information</p>
                        <p>ID Number: {studentData?.student_id}</p>
                        <p>Department: {studentData?.department}</p>
                        <p>Level: {studentData?.level}</p>
                    </div>
                    <div id='medical-info' >
                        <p className='patient-info'>Medical Information</p>
                        <p>Allergies:</p>
                        <p>Conditions:</p>
                    </div>
                    <div id='emergency-contact'>
                        <p className='patient-info'>Emergency Contact</p>
                        <p>Name: {studentData?.emergency_contact_name}</p>
                        {/* <p>Relationship: </p> */}
                        <p>Contact no: {studentData?.emergency_contact_phone}</p>
                    </div>
                </div>
            </div>

            <div style={{marginTop: '2rem', width:'100%', padding: '1rem 0'}}>
                <div style={{width: '100%', display:'flex', justifyContent: 'space-between'}}>
                    <h2 style={{fontWeight: '500'}}>Clinic Visits</h2>
                    <button style={{height: '40px', width: '120px', backgroundColor: '#334FBD', borderRadius: '10px', color: 'white', border: 'none'}} onClick={() => setShowAddRecord(true)}>+ Add Record</button>
                </div>
                <div id='patient-visit-div' className='table-container'>
                    <table id='patient-visit-table'>
                        <tr>
                            <th>Date</th>
                            <th>Reason</th>
                            <th>Attending</th>
                            <th>Notes</th>
                            <th></th>
                        </tr>

                        {clinicLogs?.map(log => {
                            return(
                                <tr>
                                    <td>{log.visit_datetime}</td>
                                    <td>{log.service_name}</td>
                                    <td>{log.staff_name}</td>
                                    <td>{log.notes}</td>
                                    <td><button style={{backgroundColor: 'transparent', border: 'none', fontSize: '1.2rem'}}><i className='bi bi-eye'></i></button></td>
                                </tr>
                            )
                        })}
                    </table>
                </div>
            </div>
        </div>
    )
}