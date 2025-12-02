import '../patients.css'
import '../app.css'
import AddRecord from '~/components/addrecord'
import React from 'react'
import { useParams } from 'react-router'

export default function PatientDetails(){

    const { id } = useParams()
    const [showAddRecord, setShowAddRecord] = React.useState(false)
    const [studentData, setStudentData] = React.useState()
    const [allergies, setAllergies] = React.useState()
    const [conditions, setConditions] = React.useState()

    React.useEffect(() => {
        fetch(`http://localhost:5000/getpatient?idnum=${id}`).then
        (res => res.json()).then(data => setStudentData(data[0]))
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
                    </table>
                </div>
            </div>
        </div>
    )
}