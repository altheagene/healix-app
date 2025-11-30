import CancelSaveBtn from "./cancelsavebtn"

export default function EditItem(props:any){
    return(
        <div id="edit-item-div">
            <div className="gray-bg"></div>
            <div className="modal-form" id="edit-details-div">
                <div className="modal-header-div">
                    <p className="modal-header">Edit Details</p>
                </div>

                <div className="main-form-content" id="edit-item-form">
                    <label htmlFor="edit-item-name">Item Name
                        <input type="text" id="edit-item-name" />
                    </label>

                    <label htmlFor="">Item Brand
                        <input type="text" />
                    </label>

                    <label htmlFor="">Description
                        <input type="text" />
                    </label>
                </div>

                <CancelSaveBtn hideForm={props.hideForm}/>
            </div>
        </div>
    )
}