import '../patients.css'
import AddRecord from '~/components/addrecord'
import React from 'react'

export default function PatientDetails(){

    const [showAddRecord, setShowAddRecord] = React.useState(false)
    return(
        <div className="route-page" id="patient-details-div" style={{backgroundColor: '#EEEEEE'}}>
            <h1 className='route-header'>Patient Details</h1>
            {showAddRecord ? <AddRecord hideForm={() => setShowAddRecord(false)}/> : null}
            <div id="patient-overview-div">
                <div id="photo-name-div">
                    <img></img>
                    <p>name here</p>
                </div>
                <div id="patient-information">
                    <div id="student-info">
                        <p>Student Information</p>
                        <p>ID Number: </p>
                        <p>Department:</p>
                        <p>Level: </p>
                    </div>
                    <div id='medical-info'>
                        <p>Medical Information</p>
                        <p>Allergies:</p>
                        <p>Conditions:</p>
                    </div>
                    <div id='emergency-contact'>
                        <p>Emergency Contact</p>
                        <p>Name: </p>
                        <p>Relationship: </p>
                        <p>Contact no: </p>
                    </div>
                </div>
            </div>

            <div style={{marginTop: '2rem', width:'100%', padding: '1rem 0'}}>
                <div style={{width: '100%', display:'flex', justifyContent: 'space-between'}}>
                    <h2 style={{fontWeight: '500'}}>Clinic Visits</h2>
                    <button style={{height: '40px', width: '120px', backgroundColor: '#334FBD', borderRadius: '10px', color: 'white', border: 'none'}} onClick={() => setShowAddRecord(true)}>+ Add Record</button>
                </div>
                <div id='patient-visit-div'>
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