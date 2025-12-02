import Searchbar from "~/components/searchbar"
import '../inventory.css'
import '../app.css'
import AddItem from "~/components/additem"
import ItemDetails from "./itemdetails"
import React from "react"
import { NavLink, useNavigate } from "react-router"

export default function Inventory(){

    const navigate = useNavigate()
    const [showAddItem, setShowAddItem] = React.useState(false)
    const [supplies, setSupplies] = React.useState<any[]>([]);
    

    console.log(supplies)
    React.useEffect(() => {
        fetch(`http://localhost:5000/getallsupplies`).
        then(res => res.json()).
        then(data => setSupplies(data))

    }, [])

    return(
        <div className="route-page">
            <div id="inventory-div">
                {showAddItem ? <AddItem hideForm={() => setShowAddItem(false)}/> : null}
                <h1 className="route-header">Inventory</h1>
                <p className="route-page-desc">Manage your clinic's inventory, supplies, and equipment.</p>
                <Searchbar id='inventory-searchbar' placeholder='Search item'/>
                <div id="filter-div">
                    <select>
                        <option value="all">All Items</option>
                        <option value="medications">Medications</option>
                        <option value="medical-supplies">Medical Supplies</option>
                        <option value="equipment">Equipment</option>
                    </select>

                    <select>
                        <option value="all">All Status</option>
                        <option value="instock">In Stock</option>
                        <option value="lowstock">Low Stock</option>
                        <option value="out-of-stock">Out of Stock</option>
                    </select>

                </div>
                <div style={{display: 'flex', justifyContent: 'space-between',  marginTop: '1rem',}}>
                    <div id="filter-by-category" style={{visibility: 'hidden'}}>
                        <button className="category-filter">All Items</button>
                        <button className="category-filter">Medications</button>
                        <button className="category-filter">Medical Supplies</button>
                        <button className="category-filter">Equipment</button>
                    </div>
                    <button id="add-item-btn" onClick={() => setShowAddItem(true)}>+ Add Item</button>
                </div>
                <div id="inventory-table-container" className="table-container">
                    <table id="inventory-table">
                        <tr>
                            <th style={{maxWidth: '50px'}}>ID</th>
                            <th>Name</th>
                            <th>Stock Level</th>
                            <th>Status</th>
                            {/* <th>Comments</th> */}
                            <th>Last Updated</th>
                            <th></th>
                        </tr>

                        {supplies.map(supply => {
                            return(
                                <tr onClick={() => navigate(`/itemdetails/${supply.supply_id}`)}>
                                    <td>{supply.supply_id}</td>
                                    <td>{supply.supply_name}</td>
                                    <td>--</td>
                                    <td>--</td>
                                    {/* <td>--</td> */}
                                    <td>--</td>
                                    <td></td>
                                </tr>
                            )
                        })}
                    </table>
                </div>
                {/* <NavLink to='/itemdetails'>Item Details</NavLink> */}
            </div>
        </div>
    )
}