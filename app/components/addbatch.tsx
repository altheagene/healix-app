import React from "react"
import CancelSaveBtn from "./cancelsavebtn"


export default function AddBatch(props:any){


    return(
        <div id="add-batch-div">
            <div className="gray-bg"></div>
            <div id="add-batch-form" className="modal-form">
                <div className="modal-header-div">
                    <p className="modal-header">Add Batch</p>
                </div>
                
                <div className="main-form-content">
                    <label htmlFor="">Item Name
                        <input type="text"  />
                    </label>

                    <label htmlFor="batch-number">Batch Number
                        <input type="text" id="batch-number" />
                    </label>

                    <label htmlFor="expiration-date">Expiration Date
                        <input type="date" />
                    </label>

                    <label htmlFor="addstock">Add Stocks
                        <input type="number" min='0' id="addstock"/>
                    </label>

                    <label htmlFor="notes">Notes
                        <textarea name="notes" id="notes" rows='4' cols='60'></textarea>
                    </label>
                </div>
                <CancelSaveBtn hideForm={props.hideForm}/>
            </div>
        </div>
    )
}