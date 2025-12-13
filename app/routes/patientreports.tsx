// import React from "react";
// import {
//   BarChart,
//   Bar,
//   LineChart,
//   Line,
//   PieChart,
//   Pie,
//   Cell,
//   XAxis,
//   YAxis,
//   Tooltip,
//   ResponsiveContainer,
//   Legend
// } from "recharts";

// export default function ReportsPage() {
//   // SAMPLE DATA — replace with your DB data later
//   const stockLevels = [
//     { name: "Bandage", qty: 120 },
//     { name: "Alcohol", qty: 80 },
//     { name: "Gloves", qty: 200 },
//     { name: "Syringe", qty: 50 },
//      { name: "Bandage", qty: 120 },
//     { name: "Alcohol", qty: 80 },
//     { name: "Gloves", qty: 200 },
//     { name: "Syringe", qty: 50 },
//      { name: "Bandage", qty: 120 },
//     { name: "Alcohol", qty: 80 },
//     { name: "Gloves", qty: 200 },
//     { name: "Syringe", qty: 50 },
//      { name: "Bandage", qty: 120 },
//     { name: "Alcohol", qty: 80 },
//     { name: "Gloves", qty: 200 },
//     { name: "Syringe", qty: 50 }
    
//   ];

//   const monthlyUsage = [
//     { month: "Jan", used: 80 },
//     { month: "Feb", used: 90 },
//     { month: "Mar", used: 120 },
//     { month: "Apr", used: 100 },
//   ];

//   const categories = [
//     { name: "Medicine", value: 35 },
//     { name: "Supplies", value: 45 },
//     { name: "Equipment", value: 20 },
//   ];

//   const colors = ["#4e79a7", "#f28e2b", "#e15759"];

//   return (
//     <div
//       style={{
//         padding: "20px",
//         display: "grid",
//         gridTemplateColumns: "1fr",
//         gap: "40px"
//       }}
//      className="route-page">
//       {/* BAR CHART */}
//       <div style={{ width: "100%", height: 300 }}>
//         <h3>Inventory Stock Levels</h3>
//         <ResponsiveContainer>
//           <BarChart data={stockLevels}>
//             <XAxis dataKey="name" />
//             <YAxis />
//             <Tooltip />
//             <Bar dataKey="qty" fill="#4e79a7" />
//           </BarChart>
//         </ResponsiveContainer>
//       </div>

//       {/* LINE CHART */}
//       <div style={{ width: "100%", height: 300 }}>
//         <h3>Monthly Item Usage</h3>
//         <ResponsiveContainer>
//           <LineChart data={monthlyUsage}>
//             <XAxis dataKey="month" />
//             <YAxis />
//             <Tooltip />
//             <Line type="monotone" dataKey="used" stroke="#e15759" strokeWidth={3} />
//           </LineChart>
//         </ResponsiveContainer>
//       </div>

//       {/* PIE CHART */}
//       <div style={{ width: "100%", height: 300 }}>
//         <h3>Category Distribution</h3>
//         <ResponsiveContainer>
//           <PieChart>
//             <Pie
//               data={categories}
//               dataKey="value"
//               nameKey="name"
//               outerRadius={120}
//               label
//             >
//               {categories.map((_, i) => (
//                 <Cell key={i} fill={colors[i % colors.length]} />
//               ))}
//             </Pie>
//             <Legend />
//           </PieChart>
//         </ResponsiveContainer>
//       </div>
//     </div>
//   );
// }

import React from "react"
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";
import {API_BASE_URL} from '../config'


