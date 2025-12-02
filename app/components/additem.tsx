import '../inventory.css'
import React from 'react'
import CancelSaveBtn from './cancelsavebtn'

export default function AddItem(props:any){

    const [itemDetails, setItemDetails] = React.useState({
        supply_name: '',
        brand: '',
        description: '',
        category_id: 0
    })

    const [services, setServices] = React.useState<any[]>([])

    async function submitForm(){
        console.log(itemDetails)

        const response = await fetch(`http://localhost:5000/additem`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(itemDetails)
        })
    }

    // React.useEffect(() => {
    //     fetch(`http://localhost:5000/getservices`)
    //     .then(res => res.json())
    //     .then(data => setServices(data[0]))
    // }, [])

    return(
        <div id='add-item-div'>
            <div className='gray-bg'></div>
            <div id='add-item-form' className='modal-form'>

                <div className='modal-header-div'>
                    <p className="modal-header">Add Item</p>
                </div>
                
                <div className='main-form-content'>
                    <label htmlFor="add-item-name">Item Name
                    <input type="text" id='add-item-name' value={itemDetails.supply_name} onChange={(e) => setItemDetails({...itemDetails, supply_name: e.target.value}) }/>
                    </label>

                    <label htmlFor="add-item-desc">Brand
                        <input type="text" id='add-item-brand' value={itemDetails.brand} onChange={(e) => setItemDetails({...itemDetails, brand: e.target.value}) }/>
                    </label>

                    <label htmlFor="add-item-desc">Description
                        <input type="text" id='add-item-desc' value={itemDetails.description} onChange={(e) => setItemDetails({...itemDetails, description: e.target.value}) }/>
                    </label>

                    <label htmlFor="add-item-category"> Category
                        <select name="category" id="">
                            <option value="medication">Medication</option>
                            <option value="medical-supplies">Medical Supplies</option>
                            <option value="equipment">Equipment</option>
                        </select>
                    </label>
                </div>
                
                <CancelSaveBtn hideForm={props.hideForm} submit={submitForm}/>
                

            </div>
        </div>
    )
}