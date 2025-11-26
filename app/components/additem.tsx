import '../inventory.css'
import CancelSaveBtn from './cancelsavebtn'

export default function AddItem(props:any){
    return(
        <div id='add-item-div'>
            <div id='gray-bg'></div>
            <div id='add-item-form'>

                <p className="modal-header">Add Item</p>
                <label htmlFor="add-item-name">Item Name
                    <input type="text" id='add-item-name' />
                </label>

                <label htmlFor="add-item-desc">Description
                    <input type="text" id='add-item-desc' />
                </label>

                <label htmlFor="add-item-category"> Category
                    <select name="category" id="">
                        <option value="medication">Medication</option>
                        <option value="medical-supplies">Medical Supplies</option>
                        <option value="equipment">Equipment</option>
                    </select>
                </label>
                <CancelSaveBtn hideForm={props.hideForm} />
                

            </div>
        </div>
    )
}