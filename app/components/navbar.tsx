import { NavLink, useLocation } from "react-router";

const NAV_ITEMS = [
    { route: "/", text: "Dashboard", icon: "bi-clock", match: ["/"] },
    { route: "/appointments", text: "Appointments", icon: "bi-calendar-date", match: ["/appointments", "/addappointment", "/appointmentreports"] },
    { route: "/patients", text: "Student Records", icon: "bi-folder", match: ["/patients", "/patientdetails", "/addnewpatient"] },
    { route: "/records", text: "Clinic Visits", icon: "bi-file-earmark-text", match: ["/records", "/patientreport", "/others"] },
    { route: "/inventory", text: "Medicine Inventory", icon: "bi-box", match: ["/inventory", "/itemdetails", "/inventoryreport"] },
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

    return (
        <nav className={`flex h-full flex-shrink-0 flex-col border-r border-[#e4ebe6] bg-white transition-all duration-200 ${expanded ? "w-56" : "w-[72px]"}`}>
            <button
                type="button"
                title={expanded ? "Collapse menu" : "Expand menu"}
                onClick={props.onToggle}
                className={`mt-3 flex h-12 items-center border-none bg-transparent text-xl text-[#0b3d3a] ${expanded ? "justify-start px-5" : "w-full justify-center"}`}
            >
                <i className="bi bi-list" />
            </button>

            <ul className="mt-2 flex w-full flex-col gap-1 px-2">
                {NAV_ITEMS.map((item) => {
                    const active = sectionActive(pathname, item.match)
                    return (
                    <li key={item.route} title={expanded ? undefined : item.text}>
                        <NavLink
                            to={item.route}
                            className={`relative flex h-11 items-center rounded-lg text-[0.95rem] font-medium transition ${
                                expanded ? "gap-3 px-3" : "justify-center px-0"
                            } ${
                                active
                                    ? "bg-[#f3f8f4] text-[#0b3d3a]"
                                    : "text-[#8aa39c] hover:bg-[#f7faf7] hover:text-[#0b3d3a]"
                            }`}
                        >
                            <i className={`bi ${item.icon} text-xl`} />
                            {expanded && <span className="truncate">{item.text}</span>}
                            {active && (
                                <span className="absolute right-0 h-6 w-[3px] rounded-l-full bg-[#0b3d3a]" />
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
                            ? "bg-[#f3f8f4] text-[#0b3d3a]"
                            : "text-[#8aa39c] hover:bg-[#f7faf7] hover:text-[#0b3d3a]"
                    }`}
                >
                    <i className="bi bi-person-circle text-xl" />
                    {expanded && <span className="truncate">Profile</span>}
                    {pathname === "/profile" && (
                        <span className="absolute right-0 h-6 w-[3px] rounded-l-full bg-[#0b3d3a]" />
                    )}
                </NavLink>
                {props.onLogout && (
                    <button
                        type="button"
                        onClick={props.onLogout}
                        title="Logout"
                        className={`flex h-11 items-center border-none bg-transparent text-[#8aa39c] hover:text-[#0b3d3a] ${
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
