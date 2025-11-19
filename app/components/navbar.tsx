import { NavLink } from "react-router";

export default function Navbar(){
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
            <li> <NavLink to={obj.route}>{obj.text}</NavLink></li>
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