export default function PatientReports()
{
    
    const [dateRange, setDateRange] = React.useState({
        from_date: new Date().toISOString().split("T")[0], 
        to_date: new Date().toISOString().split("T")[0]
    });

    const [visitLogs, setVisitLogs] = React.useState<any[]>()
    const uniquePatientCount = new Set(visitLogs?.map(v => v.patient_id)).size;

    const serviceCounts: { name: string; value: number }[] = [];

    if (visitLogs?.length > 0) {
        const countsMap: Record<string, number> = {};
        visitLogs.forEach(v => {
            countsMap[v.service_name] = (countsMap[v.service_name] || 0) + 1;
        });
        for (const [name, value] of Object.entries(countsMap)) {
            serviceCounts.push({ name, value });
        }
    }
     React.useEffect(() => {
        fetch(`${API_BASE_URL}/clinic_visits?fromdate=${dateRange.from_date}&todate=${dateRange.to_date}`)
        .then(res => res.json())
        .then(data => setVisitLogs(data))
    }, [])

    React.useEffect(() => {
         fetch(`${API_BASE_URL}/clinic_visits?fromdate=${dateRange.from_date}&todate=${dateRange.to_date}`)
        .then(res => res.json())
        .then(data => setVisitLogs(data))
    }, [dateRange])

    function downloadReports(){
        fetch(`${API_BASE_URL}/generateclinicreport?fromdate=${dateRange.from_date}&todate=${dateRange.to_date}`)
    }`${API_BASE_URL}/generateclinicreport?fromdate=${dateRange.from_date}&todate=${dateRange.to_date}`

   const downloadReport = async () => {
    const url = `${API_BASE_URL}/generateclinicreport?fromdate=${encodeURIComponent(dateRange.from_date)}&todate=${encodeURIComponent(dateRange.to_date)}`;
    const response = await fetch(url);
    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = "clinic_visit_report.csv";
    link.click();
}

    
    const colors = ["#4e79a7", "#f28e2b", "#e15759", "#76b7b2", "#59a14f", "#edc949"];

    console.log(visitLogs)
    console.log(dateRange)

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
    flexDirection: 'column',
    justifyContent: "space-around",
    margin: "20px 0",
    width: '30%'
  };

  const graphStyle = {
    display: "flex",
    flexDirection: 'column',
    justifyContent: "space-around",
    margin: "20px 0",
    width: '70%'
  }

  const numberStyle = {
    fontSize: "2rem",
    fontWeight: "bold",
    margin: "10px 0",
  };
    return(
        <div className="route-page">
            <p className="route-header">Clinic Visit Reports</p>
            <p className="route-page-desc">Track clinic visits, demographics, and health trends</p>

            <div className="date-range-picker">
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
            <button 
                onClick={downloadReport} 
                className="download-btn">
                <i className="bi bi-box-arrow-down"></i>
                Download
            </button>
            <div style={{display: 'flex'}} >
                <div style={containerStyle}>
                    <div style={boxStyle}>
                        <div>Total Visits</div>
                        <div style={numberStyle}>{visitLogs?.length}</div>
                    </div>
                    <div style={boxStyle}>
                        <div>No. of Patients Treated</div>
                        <div style={numberStyle}>{uniquePatientCount}</div>
                    </div>
                </div>
                <div style={graphStyle}>
                    <div style={{ width: "100%", height: 350, margin: '0.5rem 0', padding: '2rem', border: "1px solid #ccc",  backgroundColor: "#f9f9f9"}}>
                        <h3>Visits by Service Type</h3>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={serviceCounts}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={120}
                                    label
                                >
                                    {serviceCounts.map((_, i) => (
                                        <Cell key={i} fill={colors[i % colors.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
              
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Patient</th>
                            <th>Type</th>
                            <th>Date</th>
                            <th>Attending</th>
                            <th>Notes</th>
                        </tr>
                    </thead>
                    {visitLogs?.map(visit => {
                        return(
                            <tr>
                                <td>{visit.patient_name}</td>
                                <td>{visit.service_name}</td>
                                <td>{visit.visit_datetime}</td>
                                <td>{visit.staff_name}</td>
                                <td>{visit.notes}</td>
                            </tr>
                        )
                        })
                    }
                </table>
            </div>
            
        </div>
    )
}