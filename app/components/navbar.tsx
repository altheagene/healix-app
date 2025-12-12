import { NavLink } from "react-router";
import React from "react";

import { index } from "@react-router/dev/routes";


export default function Navbar(props:any){
    const [width, setWidth] = React.useState(0)

    React.useEffect(() => {
    // Safe: window exists ONLY in the browser
    const handleResize = () => setWidth(window.innerWidth);

    handleResize(); // set initial width
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
    }, []);

    const [routeChosen, setRouteChosen] = React.useState('Dashboard')
    const navbarObj = [
        {
            route: "/",
            text: 'Dashboard',
            icon: 'bi bi-speedometer2'
        },
        {
            route: "/patients",
            text: 'Patients',
            icon: 'bi bi-person'
        },
        {
            route: "/appointments",
            text: 'Appointments',
            icon: 'bi bi-calendar-date'
        },
        {
            route: "/inventory",
            text: 'Inventory',
            icon: 'bi bi-box'
        },
        {
            route: "/staff",
            text: 'Staff' ,
            icon: 'bi bi-people'
        },
        {
            route: "/reports",
            text: 'Reports' ,
            icon: 'bi bi-file-earmark',
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
                    route: '/appointmentreports',
                    text: 'Appointment Reports'
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
                <div className="navlist-bg" style={{backgroundColor: routeChosen === obj.text ? '#b1c1ffac' : 'transparent',
                                                    width: routeChosen === obj.text ? '100%' : '0px'
                }}>
                    <NavLink to={obj.route} onClick={() => setRouteChosen(obj.text)}>
                        <i className={obj.icon} style={{marginRight: '1.3rem', fontSize: '1.3rem', fontWeight: 700, color:  routeChosen === obj.text ? '#1c1c1c' : '#2b2b2bdb'}}></i>
                        <p 
                            // style={{color:  routeChosen === obj.text ? '#1c1c1c' : '#2b2b2bb0'}}
                            >
                            {obj.text}</p>
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
        <nav id="navbar" 
                // className={`${props.showNavbar ? "show-navbar" : "hide-navbar"} ${width < 1000 ? "navbar-mobile" : ""}`} 
                style={{
                    transform: props.showNavbar ? 'translateX(0%)' : 'translateX(-100%)',
                    position: width < 1000 ? 'absolute' : 'relative'
                }}>
            <ul> 
                {navListComponents}
            </ul>
        </nav>
    )
}