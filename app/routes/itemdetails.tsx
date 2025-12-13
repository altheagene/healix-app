import '../inventory.css'
import AddBatch from '~/components/addbatch'
import UpdateStocks from '~/components/updatestocks';
import EditItem from '~/components/edititem';
import React from 'react'
import { useParams } from 'react-router';
import 'bootstrap-icons/font/bootstrap-icons.css';
import CancelSaveBtn from '~/components/cancelsavebtn';
import EditStock from '~/components/editstocks';
import EditBatch from '~/components/editbatch';
import { useNavigate } from 'react-router';
import {API_BASE_URL} from '../config'
import rxsymbol from '../images/rxsymbol.png'
import equipment from '../images/equipment.png'
import supplies from '../images/supply.png'


// function EditBatch(props:any){
//     return(
//         <div className='modal-form-div'>
//             <div className='gray-bg'></div>
//             <div className='modal-form'>
//                 <div className='modal-header-div'>
//                     <p className='modal-header'>Edit Batch</p>
//                 </div>

//                 <div className='main-form-content'>
//                     <label htmlFor="">Supply Name
//                         <input type="text"/>
//                     </label>

//                     <label htmlFor="batch-number">Batch Number
//                         <input type="text" id="batch-number"/>
//                     </label>
//                     <div>
//                         <label htmlFor="expiration-date">Expiration Date
//                             <input type="date"/>
//                         </label>
//                         <div style={{display: 'flex', alignItems: 'center', height: '30px'}}>
//                             <input type="checkbox"
//                                     id="noexpiry" 
//                                     style={{width: '20px', margin: '0 0.5rem 0 0', display: 'inline-block', backgroundColor: 'none'}}
//                                    /> 
//                             <label htmlFor="noexpiry" style={{height: '100%', display: 'flex', alignItems: 'center'}}>This has no expiration date</label>
                            
//                         </div>
//                     </div>

//                     <label htmlFor="addstock">Add Stocks
//                         <input type="number" min='0' id="addstock"/>
//                     </label>

//                     <label htmlFor="removestock">Remove Stocks
//                         <input type="number" min='0' id="removestock"/>
//                     </label>
//                 </div>
//                 <CancelSaveBtn></CancelSaveBtn>
//             </div>
//         </div>
//     )
// }

