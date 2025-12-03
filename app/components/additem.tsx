import '../inventory.css'
import React from 'react'
import CancelSaveBtn from './cancelsavebtn'

export default function AddItem(props:any){

    const [suppliesCategories, setSuppliesCategories] = React.useState<any[]>()
    const [itemDetails, setItemDetails] = React.useState({
        supply_name: '',
        brand: '',
        description: '',
        category_id: 1
    })
    
    async function submitForm(){
        console.log(itemDetails)

        //checks if all fields are filled
        for (const key of Object.keys(itemDetails)){
            const objkey = key as keyof typeof itemDetails
            const value = itemDetails[objkey]

            if(value === ''){
                console.log('END')
                return
            }
        }

        const response = await fetch(`http://localhost:5000/additem`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(itemDetails)
        })
        props.refetchSupplies()
    }

    React.useEffect(() => {
        fetch(`http://localhost:5000/getallsuppliescategories`)
        .then(res => res.json())
        .then(data => setSuppliesCategories(data))
    }, [])

    console.log(suppliesCategories)

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
                        <select name="category" id="add-item-category" value={itemDetails?.category_id} onChange={(e) => setItemDetails({...itemDetails, category_id: parseInt(e.target.value)})}>
                            {suppliesCategories?.map(supply => {
                                return(
                                    <option value={supply.category_id}>{supply.category_name}</option>
                                )
                            })}
                        </select>
                    </label>
                </div>
                
                <CancelSaveBtn hideForm={props.hideForm} submit={submitForm}/>
                

            </div>
        </div>
    )
}