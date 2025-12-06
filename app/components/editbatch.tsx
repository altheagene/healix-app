import React from "react"
import CancelSaveBtn from "./cancelsavebtn"

export default function EditBatch(props:any){

    const batch = props.batch;
    const [batchDetails, setBatchDetails] = React.useState({
        batch_id: batch.batch_id,
        batch_number: batch.batch_number,
        expiration_date: batch.expiration_date,
    })

    async function handleSubmit(){
        const response = await fetch(`http://localhost:5000/editbatch`, 
            {
                method: 'POST',
                headers: {
                    'Content-Type' : 'application/json'
                },
                body: JSON.stringify(batchDetails)
            }
        )

        console.log(response.json())

        props.refetch()
    }

    

    return(
        <div className='modal-form-div'>
            <div className='gray-bg'></div>
            <div className='modal-form'>
                <div className='modal-header-div'>
                    <p className='modal-header'>Edit Batch</p>
                </div>

                <div className='main-form-content'>
                    <label htmlFor="batch-number">Batch Number
                        <input type="text" id="batch-number" value={batchDetails?.batch_number} onChange={(e) => setBatchDetails({...batchDetails, batch_number: e.target.value})}/>
                    </label>
                    <div>
                        <label htmlFor="expiration-date">Expiration Date
                            <input type="date" value={batchDetails.expiration_date} onChange={(e) => setBatchDetails({...batchDetails, expiration_date: e.target.value})}/>
                        </label>
                        <div style={{display: 'flex', alignItems: 'center', height: '30px'}}>
                            <input type="checkbox"
                                    id="noexpiry" 
                                    style={{width: '20px', margin: '0 0.5rem 0 0', display: 'inline-block', backgroundColor: 'none'}}
                                   /> 
                            <label htmlFor="noexpiry" style={{height: '100%', display: 'flex', alignItems: 'center'}}>This has no expiration date</label>
                            
                        </div>
                    </div>
                    <label>Not
                        <input type="text" />
                    </label>
                </div>
                <CancelSaveBtn hideForm={props.hideForm} submit={handleSubmit}></CancelSaveBtn>
            </div>
        </div>
    )
}