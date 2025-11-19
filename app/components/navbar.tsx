import { NavLink } from "react-router";
import React from "react";

export default function Navbar(){

    const [routeChosen, setRouteChosen] = React.useState('Home')
    const navbarObj = [
        {
            route: "/",
            text: 'Home'
        },
        {
            route: "/patients",
            text: 'Patients' 
        },
        {
            route: "/appointments",
            text: 'Appointments' 
        },
        {
            route: "/inventory",
            text: 'Inventory' 
        },
        {
            route: "/staff",
            text: 'Staff' 
        },
        {
            route: "/reports",
            text: 'Reports' 
        }
    ]

    const navListComponents = navbarObj.map((obj) => {
        return(
            <li>
                <div className="navlist-bg" style={{backgroundColor: routeChosen === obj.text ? '#B1C1FF' : 'transparent',}}>
                    <NavLink to={obj.route} onClick={() => setRouteChosen(obj.text)}>
                        {obj.text}
                    </NavLink>
                </div>
            </li>
        )
    })
    return(
        <nav id="navbar">
            <ul>
                {navListComponents}
            </ul>
        </nav>
    )
}