import CancelSaveBtn from "./cancelsavebtn"
import React from "react"

export default function EditItem(props:any){

    const details = props.itemDetails

    const [itemDetails, setItemDetails] = React.useState({
        supply_id : details?.supply_id,
        supply_name : details?.supply_name,
        description: details?.description,
        brand: details?.brand,
        auto_deduct: details?.auto_deduct
    })

    async function handleSubmit(){
        const response = await fetch(`http://localhost:5000/updatesupply`,
            {
                method: 'POST',
                headers: {
                    'Content-Type' : 'application/json'
                },
                body: JSON.stringify(itemDetails)
            }
        )

        const success = await response.json()
        if (success.success) {
            alert('Successfully updated supply!')
            props.refetch()
        }
    }


     
    return(
        <div id="edit-item-div">
            <div className="gray-bg"></div>
            <div className="modal-form" id="edit-details-div">
                <div className="modal-header-div">
                    <p className="modal-header">Edit Details</p>
                </div>

                <div className="main-form-content" id="edit-item-form">
                    <label htmlFor="edit-item-name">Item Name
                        <input type="text" 
                                id="edit-item-name" 
                                value={itemDetails?.supply_name}
                                onChange={(e) => setItemDetails({...itemDetails, supply_name: e.target.value.trim()})}/>
                    </label>

                    <label htmlFor="">Item Brand
                        <input type="text" 
                                value={itemDetails?.brand}
                                onChange={(e) => setItemDetails({...itemDetails, brand: e.target.value.trim()})}/>
                    </label>

                    <label htmlFor="">Description
                        <input type="text" 
                                value={itemDetails?.description}
                                onChange={(e) => setItemDetails({...itemDetails, description: e.target.value.trim()})}/>
                    </label>

                    <label>
                        <input type="checkbox" 
                                checked={itemDetails?.auto_deduct} 
                                onChange={(e) => setItemDetails({...itemDetails, auto_deduct: e.target.checked})}
                                style={{width: '30px', display: 'inline'}}/>
                        Automatically deduct this item when dispensed. 
                        <span style={{display: 'block', color: 'red'}}>This should only be activated for medicines in units (e.g. capsules, tablets)</span>
                    </label>
                     
                </div>

                <CancelSaveBtn hideForm={props.hideForm} submit={handleSubmit}/>
            </div>
        </div>
    )
}