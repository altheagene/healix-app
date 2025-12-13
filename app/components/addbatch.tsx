import React from "react"
import CancelSaveBtn from "./cancelsavebtn"
import { useParams } from "react-router"


export default function AddBatch(props:any){
    
    const { id } = useParams()
    const [noExpirationDate, setNoExpirationDate] = React.useState(false)
    const [batchDetails, setBatchDetails] = React.useState({
        supply_id: id,
        batch_number: '',
        expiration_date: '',
        stock_level: 0,
        is_active : true
    })

    async function handleSubmit(){
        let success = true
        console.log(batchDetails)
        console.log(noExpirationDate)

        for (const key of Object.keys(batchDetails)){
            const objkey = key as keyof typeof batchDetails;
            const value = batchDetails[objkey]

            if(noExpirationDate && objkey === 'expiration_date'){
                continue;
            }else if(value === '' || value == null || value == 0){
                console.log('INVALID')
                success = false
                break;
            }
        }

        if (!success){
            console.log('Please fill out all form fields!')
            return
        }else{
            const response = await fetch('http://localhost:5000/addbatch', {
                method: 'POST',
                headers: {
                    'Content-Type' : 'application/json'
                },
                body: JSON.stringify(batchDetails)
            })

            console.log(response.json())

            props.refetch()
        }

    }
    

    return(
        <div id="add-batch-div">
            <div className="gray-bg"></div>
            <div id="add-batch-form" className="modal-form">
                <div className="modal-header-div">
                    <p className="modal-header">Add Batch</p>
                </div>
                
                <div className="main-form-content">
                    <label htmlFor="">Supply Name
                        <input type="text" value={props.name} />
                    </label>

                    <label htmlFor="batch-number">Batch Number
                        <input type="text" id="batch-number" value={batchDetails.batch_number} onChange={(e) => setBatchDetails({...batchDetails, batch_number: e.target.value.trim()})}/>
                    </label>

                    <div>
                        <label htmlFor="expiration-date">Expiration Date
                            <input type="date" onChange={(e) => setBatchDetails({...batchDetails, expiration_date: e.target.value.trim()} )}/>
                        </label>
                        <div style={{display: 'flex', alignItems: 'center', height: '30px'}}>
                            <input type="checkbox"
                                    id="noexpiry" 
                                    style={{width: '20px', margin: '0 0.5rem 0 0', display: 'inline-block', backgroundColor: 'none'}}
                                    onChange={(e) => setNoExpirationDate(e.target.checked)}/> 
                            <label htmlFor="noexpiry" style={{height: '100%', display: 'flex', alignItems: 'center'}}>This has no expiration date</label>
                            
                        </div>
                    </div>
                    

                    <label htmlFor="addstock">Add Stocks
                        <input type="number" min='0' id="addstock" value={batchDetails.stock_level} onChange={(e) => setBatchDetails({...batchDetails, stock_level:parseInt(e.target.value)})}/>
                    </label>

                </div>
                <CancelSaveBtn hideForm={props.hideForm} submit={handleSubmit}/>
            </div>
        </div>
    )
}