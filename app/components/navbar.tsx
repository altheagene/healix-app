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
            text: 'Reports' ,
            subroutes: [
                {
                    route: '/patientreport',
                    text: 'Patient Reports'
                },
                {
                    route: '/inventoryreport',
                    text: 'Inventory Reports'
                },
                {
                    route: '/appointmentreport',
                    text: 'Appointment Reports'
                },
                {
                    routes: '/staffreport',
                    text: 'Staff Reports'
                }

            ]
        },
        {
            route: '/inventory',
            text: 'Test'
        }
    ]

    const navListComponents = navbarObj.map((obj) => {


        const subroutes = obj.hasOwnProperty('subroutes') ? obj.subroutes : null;
        const subroutesElements = subroutes ? subroutes.map(subroute => {
            return(
                <li>
                    <NavLink to={subroute.route}>{subroute.text}</NavLink>
                </li>
            )
        }) : null

        return(
            <li>
                <div className="navlist-bg" style={{backgroundColor: routeChosen === obj.text ? '#B1C1FF' : 'transparent',
                                                    width: routeChosen === obj.text ? '90%' : '0px'
                }}>
                    <NavLink to={obj.route} onClick={() => setRouteChosen(obj.text)}>
                        {obj.text}
                    </NavLink>
                </div>

                {subroutes ? 
                <div id="subroute-div" style={{height: routeChosen === obj.text ? '300px' : '0px',
                                             margin: routeChosen === obj.text ? '1rem 0 1rem 2.5rem' : '0 0 0  2.5rem'
                }}>
                    <ul>
                        {subroutesElements}
                    </ul>
                </div> : null}

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