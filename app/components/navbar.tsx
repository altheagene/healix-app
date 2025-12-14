import { NavLink } from "react-router";
import React from "react";
import { useNavigate } from "react-router";
import {API_BASE_URL} from '../config'
import img  from '../images/user.png'


export default function Navbar(props:any){
    const [width, setWidth] = React.useState(0)
    const navigate = useNavigate()
    const [user, setUser] = React.useState<any[]>()
    const id = localStorage.getItem('userid')

    console.log(user)

    React.useEffect(() => {
        // Safe: window exists ONLY in the browser
        const handleResize = () => setWidth(window.innerWidth);

        handleResize(); // set initial width
        window.addEventListener("resize", handleResize);

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    React.useEffect(() => {
        fetch(`${API_BASE_URL}/finduser?id=${id}`)
        .then(res => res.json())
        .then(data => setUser(data[0]))
    }, [])

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
            route: "#",
            text: 'Reports' ,
            icon: 'bi bi-file-earmark',
            subroutes: [
                {
                    route: '/patientreport',
                    text: 'Clinic Visit Reports'
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
        }
    
    ]

    const navListComponents = navbarObj.map((obj) => {


        const subroutes = obj.hasOwnProperty('subroutes') ? obj.subroutes : null;
        const subroutesElements = subroutes ? subroutes.map(subroute => {
            return(
                <li>
                    <NavLink to={subroute.route}
                            className={({ isActive }) =>
                                isActive ? "nav-active" : "nav-inactive"
                            }>
                        {subroute.text}</NavLink>
                </li>
            )
        }) : null

        return(
            <li >
                <div className="navlist-bg" 
                    style={{backgroundColor: routeChosen === obj.text ? '#b1c1ffac' : 'transparent',
                                                    width: routeChosen === obj.text ? '100%' : '0px',
                    }}
                    >
                    <NavLink 
                        to={obj.route ||'#'} 
                        onClick={() => {setRouteChosen(obj.text); navigate(obj.route)}}
                        >
                        <i 
                            className={obj.icon} 
                            style={{
                                marginRight: '1.3rem', 
                                fontSize: '1.3rem', 
                                fontWeight: 700, color:  routeChosen === obj.text ? '#1c1c1c' : '#2b2b2bdb'}}></i>
                        <p 
                            // style={{color:  routeChosen === obj.text ? '#1c1c1c' : '#2b2b2bb0'}}
                            >
                            {obj.text}</p>
                    </NavLink>
                </div>

                {subroutes ? 
                <div id="subroute-div" 
                    style={{height: routeChosen === obj.text ? '300px' : '0px',
                                             margin: routeChosen === obj.text ? '1rem 0 1rem 2rem' : '0 0 0  2.5rem'
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
                className={width < 1300 ? 'navbar-mobile' : ''}
                style={{
                    // transform: props.showNavbar ? 'translateX(0%)' : 'translateX(-100%)',
                    position: width < 1300 ? 'absolute' : 'relative',
                    display: props.showNavbar ? 'block' : 'none',
                    zIndex: width < 1300 ? '2' : 0,
                    
                }}>
            <ul> 
                {navListComponents}
            </ul>
            <div style={{display: 'flex', gap: '1rem', alignItems: 'center', position: 'absolute', bottom: '1rem', left: '0.5rem'}}>
                <div style={{height: 50, width: 50, overflow:"hidden", borderRadius: '50%'}}>
                    <img style={{objectFit: 'cover', height: 'auto', width: '100%'}} src={img}></img>
                </div>
                
                <p style={{fontWeight: '600'}}>{user?.first_name} {user?.last_name}</p>
            </div>
        </nav>
    )
}