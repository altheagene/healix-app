import '../inventory.css'
import AddBatch from '~/components/addbatch'
import UpdateStocks from '~/components/updatestocks';
import EditItem from '~/components/edititem';
import React from 'react'
import { useParams } from 'react-router';


export default function ItemDetails(){

    const { id }  = useParams()
    const [itemDetails, setItemDetails] = React.useState<any[]>([]);
    const [showAddBatch, setShowAddBatch] = React.useState(false);
    const [showUpdateStock, setShowUpdateStock] = React.useState(false);
    const [showEditDetails, setShowEditDetails] = React.useState(false)

    console.log(id)

    React.useEffect(() => {
        fetch(`http://localhost:5000/getsupplydetails?idnum=${id}`).
        then(res => res.json()).
        then(data => setItemDetails(data[0]))

    }, [])

    console.log(itemDetails)

    return(
        <div className="route-page">
            <div id="item-details-div">
                {showEditDetails ? <EditItem  hideForm={() => setShowEditDetails(false)}/> : null}
                {showUpdateStock ? <UpdateStocks hideForm={() => setShowUpdateStock(false)}/> : null}
                {showAddBatch ? <AddBatch hideForm={() => setShowAddBatch(false)} /> : null}
                <p className="route-header">Item Details</p>

                <div id="item-information-div">
                    <img id="item-img"></img>
                    <p id="item-name">{itemDetails.supply_name}</p>
                    <p id="item-categ">{itemDetails.category_name}</p>
                    <p id="item-brand">Brand: {itemDetails.brand}</p>
                    <p id="item-desc">Description: {itemDetails.description}</p>
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
                                    <th>Batch ID</th>
                                    <th>Stock Level</th>
                                    <th>Status</th>
                                    <th>Expiration Date</th>
                                    <th>Last Updated</th>
                                    <th></th>
                                </tr>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}