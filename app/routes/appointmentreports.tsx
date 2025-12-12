import React from "react";
import {API_BASE_URL} from '../config'


export default function AppointmentReport() {
  const boxStyle = {
    border: "1px solid #ccc",
    borderRadius: "8px",
    padding: "20px",
    textAlign: "center",
    flex: 1,
    margin: "10px",
    backgroundColor: "#f9f9f9",
  };

  const containerStyle = {
    display: "flex",
    justifyContent: "space-around",
    margin: "20px 0",
  };

  const numberStyle = {
    fontSize: "2rem",
    fontWeight: "bold",
    margin: "10px 0",
  };

  const [dateRange, setDateRange] = React.useState({
    from_date: new Date().toISOString().split("T")[0],
    to_date: new Date().toISOString().split("T")[0],
  });

  const [apptLogs, setApptLogs] = React.useState<any[]>([]);

  // Totals state
  const [totals, setTotals] = React.useState({
    upcoming: 0,
    completed: 0,
    cancelled: 0,
  });

  
  const downloadReport = async () => {
      const url = `${API_BASE_URL}/download/inventorylogs?fromdate=${encodeURIComponent(dateRange.from_date)}&todate=${encodeURIComponent(dateRange.to_date)}`;
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = "clinic_visit_report.csv";
      link.click();
  }

  // Calculate totals based on status
  React.useEffect(() => {
    const summary = apptLogs.reduce(
      (acc, appt) => {
        switch (appt.status?.toLowerCase()) {
          case "upcoming":
            acc.upcoming += 1;
            break;
          case "completed":
            acc.completed += 1;
            break;
          case "cancelled":
            acc.cancelled += 1;
            break;
        }
        return acc;
      },
      { upcoming: 0, completed: 0, cancelled: 0 }
    );

    setTotals(summary);
  }, [apptLogs]);

  // Fetch appointments initially and whenever dateRange changes
  React.useEffect(() => {
    fetch(
      `${API_BASE_URL}/getapptlogs?fromdate=${dateRange.from_date}&todate=${dateRange.to_date}`
    )
      .then((res) => res.json())
      .then((data) => setApptLogs(data));
  }, [dateRange]);

  return (
    <div className="route-page">
      <h1 className="route-header">Appointment Reports</h1>
      
      <div style={{ margin: "2rem 0", display: "flex", gap: "2rem" }}>
        <label>
          From
          <input
            type="date"
            value={dateRange?.from_date}
            onChange={(e) =>
              setDateRange({ ...dateRange, from_date: e.target.value })
            }
          />
        </label>

        <label>
          To
          <input
            type="date"
            value={dateRange?.to_date}
            onChange={(e) =>
              setDateRange({ ...dateRange, to_date: e.target.value })
            }
          />
        </label>
      </div>
      <button onClick={downloadReport}>Click</button>
      <div style={containerStyle}>
        <div style={boxStyle}>
          <div>Total Appointments</div>
          <div style={numberStyle}>
            <p style={{ color: "#6EC207" }}>{apptLogs?.length}</p>
          </div>
        </div>
        <div style={boxStyle}>
          <div>Total Upcoming Appointments</div>
          <div style={numberStyle}>
            <p style={{ color: "orange" }}>{totals.upcoming}</p>
          </div>
        </div>
        <div style={boxStyle}>
          <div>Total Completed Appointments</div>
          <div style={numberStyle}>
            <p style={{ color: "green" }}>{totals.completed}</p>
          </div>
        </div>
        <div style={boxStyle}>
          <div>Total Cancelled Appointments</div>
          <div style={numberStyle}>
            <p style={{ color: "red" }}>{totals.cancelled}</p>
          </div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style={{ width: "70px" }}>ID</th>
            <th>Patient</th>
            <th>Date</th>
            <th>Time</th>
            <th>Type</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {apptLogs.length > 0 ? apptLogs?.map((appt) => (
            <tr key={appt.appointment_id}>
              <td>{appt.appointment_id}</td>
              <td>{appt.patient_name}</td>
              <td>{appt.appointment_date}</td>
              <td>{appt.start_time}</td>
              <td>{appt.service_name}</td>
              <td><p style={{ 
                padding: '0.3rem', 
                borderRadius: '10px',
                color:  'white',
                fontSize: '0.8rem',
                width: '90px',
                textAlign: 'center',
                fontWeight: '500',backgroundColor: appt.status === 'Completed' ? '#6EC207' : 
                appt.status === 'Cancelled' ? '#ed3e27' :
                    '#799EFF'}}>{appt.status}</p></td>
            </tr>
          )) :
              <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '15px' }}>
                      No Appointments found
                  </td>
              </tr>
          }
        </tbody>
      </table>
    </div>
  );
}
