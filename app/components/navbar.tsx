import React from "react";
import { NavLink, useLocation } from "react-router";
import { STAFF_ROLE_NAME } from "../roles";

const NAV_ITEMS = [
    { route: "/", text: "Dashboard", icon: "bi-clock", match: ["/"] },
    { route: "/appointments", text: "Appointments", icon: "bi-calendar-date", match: ["/appointments", "/addappointment", "/appointmentreports"] },
    { route: "/patients", text: "Student Records", icon: "bi-folder", match: ["/patients", "/patientdetails", "/addnewpatient"] },
    { route: "/records", text: "Clinic Visits", icon: "bi-file-earmark-text", match: ["/records", "/patientreport", "/others"] },
    { route: "/inventory", text: "Medicine Inventory", icon: "bi-box", match: ["/inventory", "/itemdetails", "/inventoryreport"] },
    { route: "/reports", text: "Reports", icon: "bi-bar-chart-line", match: ["/reports"], cliniciansOnly: true },
    { route: "/staff", text: "Staff", icon: "bi-people", match: ["/staff"] },
]

function sectionActive(pathname: string, prefixes: string[]) {
    return prefixes.some(prefix =>
        prefix === "/"
            ? pathname === "/"
            : pathname === prefix || pathname.startsWith(`${prefix}/`)
    )
}

export default function Navbar(props: {
    expanded: boolean
    onToggle: () => void
    onLogout?: () => void
}) {
    const expanded = props.expanded
    const { pathname } = useLocation()
    // Read after the first render: the server cannot see localStorage, and the role can
    // change when the app re-checks it, so it is read again on each page change.
    const [isStaffRole, setIsStaffRole] = React.useState(true)
    React.useEffect(() => { setIsStaffRole(localStorage.getItem("role") === STAFF_ROLE_NAME) }, [pathname])

    return (
        <nav className={`flex h-full flex-shrink-0 flex-col border-r border-sage-200 bg-white transition-all duration-200 ${expanded ? "w-56" : "w-[72px]"}`}>
            <button
                type="button"
                title={expanded ? "Collapse menu" : "Expand menu"}
                onClick={props.onToggle}
                className={`mt-3 flex h-12 items-center border-none bg-transparent text-xl text-brand-800 ${expanded ? "justify-start px-5" : "w-full justify-center"}`}
            >
                <i className="bi bi-list" />
            </button>

            <ul className="mt-2 flex w-full flex-col gap-1 px-2">
                {NAV_ITEMS.filter(item => !(item.cliniciansOnly && isStaffRole)).map((item) => {
                    const active = sectionActive(pathname, item.match)
                    return (
                    <li key={item.route} title={expanded ? undefined : item.text}>
                        <NavLink
                            to={item.route}
                            className={`relative flex h-11 items-center rounded-lg text-[0.95rem] font-medium transition ${
                                expanded ? "gap-3 px-3" : "justify-center px-0"
                            } ${
                                active
                                    ? "bg-brand-50 text-brand-800"
                                    : "text-sage-400 hover:bg-sage-50 hover:text-brand-800"
                            }`}
                        >
                            <i className={`bi ${item.icon} text-xl`} />
                            {expanded && <span className="truncate">{item.text}</span>}
                            {active && (
                                <span className="absolute right-0 h-6 w-[3px] rounded-l-full bg-brand-800" />
                            )}
                        </NavLink>
                    </li>
                    )
                })}
            </ul>

            <div className="mb-5 mt-auto flex flex-col gap-1 px-2">
                <NavLink
                    to="/profile"
                    title={expanded ? undefined : "Profile"}
                    className={`relative flex h-11 items-center rounded-lg text-[0.95rem] font-medium transition ${
                        expanded ? "gap-3 px-3" : "justify-center px-0"
                    } ${
                        pathname === "/profile"
                            ? "bg-brand-50 text-brand-800"
                            : "text-sage-400 hover:bg-sage-50 hover:text-brand-800"
                    }`}
                >
                    <i className="bi bi-person-circle text-xl" />
                    {expanded && <span className="truncate">Profile</span>}
                    {pathname === "/profile" && (
                        <span className="absolute right-0 h-6 w-[3px] rounded-l-full bg-brand-800" />
                    )}
                </NavLink>
                {props.onLogout && (
                    <button
                        type="button"
                        onClick={props.onLogout}
                        title="Logout"
                        className={`flex h-11 items-center border-none bg-transparent text-sage-400 hover:text-brand-800 ${
                            expanded ? "gap-3 rounded-lg px-3 text-[0.95rem] font-medium" : "w-full justify-center text-xl"
                        }`}
                    >
                        <i className="bi bi-box-arrow-right text-xl" />
                        {expanded && <span>Logout</span>}
                    </button>
                )}
            </div>
        </nav>
    )
}
