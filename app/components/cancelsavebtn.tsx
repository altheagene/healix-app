import '../app.css'

export default function CancelSaveBtn(props:any){

    return(
        <div id="cancel-save-btns-div">
            <button className="cancel-btn" onClick={props.hideForm}>Cancel</button>
            <button className="save-btn" onClick={props.submit}>Save</button>
        </div>
    )
}