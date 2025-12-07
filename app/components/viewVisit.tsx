
// import { useParams } from "react-router"
// import CancelSaveBtn from "./cancelsavebtn"
// import React from "react"

// export default function ViewVisit(props:any){

//     const [visitInfo, setVisitInfo] = React.useState(false);
//     const [medicationDetails, setMedicationDetails] = React.useState<any[]>();

//     React.useEffect(() => {
//         setVisitInfo(props.visit)
//     }, [])

//     React.useEffect(() => {
//         fetch(`http://localhost:5000/getmedicationdetails?idnum=${visitInfo?.visit_id}`)
//         .then(res => res.json())
//         .then(data => setMedicationDetails(data))
//     })

//     console.log(medicationDetails)
//     return(
//         <div id="add-record-div">
//             <div className="gray-bg"></div>
//             <div id="add-record-form" className="modal-form">
//                 <div className="modal-header-div">
//                     <p className="modal-header">Visit Log</p>
//                 </div>
                
//                 <div className="main-form-content">
//                     <p>Patient: {visitInfo.patient_name}</p>
//                     <p>Date: {visitInfo?.visit_datetime}</p>
//                     <p>Type: {visitInfo?.service_name}</p>
//                     <p>Weight: {visitInfo?.Weight}</p>
//                     <p>Temperature: {visitInfo?.Temperature}</p>
//                     <div>
//                         <p>Medications</p>
//                         <ul style={{listStyle: 'none'}}>
//                             {medicationDetails?.map(medication => {
//                                 return(
//                                     <li><i className="bi bi-caret-right-fill"></i><span>{medication.quantity > 0  ? medication.quantity + '-' : ''}  </span>{medication.supply_name}</li>
//                                 )
//                             })}
//                         </ul>
//                     </div>
//                     <p>Staff: {visitInfo?.staff_name}</p>
//                     <p>Notes: {visitInfo?.notes}</p>
//                     {/* <label htmlFor="">Patient Name
//                         <input type="text" value={visitInfo?.patient_name} readOnly/>
//                     </label>

//                     <label htmlFor="">Date
//                         <input type="date" value={new Date().toISOString().split("T")[0]} style={{width: '100%'}} readOnly/>
//                     </label>

//                     <label htmlFor="">Reason
//                         <input type="text" value={visitInfo?.service_name} readOnly/>
//                     </label>

//                     <div style={{display: 'flex', width: '100%', gap: '1rem'}}>
//                         <label htmlFor="weight">Weight
//                             <input type="text" id="weight" value={visitInfo?.Weight} readOnly/>
//                         </label>

//                         <label htmlFor="temp">Temperature
//                             <input type="text" id="temp"  value={visitInfo?.Temperature} readOnly/>
//                         </label>
//                     </div>

//                     <div style={{ width: '100%' }}>
//                         <label>Medications</label>
//                         <ul style={{listStyle: 'none'}}>
//                             {medicationDetails?.map(medication => {
//                                 return(
//                                     <li><i className="bi bi-caret-right-fill"></i><span>{medication.quantity > 0  ? medication.quantity + '-' : ''}  </span>{medication.supply_name}</li>
//                                 )
//                             })}
//                         </ul>
//                     </div>

//                     <label htmlFor="">Staff
//                         <input type="text" value={visitInfo?.staff_name} readOnly/>
//                     </label>

//                     <label htmlFor="reason">Notes
//                         <textarea name="notes" id="notes" rows='5' cols='50' value={visitInfo?.notes} readOnly></textarea>
//                     </label> */}
//                 </div> 

//                 <div id="cancel-save-btns-div">
//                     <button style={{border: '1px solid #ccc'}} onClick={props.hideForm}>Close</button>
//                 </div>
//             </div>
//         </div>
//     )
// }

import React from "react";

export default function ViewVisit(props: any) {
  const [visitInfo, setVisitInfo] = React.useState<any>(false);
  const [medicationDetails, setMedicationDetails] = React.useState<any[]>([]);

  React.useEffect(() => {
    setVisitInfo(props.visit);
  }, [props.visit]);

  React.useEffect(() => {
    if (visitInfo) {
      fetch(`http://localhost:5000/getmedicationdetails?idnum=${visitInfo?.visit_id}`)
        .then(res => res.json())
        .then(data => setMedicationDetails(data));
    }
  }, [visitInfo]);

  return (
    <div className="visit-log-overlay">
      <div className="visit-log-card">
        <div className="visit-log-header">
          <h2>Visit Log</h2>
          <button className="close-btn" onClick={props.hideForm}>×</button>
        </div>

        <div className="visit-log-body">
          <div className="visit-info">
            <div><strong>Patient:</strong> {visitInfo?.patient_name}</div>
            <div><strong>Date:</strong> {new Date(visitInfo?.visit_datetime).toLocaleString()}</div>
            <div><strong>Service:</strong> {visitInfo?.service_name}</div>
            <div><strong>Weight:</strong> {visitInfo?.Weight}</div>
            <div><strong>Temperature:</strong> {visitInfo?.Temperature}</div>
            <div><strong>Staff:</strong> {visitInfo?.staff_name}</div>
          </div>

          <div className="visit-notes">
            <h3>Notes</h3>
            <p>{visitInfo?.notes || "No notes available."}</p>
          </div>

          <div className="visit-medications">
            <h3>Medications</h3>
            {medicationDetails?.length > 0 ? (
              <ul>
                {medicationDetails.map(med => (
                  <li key={med.supply_name}>
                    <span className="med-quantity">{med.quantity > 0 ? med.quantity + " × " : ""}</span>
                    <span className="med-name">{med.supply_name}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No medications prescribed.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
