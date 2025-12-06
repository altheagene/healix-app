
import { useParams } from "react-router"
import CancelSaveBtn from "./cancelsavebtn"
import React from "react"

export default function ViewVisit(props:any){

    const [visitInfo, setVisitInfo] = React.useState(false);
    const [medicationDetails, setMedicationDetails] = React.useState<any[]>();

    React.useEffect(() => {
        setVisitInfo(props.visit)
    }, [])

    React.useEffect(() => {
        fetch(`http://localhost:5000/getmedicationdetails?idnum=${visitInfo?.visit_id}`)
        .then(res => res.json())
        .then(data => setMedicationDetails(data))
    })

    console.log(medicationDetails)
    return(
        <div id="add-record-div">
            <div className="gray-bg"></div>
            <div id="add-record-form" className="modal-form">
                <div className="modal-header-div">
                    <p className="modal-header">Visit Log</p>
                </div>
                
                <div className="main-form-content">

                     <label htmlFor="">Patient Name
                        <input type="text" value={visitInfo?.patient_name} readOnly/>
                    </label>

                    <label htmlFor="">Date
                        <input type="date" value={new Date().toISOString().split("T")[0]} style={{width: '100%'}} readOnly/>
                    </label>

                    <label htmlFor="">Reason
                        <input type="text" value={visitInfo?.service_name} readOnly/>
                    </label>

                    <div style={{display: 'flex', width: '100%', gap: '1rem'}}>
                        <label htmlFor="weight">Weight
                            <input type="text" id="weight" value={visitInfo?.Weight} readOnly/>
                        </label>

                        <label htmlFor="temp">Temperature
                            <input type="text" id="temp"  value={visitInfo?.Temperature} readOnly/>
                        </label>
                    </div>

                    <div style={{ width: '100%' }}>
                        <label>Medications</label>
                        <ul style={{listStyle: 'none'}}>
                            {medicationDetails?.map(medication => {
                                return(
                                    <li><i className="bi bi-caret-right-fill"></i><span>{medication.quantity > 0  ? medication.quantity + '-' : ''}  </span>{medication.supply_name}</li>
                                )
                            })}
                        </ul>
                    </div>

                    <label htmlFor="">Staff
                        <input type="text" value={visitInfo?.staff_name} readOnly/>
                    </label>

                    <label htmlFor="reason">Notes
                        <textarea name="notes" id="notes" rows='5' cols='50' value={visitInfo?.notes} readOnly></textarea>
                    </label>
                </div>

                <div id="cancel-save-btns-div">
                    <button style={{border: '1px solid #ccc'}} onClick={props.hideForm}>Close</button>
                </div>
            </div>
        </div>
    )
}