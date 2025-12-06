import '../routepages.css'
import '../app.css'
import AddPatient from '~/components/addpatient'
import React from 'react'
import { useNavigate } from 'react-router'

export default function Patients() {
    const navigate = useNavigate()
    const [showForm, setShowForm] = React.useState(false)
    const [allPatients, setAllPatients] = React.useState<any[]>([])
    const [searchTerm, setSearchTerm] = React.useState("")

    React.useEffect(() => {
        fetch(`http://localhost:5000/getallpatients`)
            .then(res => res.json())
            .then(data => setAllPatients(data))
    }, [])

    function refetchPatients() {
        fetch(`http://localhost:5000/getallpatients`)
            .then(res => res.json())
            .then(data => setAllPatients(data))
    }

    // Filter patients based on search term
    const filteredPatients = allPatients.filter(patient =>
        `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.student_id.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="route-page">
            <h1 className="route-header">Patients</h1>
            <p className='route-page-desc'>Manage your patients and their medical records.</p>

            {/* Searchbar */}
            <input
                type="text"
                id='patient-searchbar'
                placeholder='Search patient'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />

            {/* Add Patient Button */}
            <button id='add-patient-btn' onClick={() => setShowForm(true)}>+ Add new patient</button>

            {/* Add Patient Form */}
            {showForm && <AddPatient hideForm={() => setShowForm(false)} refetchPatients={refetchPatients}/>}

            {/* Patients Table */}
            <div id='patients-table-container' className='table-container'>
                <table id='patients-table'>
                    <thead>
                        <tr>
                            <th className='photo-col' style={{width: '50px'}}></th>
                            <th className='idno-col' style={{width: '150px'}}>ID No</th>
                            <th style={{width: '150px'}}>Name</th>
                            <th>Department</th>
                            <th>Level</th>
                            <th>Sex</th>
                            <th>Last Record</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPatients.map(patient => (
                            <tr key={patient.patient_id} onClick={() => navigate(`/patientdetails/${patient.patient_id}`)}>
                                <td></td>
                                <td>{patient.student_id}</td>
                                <td>{patient.first_name} {patient.last_name}</td>
                                <td>{patient.department}</td>
                                <td>{patient.level}</td>
                                <td>{patient.sex}</td>
                                <td></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
