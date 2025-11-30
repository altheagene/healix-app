import CancelSaveBtn from "./cancelsavebtn"
import React from "react"

export default function UpdateStocks(props:any){

    return(
        <div id="update-stock-div">
            <div className="gray-bg"></div>
            <div className="modal-form" id="update-stock-form">
                <div className="modal-header-div">
                    <p className="modal-header">Update Stocks</p>
                </div>

                <div className="main-form-content">
                    <label htmlFor="">Item
                        <input type="text" />
                    </label>
                    
                    <label htmlFor="current-stock">Current Stock
                        <input type="number" />
                    </label>

                    <label htmlFor="add-stock">Add Stock
                        <input type="number" min='0' />
                    </label>

                    <label htmlFor="remove-stock">Remove Stock
                        <input type="number" min='0' />
                    </label>

                    <label htmlFor="stock-update-notes">Notes
                        <textarea name="stock-update-notes" id="stock-update-notes" rows='4' cols='35'></textarea>
                    </label>

                </div>
    
                <CancelSaveBtn hideForm={props.hideForm}/>
            </div>
        </div>
    )
}