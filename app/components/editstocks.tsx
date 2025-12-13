import CancelSaveBtn from "./cancelsavebtn"
import React from "react"

export default function EditStock(props:any){

    async function submitForm(){
        if(batchDetails.item_in == 0 && batchDetails.item_out == 0){
            return
        }

        const response = await fetch(`http://localhost:5000/editstockbatch`,
            {
            method: 'POST',
            headers: {
                'Content-Type' : 'application/json',
                },
            body: JSON.stringify(batchDetails)
            }
        )

        console.log(response.json())
        props.refetch();
    }

    const batch = props.batch
    const [batchDetails, setBatchDetails] = React.useState({
        batch_id: batch.batch_id,
        batch_number: batch.batch_number,
        item_in: 0,
        item_out: 0
    })

    console.log(batchDetails)
    return(
        <div className='modal-form-div'>
            <div className='gray-bg'></div>
            <div className='modal-form'>
                <div className='modal-header-div'>
                    <p className='modal-header'>Edit Stocks</p>
                </div>

                <div className='main-form-content'>
                    <h3>Current stocks: {batch.stock_level}</h3>
                    <label htmlFor="">Batch Number
                        <input type="text" value={batchDetails?.batch_number} readOnly/>
                    </label>
                    <label htmlFor="addstock">Add Stocks
                        <input type="number" 
                                min='0' 
                                id="addstock"
                                value={batchDetails?.item_in} 
                                onChange={(e) => setBatchDetails({...batchDetails, item_in: parseInt(e.target.value)}) }/>

                    </label>

                    <label htmlFor="removestock">Remove Stocks
                        <input type="number" 
                                min= '0' 
                                max={`${batch.stock_level}`} 
                                id="removestock" 
                                value={batchDetails?.item_out} 
                                onChange={(e) => e.target.value > batch.stock_level ? setBatchDetails({...batchDetails, item_out: batch.stock_level}) : setBatchDetails({...batchDetails, item_out: parseInt(e.target.value)}) }/>
                    </label>
                </div>
                <CancelSaveBtn hideForm={props.hideForm} submit={submitForm} ></CancelSaveBtn>
            </div>
        </div>
    )
}