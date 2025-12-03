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
    const [itemDetails, setItemDetails] = React.useState<any[]>([]);
    const [currentBatch, setCurrentBatch] = React.useState()
    const [batches, setBatches] = React.useState<any[]>([]);
    const [showAddBatch, setShowAddBatch] = React.useState(false);
    const [showUpdateStock, setShowUpdateStock] = React.useState(false);
    const [showEditDetails, setShowEditDetails] = React.useState(false);
    const [showEditStock, setShowEditStock] = React.useState(false);
    const [showEditBatch, setShowEditBatch] = React.useState(false)

    console.log(id)

    React.useEffect(() => {
        fetch(`http://localhost:5000/getsupplydetails?idnum=${id}`).
        then(res => res.json()).
        then(data => setItemDetails(data[0]))

    }, [])

    React.useEffect(() => {
        fetch(`http://localhost:5000/getbatches?idnum=${id}`)
        .then(res => res.json())
        .then(data => setBatches(data))
    }, [])

    function refetchBatches(){
        fetch(`http://localhost:5000/getbatches?idnum=${id}`)
        .then(res => res.json())
        .then(data => setBatches(data))
    }

    function editBtnClick(batch:any, edit:any){
        setCurrentBatch(batch)
        setShowEditStock(true)
    }

    function hideform(){
        setShowEditStock(false)
    }

    return(
        <div className="route-page">
            <div id="item-details-div">
                {showEditStock ? <EditStock hideForm={hideform} batch={currentBatch} refetch={refetchBatches}/> : null}
                {showEditDetails ? <EditItem  hideForm={() => setShowEditDetails(false)}/> : null}
                {showUpdateStock ? <UpdateStocks hideForm={() => setShowUpdateStock(false)}/> : null}
                {showAddBatch ? <AddBatch hideForm={() => setShowAddBatch(false)} name={itemDetails?.supply_name} refetch={refetchBatches}/> : null}
                <p className="route-header">Item Details</p>

                <div id="item-information-div">
                    <img id="item-img"></img>
                    <p id="item-name">{itemDetails?.supply_name}</p>
                    <p id="item-categ">{itemDetails?.category_name}</p>
                    <p id="item-brand">Brand: {itemDetails?.brand}</p>
                    <p id="item-desc">Description: {itemDetails?.description}</p>
                    {/* <p id="item-added-by">Added by: Melanie Hamilton, RN</p> */}
                    <div id="item-edit-button-div">
                        <button id='edit-details-btn' onClick={() => setShowEditDetails(true)}>Edit Details</button>
                        <button id='add-new-batch-btn' onClick={() => setShowAddBatch(true)}> Add new batch</button>
                    </div>
                </div>

                <div>
                   
                    <div style={{maxWidth: '1400px'}}>
                        <p style={{fontSize: '1.5rem', fontWeight: '500', display: 'flex', justifyContent: 'space-between'}}>Batches 
                            <span><button id='add-new-batch-btn'> Add new batch</button></span>
                        </p>
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

                                {batches.map((batch) => {
                                    return(
                                        <tr>
                                            <td>{batch.batch_number}</td>
                                            <td>{batch.stock_level}</td>
                                            <td>{batch.expiration_date === '' ? 'None' : batch.expiration_date}</td>
                                            <td>{batch.stock_level > 20 ? <p className='in-stock'>In Stock</p> : 'Low-Stock'}</td>
                                            <td></td>
                                            <td>
                                                <button style={{fontWeight: '600', fontSize: '1rem', color: 'gray',backgroundColor: 'transparent', border: 'none'}}
                                                        onClick={() => editBtnClick(batch)}>
                                                    <i className='bi bi-pen-fill'></i>
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}