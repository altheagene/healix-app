import React from "react";
import { Outlet } from "react-router";
import Navbar from "../components/navbar";
import "../app.css";

export default function MainLayout() {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <>
      <div id='header'>
        <h1>Healix</h1>
      </div>

      <div id="main-content">
        <Navbar expanded={expanded} onToggle={() => setExpanded(open => !open)} />
        <div id="route-container" className="px-4 py-6">
          <Outlet />
        </div>
      </div>
    </>
  );
}
