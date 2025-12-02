import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route('login', 'routes/login.tsx'),
    route("patients", "routes/patients.tsx"),
    route("appointments", "routes/appointments.tsx"),
    route("inventory", "routes/inventory.tsx"),
    route("staff", "routes/staff.tsx"),
    route("reports", "routes/reports.tsx"),
    route("patientdetails/:id", 'routes/patientdetails.tsx'),
    route('addappointment', 'routes/addappointment.tsx'),
    route('itemdetails/:id', 'routes/itemdetails.tsx'),
    route('patientreport', 'routes/patientreports.tsx'),
    route('inventoryreport', 'routes/inventoryreport.tsx'),
    route('addnewpatient', 'routes/addnewpatient.tsx')
] satisfies RouteConfig;