export default function ItemDetails(){

    const { id }  = useParams()
    const navigate = useNavigate()
    const [itemDetails, setItemDetails] = React.useState<any[]>([]);
    const [currentBatch, setCurrentBatch] = React.useState()
    const [batches, setBatches] = React.useState<any[]>([]);
    const [showAddBatch, setShowAddBatch] = React.useState(false);
    const [showUpdateStock, setShowUpdateStock] = React.useState(false);
    const [showEditDetails, setShowEditDetails] = React.useState(false);
    const [showEditStock, setShowEditStock] = React.useState(false);
    const [showEditBatch, setShowEditBatch] = React.useState(false)
    const [chosenActive, setChosenActive] = React.useState(true)

    console.log(batches)



    

    React.useEffect(() => {
        fetch(`${API_BASE_URL}/getsupplydetails?idnum=${id}`).
        then(res => res.json()).
        then(data => setItemDetails(data[0]))

    }, [])

    React.useEffect(() => {
        fetch(`${API_BASE_URL}/getbatches?idnum=${id}`)
        .then(res => res.json())
        .then(data => setBatches(data))
    }, [])

    function refetchBatches(){
        fetch(`${API_BASE_URL}/getbatches?idnum=${id}`)
        .then(res => res.json())
        .then(data => setBatches(data))
    }

    function editStockClick(batch:any){
        setCurrentBatch(batch)
        setShowEditStock(true)
    }

    function editBtnClick(batch:any){
        setCurrentBatch(batch)
        setShowEditBatch(true)
    }
    function hideform(){
        setShowEditStock(false)
    }

    function refetchDetails(){
        fetch(`${API_BASE_URL}/getsupplydetails?idnum=${id}`).
        then(res => res.json()).
        then(data => setItemDetails(data[0]))
    }

     async function removeBatch( id:any){
        const responses = await fetch(`${API_BASE_URL}/updatebatchactive`, {
          method: 'POST',
          headers: {
            'Content-Type' : 'application/json'
          },
          body: JSON.stringify({batch_id: id , is_active: false})
        })
    
        const result = await responses.json()
        console.log(result);
        refetchBatches();
      }
    
      async function reactivateBatch( id:any){
        const responses = await fetch(`${API_BASE_URL}/updatebatchactive`, {
          method: 'POST',
          headers: {
            'Content-Type' : 'application/json'
          },
          body: JSON.stringify({batch_id: id , is_active: true})
        })
    
        const result = await responses.json()
        console.log(result);
        refetchBatches();
      }

    const filteredBatches = batches.filter(batch => 
        batch.is_active == chosenActive
    )
    console.log(filteredBatches)
    return(
        <div className="route-page">
                {showEditBatch ? <EditBatch hideForm={() => setShowEditBatch(false)} batch={currentBatch} refetch={refetchBatches}/> : null}
                {showEditStock ? <EditStock hideForm={hideform} batch={currentBatch} refetch={refetchBatches}/> : null}
                {showEditDetails ? <EditItem  hideForm={() => setShowEditDetails(false)} itemDetails={itemDetails} refetch={refetchDetails}/> : null}
                {showUpdateStock ? <UpdateStocks hideForm={() => setShowUpdateStock(false)}/> : null}
                {showAddBatch ? <AddBatch hideForm={() => setShowAddBatch(false)} name={itemDetails?.supply_name} refetch={refetchBatches}/> : null}
                <div style={{display: 'flex', gap: '1rem'}}>
                    <button
                    onClick={() => navigate(-1)}
                    className='back-btn'>
                        <i className="bi bi-caret-left-fill"></i>
                    </button>  
                    <p className="route-header">Item Details</p>
                </div>

                <div id="item-information-div">
                    {/* <img id="item-img" src={itemDetails?.category_name === 'Medicine' ? rxsymbol : itemDetails?.category_name === 'Equipment' ? equipment : supplies} /> */}
                    <div id="item-text">
                        <p id="item-name">{itemDetails?.supply_name}</p>
                        <p id="item-categ">{itemDetails?.category_name}</p>
                        <p id="item-brand">Brand: {itemDetails?.brand}</p>
                        <p id="item-desc">Description: {itemDetails?.description}</p>
                    </div>
                    <div id="item-edit-button-div">
                        <button id='edit-details-btn' onClick={() => setShowEditDetails(true)}>Edit Details</button>
                    </div>
                </div>

                <div>
                   
                        <p style={{fontSize: '1.5rem', fontWeight: '500', display: 'flex', justifyContent: 'space-between', marginBottom: '1rem'}}>Batches 
                            <span></span>
                        </p>

                        <div style={{fontSize: '1.5rem', fontWeight: '500', display: 'flex', justifyContent: 'space-between', flexDirection: window.innerWidth < 600 ? 'column-reverse' : 'row'}}>
                            <div className="status-bar">
                                <button 
                                    onClick={() => setChosenActive(true)} 
                                    className="status-btn"
                                    style={{backgroundColor: chosenActive ? 'white' : 'transparent'}}>Active Supplies</button>
                                <button 
                                    onClick={() => setChosenActive(false)}
                                    className="status-btn"
                                    style={{backgroundColor: !chosenActive ? 'white' : 'transparent'}}>Inactive Supplies</button>
                            </div>
                            <button id='add-new-batch-btn' className='add-button' onClick={() => setShowAddBatch(true)}> Add new batch</button>
                        </div>
                        <div  id='batches-table-container'  className='table-container'>
                            <table id='batches-table'>
                                <tr>
                                    <th>Batch No.</th>
                                    <th>Stock Level</th>
                                    <th>Expiration Date</th>
                                    <th>Status</th>
                                    <th>Last Updated</th>
                                    <th>Actions</th>
                                </tr>

                                {filteredBatches.length > 0 ? filteredBatches.map((batch) => {
                                    return(
                                        <tr>
                                            <td>{batch.batch_number}</td>
                                            <td>{batch.stock_level}</td>
                                            <td>{batch.expiration_date === '' ? 'None' : batch.expiration_date}</td>
                                            <td>{new Date(batch.expiration_date) < new Date() ? 'Expired' :batch.stock_level > 20 ? <p className='in-stock'>In Stock</p> : 'Low-Stock'}</td>
                                            <td></td>
                                            <td className="action-cell">
                                                <div className="action-menu">
                                                    <button className="action-trigger">
                                                    <i className="bi bi-three-dots-vertical"></i>
                                                    </button>

                                                    <div className="action-dropdown">
                                                    <button onClick={() => editStockClick(batch)}>
                                                        <i className="bi bi-pen-fill"></i> Edit Stock
                                                    </button>

                                                    <button onClick={() => editBtnClick(batch)}>
                                                        <i className="bi bi-pencil-square"></i> Edit Batch
                                                    </button>

                                                    {chosenActive ? (
                                                        <button onClick={() => removeBatch(batch.batch_id)}>
                                                        <i className="bi bi-trash"></i> Deactivate
                                                        </button>
                                                    ) : (
                                                        <button onClick={() => reactivateBatch(batch.batch_id)}>
                                                        <i className="bi bi-arrow-clockwise"></i> Reactivate
                                                        </button>
                                                    )}
                                                    </div>
                                                </div>
                                                </td>

                                        </tr>
                                    )
                                }) : 
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: 'center', padding: '15px' }}>
                                            No Batches found
                                        </td>
                                    </tr>
                                }
                            </table>
                        </div>
                    </div>
                </div>
    )
}