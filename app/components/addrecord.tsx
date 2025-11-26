
export default function AddRecord(props:any){

    return(
        <div id="add-record-div">
            <div className="gray-bg"></div>
            <div id="add-record-form">
                <p className="modal-header">Visit Log</p>

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

                <div style={{display:'flex', gap: '1rem'}} className="button-div">
                    <button style={{width: '120px', height:'30px', backgroundColor: '#E3412F', border: 'none', color:'white'}} onClick={props.hideForm} >Cancel</button>
                    <button style={{width: '120px',  height:'30px', backgroundColor: '#48C72C', border: 'none'}}>Save</button>
                </div>
            </div>
        </div>
    )
}