import { Outlet } from "react-router";
import Navbar from "../components/navbar";
import "../app.css";

export default function MainLayout() {
  return (
    <>
      <div id='header'>
        <h1>Healix</h1>
      </div>

      <div id="main-content">
        <Navbar />
        <div id="route-container">
          <Outlet />
        </div>
      </div>
    </>
  );
}
