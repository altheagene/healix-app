import { apiFetch } from "../api";
import '../inventory.css'
import React from 'react'
import CancelSaveBtn from './cancelsavebtn'

export default function AddItem(props: any) {
  const [suppliesCategories, setSuppliesCategories] = React.useState<any[]>()
  const [itemDetails, setItemDetails] = React.useState({
    supply_name: '',
    brand: '',
    description: '',
    category_id: 1,
    auto_deduct: false,
    is_active : true,
  })
  const [flashMessage, setFlashMessage] = React.useState<string | null>(null)

  async function submitForm() {
    // Check if all fields are filled
    for (const key of Object.keys(itemDetails)) {
      const objKey = key as keyof typeof itemDetails
      const value = itemDetails[objKey]

      if (value === '' || value === null) {
        setFlashMessage(`Please fill in the ${key.replace('_', ' ')}`)
        return
      }
    }

    try {
      const response = await apiFetch(`/additem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(itemDetails)
      })

      if (!response.ok) {
        throw new Error('Failed to add item')
      }

      setFlashMessage('Item added successfully!')
      props.refetchSupplies()
      setTimeout(() => {
        setFlashMessage(null)
        props.hideForm() // close modal after showing flash
      }, 1500)

    } catch (err) {
      console.error(err)
      setFlashMessage('Error adding item. Please try again.')
    }
  }

  React.useEffect(() => {
    apiFetch(`/getallsuppliescategories`)
      .then(res => res.json())
      .then(data => setSuppliesCategories(data))
  }, [])

  return (
    <div id='add-item-div'>
      <div className='gray-bg'></div>
      <div id='add-item-form' className='modal-form'>
        <div className='modal-header-div'>
          <p className="modal-header">Add Item</p>
        </div>

        {flashMessage && (
          <div className="flash-message" style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '8px 12px',
            borderRadius: '5px',
            marginBottom: '10px'
          }}>
            {flashMessage}
          </div>
        )}

        <div className='main-form-content'>
          <label htmlFor="add-item-name">Item Name <span style={{ color: 'red' }}>*</span>
            <input
              type="text"
              id='add-item-name'
              value={itemDetails.supply_name}
              onChange={(e) => setItemDetails({ ...itemDetails, supply_name: e.target.value })}
            />
          </label>

          <label htmlFor="add-item-brand">Brand <span style={{ color: 'red' }}>*</span>
            <input
              type="text"
              id='add-item-brand'
              value={itemDetails.brand}
              onChange={(e) => setItemDetails({ ...itemDetails, brand: e.target.value })}
            />
          </label>

          <label htmlFor="add-item-desc">Description <span style={{ color: 'red' }}>*</span>
            <input
              type="text"
              id='add-item-desc'
              value={itemDetails.description}
              onChange={(e) => setItemDetails({ ...itemDetails, description: e.target.value })}
            />
          </label>

          <label htmlFor="add-item-category">Category <span style={{ color: 'red' }}>*</span>
            <select
              name="category"
              id="add-item-category"
              value={itemDetails.category_id}
              onChange={(e) => setItemDetails({ ...itemDetails, category_id: parseInt(e.target.value) })}
            >
              {suppliesCategories?.map(supply => (
                <option key={supply.category_id} value={supply.category_id}>
                  {supply.category_name}
                </option>
              ))}
            </select>
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

        <CancelSaveBtn hideForm={props.hideForm} submit={submitForm} />
      </div>
    </div>
  )
}
