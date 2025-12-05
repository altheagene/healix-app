
import { useParams } from "react-router"
import CancelSaveBtn from "./cancelsavebtn"
import React from "react"

export default function AddRecord(props:any){

    const {id} = useParams()
    const now = new Date()
    const [services, setServices] = React.useState<any[]>()
    const [staff, setStaff] = React.useState<any[]>()
    const [recordDetails, setRecordDetails] = React.useState({
        patient_id: id,
        appointment_id: null,
        weight: '',
        temperature: '',
        visit_datetime : now.toISOString().replace('T', ' ').slice(0, 19),
        service_id: 1,
        staff_id: staff?[0]?.staff_id : 0,
        notes: '',

    })
    const [medicines, setMedicine] = React.useState<any[]>();
    const [medications, setMedications] = React.useState<{ supply_id: number | null; auto_deduct: false | true; quantity: number }[]>([]);
    React.useEffect(() => {
        fetch(`http://localhost:5000/getall?table=services`)
        .then(res => res.json())
        .then(data => setServices(data))

        fetch(`http://localhost:5000/getall?table=staff`)
        .then(res => res.json())
        .then(data => setStaff(data))

        fetch(`http://localhost:5000/getallmedicine`)
        .then(res => res.json())
        .then(data => setMedicine(data))
    }, [])

    React.useEffect(() => {
    if (staff && staff.length > 0) {
        setRecordDetails({...recordDetails,staff_id: staff[0].staff_id});
    }
    }, [staff]);

    async function handleSubmit(){
        const response = await fetch(`http://localhost:5000/addvisitlog`,
            {
                method: 'POST',
                headers: {
                    'Content-Type' : 'application/json'
                },
                body: JSON.stringify(recordDetails)
            }
        )

        const addmed = await fetch(`http://localhost:5000/addmedicationdetails`,
            {
                method: 'POST',
                headers: {
                    'Content-Type' : 'application/json'
                },
                body: JSON.stringify(medications)
            }
        )

        console.log(await response.json())
        console.log(medications)
    }
    console.log(services)
    console.log(medications)
    console.log(medicines)
    console.log(staff)

    function addMedication() {
            setMedications([...medications, { supply_id: medicines[0].supply_id, auto_deduct: medicines[0].auto_deduct, quantity: 1 }]
        );
    }

    function updateMedication(
        index: number,
        field: "supply_id" | "quantity",
        value: any
    ) {
        const updated = [...medications];
        updated[index][field] = value;
        console.log(value)
        if (field === "supply_id"){
             const med = medicines?.find(m => m.supply_id === parseInt(value))
            if (med.auto_deduct === 0){
                updated[index]['auto_deduct'] = false;
                updated[index]['quantity'] = 0
            }else{
                updated[index]['auto_deduct'] = true;
            }
        }

        setMedications(updated);
    }

    function removeMedication(index: number) {
        setMedications(medications.filter((_, i) => i !== index));
    }
    

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

                    <div style={{ width: '100%' }}>
                        <label>Medications</label>

                        {medications.map((med, index) => (
                            <div key={index} style={{display: 'flex', gap: '1rem', marginTop: '0.5rem'}}>
                                
                               
                                    <select value={med.supply_id ?? ""} 
                                            onChange={(e) => updateMedication(index, 'supply_id', e.target.value)}
                                            style={{display: 'block'}}>
                                        {medicines?.map(med => {
                                            return(
                                                <option value={med.supply_id}>{med.supply_name}</option>
                                            )
                                        })}
                                    </select>
                              

                                {med.auto_deduct && 
                                    <label htmlFor="" style={{width: '150px'}}>Quantity
                                        <input
                                            type="number"
                                            min="1"
                                            style={{ width: "100%" }}
                                            value={med.quantity}
                                            // readOnly={med.auto_deduct === false} 
                                            onChange={(e) => updateMedication(index, "quantity", parseInt(e.target.value))
                                            }
                                        />
                                    </label>
                                }

                                <button type="button"
                                        onClick={() => removeMedication(index)}
                                        style={{border: 'none'}}>
                                    X
                                </button>
                            </div>
                        ))}

                        <button 
                            type="button"
                            style={{ marginTop: "0.5rem" , display: 'block'}}
                            onClick={addMedication}
                        >
                            + Add medication
                        </button>
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
                        <textarea name="notes" id="notes" rows='5' cols='50' value={recordDetails?.notes} onChange={(e) => setRecordDetails({...recordDetails, notes: e.target.value})}></textarea>
                    </label>
                </div>

                <CancelSaveBtn hideForm={props.hideForm} submit={handleSubmit}/>
            </div>
        </div>
    )
}