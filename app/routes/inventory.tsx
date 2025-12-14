import Searchbar from "~/components/searchbar"
import '../inventory.css'
import AddItem from "~/components/additem"
import ItemDetails from "./itemdetails"
import React from "react"
import { NavLink, useNavigate } from "react-router"
import {API_BASE_URL} from '../config'


export default function Inventory() {
  const navigate = useNavigate();
  const [showAddItem, setShowAddItem] = React.useState(false);
  const [supplies, setSupplies] = React.useState<any[]>([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [chosenActive, setChosenActive] = React.useState(true)

  React.useEffect(() => {
    fetch(`${API_BASE_URL}/getallsupplies`)
      .then(res => res.json())
      .then(data => setSupplies(data));

      fetch(`${API_BASE_URL}/refreshbatches`)
        .then(res => res.json())
  }, []);

  async function removeItem( id:any){
    const responses = await fetch(`${API_BASE_URL}/deleteitem`, {
      method: 'POST',
      headers: {
        'Content-Type' : 'application/json'
      },
      body: JSON.stringify({supply_id: id , is_active: false})
    })

    const result = await responses.json()
    console.log(result);
    refetchSupplies();
  }

  async function reactivateItem( id:any){
    const responses = await fetch(`${API_BASE_URL}/deleteitem`, {
      method: 'POST',
      headers: {
        'Content-Type' : 'application/json'
      },
      body: JSON.stringify({supply_id: id , is_active: true})
    })

    const result = await responses.json()
    console.log(result);
    refetchSupplies();
  }

  function refetchSupplies() {
    fetch(`${API_BASE_URL}/getallsupplies`)
      .then(res => res.json())
      .then(data => setSupplies(data));
  }

  // Filtered supplies based on search term
  const filteredSupplies = supplies.filter(supply => 
  (supply.supply_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
   supply.category_name.toLowerCase().includes(searchTerm.toLowerCase())) && 
  supply.is_active == chosenActive
);

  console.log(supplies)

  return (
    <div className="route-page">
      <div id="inventory-div">
        {showAddItem && (
          <AddItem hideForm={() => setShowAddItem(false)} refetchSupplies={refetchSupplies} />
        )}

        <h1 className="route-header">Inventory</h1>
        <p className="route-page-desc">
          Manage your clinic's inventory, supplies, and equipment.
        </p>

        {/* Searchbar */}
        <input type="text"
          id="searchbar"
          placeholder="Search item"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* Filters (optional) */}
        {/* <div id="filter-div">
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
        </div> */}

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem" }}>
          <div id="filter-by-category" style={{ visibility: "hidden" }}>
            <button className="category-filter">All Items</button>
            <button className="category-filter">Medications</button>
            <button className="category-filter">Medical Supplies</button>
            <button className="category-filter">Equipment</button>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem" }} >
          <div className="status-bar">
            <button 
                onClick={() => setChosenActive(true)} 
                className="status-btn"
                style={{backgroundColor: chosenActive ? 'white' : 'transparent'}}>Active Supplies</button>
            <button 
                  onClick={() => setChosenActive(false)}
                  className="status-btn"
                  style={{backgroundColor: !chosenActive ? 'white' : 'transparent'}}>Deleted Supplies</button>
          </div>

          <button className="add-button" onClick={() => setShowAddItem(true)}>
            + Add Item
          </button>
        </div>
        {/* Inventory Table */}
        <div id="inventory-table-container" className="table-container">
          <table id="inventory-table">
            <thead>
              <tr>
                <th>Supply Name</th>
                <th>Category</th>
                <th>Total Stock</th>
                <th>Status</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSupplies.length > 0 ? filteredSupplies.map((supply) => (
                <tr key={supply.supply_id}>
                  <td>{supply.supply_name}</td>
                  <td>{supply.category_name}</td>
                  <td>{supply.total_stock > 0 ? supply.total_stock : 0}</td>
                  <td>
                    <p
                      style={{
                        backgroundColor:
                          supply.total_stock > 20
                            ? "#6EC207"
                            : supply.total_stock > 0
                            ? "orange"
                            : "#FB4141",
                        padding: "0.3rem",
                        textAlign: "center",
                        borderRadius: "10px",
                        width: "80px",
                        fontSize: "0.7rem",
                        height: "25px",
                        fontWeight: "500",
                        color: "white",
                      }}
                    >
                      {supply.total_stock > 20
                        ? "In Stock"
                        : supply.total_stock > 0
                        ? "Low Stock"
                        : "Out-of-Stock"}
                    </p>
                  </td>
                  <td>{supply.last_updated || "None"}</td>
                  <td className="action-cell">
  <div className="action-menu">
    <button className="action-trigger">
      <i className="bi bi-three-dots-vertical"></i>
    </button>

    <div className="action-dropdown">
      <button onClick={() => navigate(`/itemdetails/${supply.supply_id}`)}>
        <i className="bi bi-eye"></i> View
      </button>

      {supply.is_active ? (
        <button onClick={() => removeItem(supply.supply_id)}>
          <i className="bi bi-trash"></i> Delete
        </button>
      ) : (
        <button onClick={() => reactivateItem(supply.supply_id)}>
          <i className="bi bi-arrow-clockwise"></i> Reactivate
        </button>
      )}
    </div>
  </div>
</td>

                    
                </tr>
              )) : <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '15px' }}>
                              No Supplies found
                          </td>
                      </tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
