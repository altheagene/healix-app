import { NavLink } from "react-router";

export default function Navbar(){
    return(
        <nav id="navbar">
            <ul>
                <li> <NavLink to={"/"}>Home</NavLink></li>
                <li> <NavLink to={"/patients"}>Patients</NavLink></li>
                <li> <NavLink to={"/appointments"}>Appointments</NavLink></li>
                <li> <NavLink to={"/inventory"}>Inventory</NavLink> </li>
                <li> <NavLink to={"/staff"}>Staff</NavLink> </li>
                <li> <NavLink to={"/reports"}>Reports</NavLink></li>
            </ul>
        </nav>
    )
}