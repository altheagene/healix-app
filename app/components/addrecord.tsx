
import { useParams } from "react-router"
import CancelSaveBtn from "./cancelsavebtn"
import React from "react"

export default function AddRecord(props:any){

    const {id} = useParams()
    const [services, setServices] = React.useState<any[]>()
    const [staff, setStaff] = React.useState<any[]>()
    const [recordDetails, setRecordDetails] = React.useState({
        patient_id: id,
        appointment_id: null,
        weight: '',
        temperature: '',
        visit_datetime : '',
        service_id: 1,
        reason: '',
        staff_id: 1,
        notes: ''

    })

    React.useEffect(() => {
        fetch(`http://localhost:5000/getall?table=services`)
        .then(res => res.json())
        .then(data => setServices(data))

        fetch(`http://localhost:5000/getall?table=staff`)
        .then(res => res.json())
        .then(data => setStaff(data))
    }, [])

    function handleSubmit(){
        console.log(recordDetails)
    }
    console.log(services)

    return(
        <div id="add-record-div">
            <div className="gray-bg"></div>
            <div id="add-record-form" className="modal-form">
                <div className="modal-header-div">
                    <p className="modal-header">Visit Log</p>
                </div>
                
                <div className="main-form-content">

                    <label htmlFor="">Date
                        <input type="date" value={new Date().toISOString().split("T")[0]} style={{width: '70%'}}/>
                    </label>
                    {/* <label htmlFor="reason">Reason
                        <textarea name="reason" id="reason" rows='5' cols='50'></textarea>
                    </label> */}

                    <label htmlFor="">Reason
                        <select name="" id="" style={{display: 'block', width: '70%', marginTop: '0.3rem'}} value={recordDetails?.service_id} onChange={(e) => setRecordDetails({...recordDetails, service_id: parseInt(e.target.value)})}>
                            {services?.map(service => {
                                return(
                                    <option value={service.service_id}>{service.service_name}</option> 
                                )
                            })}
                        </select>
                    </label>

                    <div style={{display: 'flex', width: '100%', gap: '1rem'}}>
                        <label htmlFor="weight">Weight
                            <input type="text" id="weight" value={recordDetails?.weight} onChange={(e) => setRecordDetails({...recordDetails, weight: e.target.value})}/>
                        </label>

                        <label htmlFor="temp">Temperature
                            <input type="text" id="temp"  value={recordDetails?.temperature} onChange={(e) => setRecordDetails({...recordDetails, temperature: e.target.value})}/>
                        </label>
                    </div>

                    <div style={{display: 'flex', width: '100%', gap: '1rem'}}>
                        <label htmlFor="medication">Medication
                            <input type="text" id="medication" />
                        </label>

                        <label htmlFor="quantity">Quantity
                            <input type="number" id="quantity"/>
                        </label>
                    </div>

                    <label htmlFor="">Staff
                        <select name="" id="" style={{display: 'block', width: '70%', marginTop: '0.3rem'}} value={recordDetails?.staff_id} onChange={(e) => setRecordDetails({...recordDetails, staff_id: parseInt(e.target.value)})}>
                            {staff?.map(person => {
                                return(
                                    <option value={person.staff_id}>{person.first_name} {person.last_name}</option>
                                )
                            })}
                        </select>
                    </label>

                    <label htmlFor="reason">Notes
                        <textarea name="notes" id="notes" rows='5' cols='50'></textarea>
                    </label>
                </div>

                <CancelSaveBtn hideForm={props.hideForm} submit={handleSubmit}/>
            </div>
        </div>
    )
}