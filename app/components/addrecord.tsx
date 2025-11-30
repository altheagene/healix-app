import CancelSaveBtn from "./cancelsavebtn"
export default function AddRecord(props:any){

    return(
        <div id="add-record-div">
            <div className="gray-bg"></div>
            <div id="add-record-form" className="modal-form">
                <div className="modal-header-div">
                    <p className="modal-header">Visit Log</p>
                </div>
                
                <div className="main-form-content">

                    <label htmlFor="">Date
                        <input type="date" />
                    </label>
                    <label htmlFor="reason">Reason
                        <textarea name="reason" id="reason" rows='5' cols='50'></textarea>
                    </label>

                    <div>
                        <label htmlFor="medication">Medication
                            <input type="text" id="medication" />
                        </label>

                        <label htmlFor="quantity">Quantity
                            <input type="number" id="quantity"/>
                        </label>
                    </div>

                    <label htmlFor="reason">Notes
                        <textarea name="notes" id="notes" rows='5' cols='50'></textarea>
                    </label>
                </div>

                <CancelSaveBtn hideForm={props.hideForm} />
            </div>
        </div>
    )
}