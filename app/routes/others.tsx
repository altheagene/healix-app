import React from "react";
import { API_BASE_URL } from "../config";
import "bootstrap-icons/font/bootstrap-icons.css";

export default function Services() {
  const [services, setServices] = React.useState<any[]>([]);
  const [newService, setNewService] = React.useState("");

  React.useEffect(() => {
    loadServices();
  }, []);

  function loadServices() {
    fetch(`${API_BASE_URL}/getall?table=services`)
      .then(res => res.json())
      .then(data => setServices(data));
  }

  function addService() {
    if (!newService.trim()) return;

    fetch(`${API_BASE_URL}/addservice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ service_name: newService.trim() })
    }).then(() => {
      setNewService("");
      loadServices();
    });
  }

  return (
    <div className="route-page">
      <h1 className="route-header">Clinic Services</h1>
      <p className="route-page-desc">Services offered during clinic visits</p>

      {/* Add service */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexDirection:'column' }}>
        <h3>Add new Clinic Service</h3>
        <div>
             <input
            type="text"
            placeholder="Service name"
            value={newService}
            onChange={(e) => setNewService(e.target.value)}
            id="searchbar"
            />
            <button className="add-button" onClick={addService}>
            + Add Service
            </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="app-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Service Name</th>
            </tr>
          </thead>
          <tbody>
            {services.length > 0 ? (
              services.map(service => (
                <tr key={service.service_id}>
                  <td>{service.service_id}</td>
                  <td>{service.service_name}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} style={{ textAlign: "center" }}>
                  No services found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
