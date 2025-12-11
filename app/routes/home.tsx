import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import '../home.css'
import React from "react";
import 'bootstrap-icons/font/bootstrap-icons.css';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { API_BASE_URL } from "./api";



export default function Dashboard() {

  const [patients, setPatients] = React.useState<any[]>();
  const [appointments, setAppointments] = React.useState<any[]>();
  const [supplies, setSupplies] = React.useState<any[]>();
  const [staff, setStaff] = React.useState<any[]>()

const categoryData = React.useMemo(() => {
  if (!supplies) return [];

  const counts: Record<string, number> = {};

  supplies.forEach(item => {
    counts[item.category_name] = (counts[item.category_name] || 0) + 1;
  });

  return Object.entries(counts).map(([category_name, count]) => ({
    name: category_name,
    value: count
  }));
}, [supplies]);

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AA46BE', '#FF4C4C'];


  React.useEffect(() => {
    fetch(`${API_BASE_URL}/getallpatients`)
    .then(res => res.json())
    .then(data => setPatients(data))

    fetch(`${API_BASE_URL}/getappointmentstoday`)
    .then(res => res.json())
    .then(data => setAppointments(data))

    fetch(`${API_BASE_URL}/getallsupplies`)
    .then(res => res.json())
    .then(data => setSupplies(data))

    fetch(`${API_BASE_URL}/getall?table=staff`)
    .then(res => res.json())
    .then(data => setStaff(data))
  }, [])
  return (
    <div className="route-page">
      <h1 className="route-header">Dashboard</h1>
      <p className="route-page-desc">Welcome back! Here's your clinic overview for today</p>
      <div>
          <div className="stats-container">
            <h2 className="title">Clinic Statistics</h2>

            
            <div className="cards-row">
              <div className="stat-card">
                <div className="icon blue"><i className="bi bi-people"></i></div>
                <div className="value">{patients?.length}</div>
                <div className="label">Total Patients</div>
              </div>


              <div className="stat-card">
                <div className="icon green"><i className="bi bi-calendar-date"></i></div>
                <div className="value">{appointments?.length}</div>
                <div className="label">Appointments Today</div>
              </div>


              <div className="stat-card">
                <div className="icon orange"><i className="bi bi-clock"></i></div>
                <div className="value">{supplies?.length}</div>
                <div className="label">Total Supplies</div>
              </div>

              <div className="stat-card">
                <div className="icon purple"><i className="bi bi-person"></i></div>
                <div className="value">{staff?.length}</div>
                <div className="label">Total Staff</div>
              </div>
            </div>

          </div>
      </div>
      <div className="inventory-chart-container">
  <h2 className="title">Inventory by Category</h2>
  <ResponsiveContainer width="100%" height={300}>
    <PieChart>
      <Pie
        data={categoryData}
        dataKey="value"
        nameKey="name"
        cx="50%"
        cy="50%"
        outerRadius={110}
        label
      >
        {categoryData.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip />
      <Legend />
    </PieChart>
  </ResponsiveContainer>
</div>
    </div>
  )
}
