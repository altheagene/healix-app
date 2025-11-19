import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("patients", "routes/patients.tsx"),
    route("appointments", "routes/appointments.tsx"),
    route("inventory", "routes/inventory.tsx"),
    route("staff", "routes/staff.tsx"),
    route("reports", "routes/reports.tsx")
] satisfies RouteConfig;
