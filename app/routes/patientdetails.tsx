import '../patients.css'
import '../app.css'
import AddRecord from '~/components/addrecord'
import EditPatient from '~/components/editpatient'
import ViewVisit from '~/components/viewVisit'
import React from 'react'
import { useParams } from 'react-router';
import { useNavigate } from 'react-router'
import 'bootstrap-icons/font/bootstrap-icons.css';
import user from '../images/user.png'
import {API_BASE_URL} from '../config'
import EditRecord from '~/components/editrecord'



export default function PatientDetails(){

    const { id } = useParams()
    const navigate = useNavigate()
    const [showAddRecord, setShowAddRecord] = React.useState(false)
    const [showEdit, setShowEdit] = React.useState(false)
    const [showVisit, setShowVisit] = React.useState(false)
    const [showEditRecord, setShowEditRecord] = React.useState(false)
    const [recordToEdit, setRecordToEdit] = React.useState()
    const [visitChosen, setVisitChosen] = React.useState(false)

    const [studentData, setStudentData] = React.useState()
    const [allergies, setAllergies] = React.useState<any[]>()
    const [conditions, setConditions] = React.useState<any[]>()
    const [clinicLogs, setClinicLogs]= React.useState<any[]>();

    React.useEffect(() => {
        fetch(`${API_BASE_URL}/getpatient?idnum=${id}`).then
        (res => res.json()).then(data => setStudentData(data[0]))

        fetch(`${API_BASE_URL}/getpatientcliniclogs?idnum=${id}`)
        .then(res => res.json())
        .then(data => setClinicLogs(data))
    }, [])

     React.useEffect(() => {
        fetch(`${API_BASE_URL}/getpatientallergies?idnum=${id}`).then
        (res => res.json()).then(data => setAllergies(data))
    }, [])

    React.useEffect(() => {
        fetch(`${API_BASE_URL}/getpatientconditions?idnum=${id}`).then
        (res => res.json()).then(data => setConditions(data))
    }, [])

    async function refetch(){
        fetch(`${API_BASE_URL}/getpatientcliniclogs?idnum=${id}`)
        .then(res => res.json())
        .then(data => setClinicLogs(data))

        await fetch(`${API_BASE_URL}/getpatient?idnum=${id}`).then
        (res => res.json()).then(data => setStudentData(data[0]))

         fetch(`${API_BASE_URL}/getpatientallergies?idnum=${id}`).then
        (res => res.json()).then(data => setAllergies(data))
    }

    function isBeyond24Hours(dateStr: string | null | undefined): boolean {
        if (!dateStr) return false;

        const inputDate = new Date(dateStr);

        // guard against invalid date strings
        if (isNaN(inputDate.getTime())) return false;

        const now = new Date();
        const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

        return now.getTime() - inputDate.getTime() > TWENTY_FOUR_HOURS;
    }


    console.log(clinicLogs)
    return(
        <div className="route-page" id="patient-details-div" >

            <div style={{display: 'flex', gap: '1rem'}}>
                <button
                    onClick={() => navigate(-1)}
                    className='back-btn'>
                        <i className="bi bi-caret-left-fill"></i>
                    </button>  
                <h1 className='route-header'>Patient Details</h1>
            </div>
            {showEditRecord && <EditRecord record={recordToEdit} hideForm={() => setShowEditRecord(false)} refetch={refetch}/>}
            {showVisit && visitChosen? <ViewVisit visit={visitChosen} hideForm={() => setShowVisit(false)}/> : null}
            {showEdit ? <EditPatient studentData={studentData} allergies={allergies} conditions={conditions} refetch={refetch} hideForm={() => setShowEdit(false)}/> : null}
            {showAddRecord ? <AddRecord hideForm={() => setShowAddRecord(false)} refetch={refetch} /> : null}

            <div>
                <div id="patient-overview-div">
                    <div id="photo-name-div" style={{position: 'relative'}}>
                        <img src={user}></img>
                        <p>{studentData?.first_name} {studentData?.middle_name} {studentData?.last_name}</p>
                        <button
                            onClick={() => setShowEdit(true)}
                            style={{
                                height: '25px',
                                width: '80px',
                                backgroundColor: 'transparent', // nice blue
                                borderRadius: '10px',
                                color: 'white',
                                border: '1px solid #ccc',
                                cursor: 'pointer',
                                fontWeight: '700',
                                marginBottom: '1rem',
                                top: '0.6em',
                                right: '1rem',
                                position: 'absolute'
                            }}
                            >
                            Edit
                            <i className='bi bi-pencil' style={{marginLeft: '0.5rem'}}></i>
                        </button>
                    </div>
                    <div id="patient-information" >
                        <div id="student-info" className='info-div'>
                            <p className='patient-info'><i className='bi bi-person-fill' style={{marginRight: '0.5rem'}}></i>Student Information</p>
                            <div className='patient-info-div'>
                                <p>Sex: <span>{studentData?.sex}</span></p>
                                <p>Level: <span>{studentData?.level}</span></p>
                                <p>ID Number: <span>{studentData?.student_id}</span></p>
                                <p>Department: <span>{studentData?.department}</span></p>
                                <p>Email: <span>{studentData?.email}</span></p>
                                <p>Phone: <span>{studentData?.phone}</span></p>
                            </div>
                            
                        </div>
                        <div id='medical-info'  className='info-div'>
                            <p className='patient-info'><i className='bi bi-heart-pulse-fill' style={{marginRight: '0.5rem'}}></i>Medical Information</p>
                            <div className='patient-info-div'>
                                <div> <p>Allergies:</p>
                                    <span style={{display: 'flex', gap: '0.5rem'}}>
                                            {allergies?.map(allergy => {
                                                return(
                                                    <div style={{padding: '0.3rem', 
                                                                backgroundColor: '#6dc3ba5d',
                                                                fontSize: '0.8rem', 
                                                                borderRadius: '10px',
                                                                border: '1px solid #ccc',
                                                                width: 'fit-content',
                                                            flexWrap: 'wrap'}}>{allergy.allergy_name}</div>
                                                )
                                            })}
                                    </span>
                                </div>
                                <div><p>Conditions:</p>
                                    <span style={{display: 'flex', gap: '0.5rem'}}>
                                            {conditions?.map(condition => {
                                                return(
                                                    <div style={{padding: '0.3rem', 
                                                                backgroundColor: '#6dc3ba5d',
                                                                fontSize: '0.8rem', 
                                                                borderRadius: '10px',
                                                                border: '1px solid #ccc',
                                                                width: 'fit-content'}}>{condition.condition_name}</div>
                                                )
                                            })}
                                    </span>
                                </div>

                                <p>Notes: {studentData?.notes}</p>
                            </div>
                        </div>
                        <div id='emergency-contact'  className='info-div'>
                            <p className='patient-info'><i className='bi bi-telephone-fill' style={{marginRight: '0.5rem'}}></i>Emergency Contact</p>
                            <div className='patient-info-div'>
                                <p>Name: <span>{studentData?.emergency_contact_name}</span></p>
                                {/* <p>Relationship: </p> */}
                                <p>Contact no: <span>{studentData?.emergency_contact_phone}</span></p>
                            </div>
                          
                        </div>
                    </div>
                </div>

                <div style={{marginTop: '2rem', width:'100%', padding: '1rem 0'}}>
                    <div style={{width: '100%', display:'flex', justifyContent: 'space-between'}}>
                        <h2 style={{fontWeight: '500'}}>Clinic Visits</h2>
                        <button style={{height: '40px', width: '120px', backgroundColor: '#334FBD', borderRadius: '10px', color: 'white', border: 'none'}} onClick={() => setShowAddRecord(true)}>+ Add Record</button>
                    </div>
                    <div 
                        // id='patient-visit-div' 
                        className='table-container'>
                        <table id='patient-visit-table'>
                            <tr>
                                <th>Date</th>
                                <th>Reason</th>
                                <th>Attending</th>
                                <th>Notes</th>
                                <th></th>
                            </tr>

                            { clinicLogs?.length > 0 ? clinicLogs?.map(log => {
                                return(
                                    <tr>
                                        <td>{log.visit_datetime}</td>
                                        <td>{log.service_name}</td>
                                        <td>{log.staff_name}</td>
                                        <td>{log.notes}</td>
                                        <td>
                                            <button style={{backgroundColor: 'transparent', border: 'none', fontSize: '1.2rem', marginRight: '1rem'}}
                                                    onClick={() => {setShowVisit(true); setVisitChosen(log)}}>
                                                <i className='bi bi-eye'></i>
                                            </button>

                                            {/* <button 
                                                onClick={() => {setShowEditRecord(true); setRecordToEdit(log)}}
                                                style={{backgroundColor: 'transparent', border: 'none', fontSize: '1.2rem'}}
                                                disabled={isBeyond24Hours(log?.visit_datetime)}
                                                    >
                                                <i className='bi bi-pencil'></i>
                                            </button> */}
                                        </td>
                                    </tr>
                                )
                            }) :
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '15px' }}>
                                        No Clinic Records found
                                    </td>
                                </tr>
                            }
                        </table>
                    </div>
                </div>
            </div>
            
        </div>
    )
}