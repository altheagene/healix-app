import CancelSaveBtn from "./cancelsavebtn"
import React from "react"
import {API_BASE_URL} from '../config'

export default function EditItem(props:any){

    const details = props.itemDetails

    const [itemDetails, setItemDetails] = React.useState({
        supply_id : details?.supply_id,
        supply_name : details?.supply_name.trim(),
        description: details?.description.trim(),
        brand: details?.brand.trim(),
        auto_deduct: details?.auto_deduct
    })

    async function handleSubmit() {
    // Trim the text fields before validation
    const { supply_name, brand, description } = itemDetails;

    if (!supply_name.trim() || !brand.trim() || !description.trim()) {
        alert("Please fill in all fields before saving!");
        return;
    }

    const response = await fetch(`${API_BASE_URL}/updatesupply`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(itemDetails),
    });

    const success = await response.json();
    if (success.success) {
        alert("Successfully updated supply!");
        props.refetch();
        props.hideForm(); // optionally hide the form after successful update
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
                                onChange={(e) => setItemDetails({...itemDetails, supply_name: e.target.value})}/>
                    </label>

                    <label htmlFor="">Item Brand
                        <input type="text" 
                                value={itemDetails?.brand}
                                onChange={(e) => setItemDetails({...itemDetails, brand: e.target.value})}/>
                    </label>

                    <label htmlFor="">Description
                        <input type="text" 
                                value={itemDetails?.description}
                                onChange={(e) => setItemDetails({...itemDetails, description: e.target.value})}/>
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