import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import '../home.css'

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Dashboard() {
  return (
    <div className="route-page">
      <h1 className="route-header">Dashboard</h1>
      <div>
          <div className="stats-container">
            <h2 className="title">Patient Statistics</h2>


            <div className="cards-row">
              <div className="stat-card">
                <div className="icon blue">👥</div>
                <div className="value">179</div>
                <div className="label">Total Patients</div>
              </div>


              <div className="stat-card">
                <div className="icon green">📅</div>
                <div className="value">12</div>
                <div className="label">Appointments Today</div>
              </div>


              <div className="stat-card">
                <div className="icon orange">⏱️</div>
                <div className="value">15m</div>
                <div className="label">Avg Wait Time</div>
              </div>
            </div>


            <h3 className="subtitle">Weekly Patient Visits</h3>


            <div className="chart-wrapper">
            <div className="bar" style={{ height: '22vh' }}><span>Mon</span></div>
            <div className="bar" style={{ height: '30vh' }}><span>Tue</span></div>
            <div className="bar" style={{ height: '27vh' }}><span>Wed</span></div>
            <div className="bar" style={{ height: '35vh' }}><span>Thu</span></div>
            <div className="bar" style={{ height: '29vh' }}><span>Fri</span></div>
            <div className="bar" style={{ height: '18vh' }}><span>Sat</span></div>
            <div className="bar" style={{ height: '12vh' }}><span>Sun</span></div>
            </div>
            </div>
      </div>
    </div>
  )
}
