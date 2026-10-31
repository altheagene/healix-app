import React from "react";
import { apiFetch } from "../api";
import { inlineActionClass } from "./rowactions";

/*
 * "Recent activity" on My Profile: what you changed in Healix, and any failed sign-ins
 * on your account. Read from the audit log by /myactivity; record views are left out.
 */

type Activity = { audit_id: number; created_at: string; action: string; resource: string | null; success: number };

const LABELS: Record<string, [string, string]> = {
    login: ["Signed in", "bi-box-arrow-in-right"],
    logout: ["Signed out", "bi-box-arrow-right"],
    login_failed: ["Failed sign-in attempt", "bi-shield-exclamation"],
    login_throttled: ["Sign-in blocked after too many tries", "bi-shield-exclamation"],
    password_reset: ["Changed your password", "bi-key"],
    staff_update: ["Updated a staff profile", "bi-person-gear"],
    staff_create: ["Added a staff member", "bi-person-plus"],
    staff_active_change: ["Switched a staff account on or off", "bi-person-slash"],
    admin_password_reset: ["Reset a staff password", "bi-key"],
    patient_create: ["Added a patient", "bi-person-plus"],
    patient_update: ["Updated a patient's details", "bi-person-lines-fill"],
    patient_archive: ["Archived a patient", "bi-archive"],
    patient_allergy_add: ["Added an allergy to a patient", "bi-exclamation-diamond"],
    patient_allergy_delete: ["Removed an allergy from a patient", "bi-exclamation-diamond"],
    patient_condition_add: ["Added a condition to a patient", "bi-heart-pulse"],
    patient_condition_delete: ["Removed a condition from a patient", "bi-heart-pulse"],
    allergy_create: ["Added an allergy to the list", "bi-plus-circle"],
    condition_create: ["Added a condition to the list", "bi-plus-circle"],
    visit_create: ["Logged a visit", "bi-clipboard2-pulse"],
    visit_update: ["Edited a visit", "bi-clipboard2-pulse"],
    visit_outcome: ["Recorded a visit outcome", "bi-clipboard2-check"],
    visit_medication_add: ["Gave medicine during a visit", "bi-capsule"],
    visit_medication_update: ["Changed medicine given in a visit", "bi-capsule"],
    parent_notified: ["Noted a parent was contacted", "bi-telephone-outbound"],
    patient_checkin: ["Checked in a patient", "bi-door-open"],
    inventory_create: ["Added an inventory item", "bi-box-seam"],
    inventory_update: ["Updated an inventory item", "bi-box-seam"],
    inventory_batch_create: ["Received a stock batch", "bi-boxes"],
    inventory_batch_update: ["Edited a stock batch", "bi-boxes"],
    inventory_stock_adjust: ["Adjusted stock", "bi-sliders"],
    inventory_dispose: ["Disposed of stock", "bi-trash3"],
    appointment_create: ["Booked an appointment", "bi-calendar-plus"],
    appointment_update: ["Updated an appointment", "bi-calendar-check"],
    service_create: ["Added a service", "bi-plus-circle"],
};

function describe(item: Activity): [string, string] {
    if (LABELS[item.action]) return LABELS[item.action];
    const area = item.resource && item.resource !== "app" ? ` (${item.resource})` : "";
    return [`Made a change${area}`, "bi-pencil"];
}

// The audit log stores UTC as "YYYY-MM-DD HH:MM:SS".
function when(value: string) {
    const date = new Date(value.replace(" ", "T") + "Z");
    if (Number.isNaN(date.getTime())) return { relative: value, exact: value };
    const exact = date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
    const minutes = Math.round((Date.now() - date.getTime()) / 60000);
    let relative = exact;
    if (minutes < 1) relative = "Just now";
    else if (minutes < 60) relative = `${minutes} min ago`;
    else if (minutes < 24 * 60) relative = `${Math.round(minutes / 60)} h ago`;
    else if (minutes < 7 * 24 * 60) relative = `${Math.round(minutes / (24 * 60))} d ago`;
    return { relative, exact };
}

const FEW = 8;
const MORE = 50;

export default function MyActivity() {
    const [items, setItems] = React.useState<Activity[] | null>(null);
    const [failed, setFailed] = React.useState(false);
    const [limit, setLimit] = React.useState(FEW);

    React.useEffect(() => {
        let cancelled = false;
        setFailed(false);
        apiFetch(`/myactivity?limit=${limit}`)
            .then(res => res.ok ? res.json() : Promise.reject())
            .then(data => { if (!cancelled) setItems(Array.isArray(data) ? data : []); })
            .catch(() => { if (!cancelled) setFailed(true); });
        return () => { cancelled = true; };
    }, [limit]);

    return (
        <section className="rounded-3xl bg-white px-6 pb-4 pt-5 shadow-card">
            <div className="mb-1 flex items-center justify-between gap-3">
                <h2 className="m-0 flex items-center gap-2 text-sm font-semibold text-sage-900">
                    <i className="bi bi-clock-history text-sage-400" aria-hidden="true" /> Recent activity
                </h2>
                <span className="text-xs text-sage-400">Your changes and sign-ins</span>
            </div>

            {failed ? (
                <p className="m-0 py-6 text-center text-sm text-sage-500">Your activity could not be loaded.</p>
            ) : items === null ? (
                <ul className="m-0 list-none space-y-3 p-0 py-3" aria-label="Loading">
                    {[0, 1, 2].map(i => <li key={i} className="h-5 animate-pulse rounded bg-sage-100" />)}
                </ul>
            ) : items.length === 0 ? (
                <p className="m-0 py-6 text-center text-sm text-sage-500">Nothing yet. Changes you make in Healix will show here.</p>
            ) : (
                <ol className="m-0 list-none divide-y divide-sage-100 p-0">
                    {items.map(item => {
                        const [label, icon] = describe(item);
                        const warn = item.action === "login_failed" || item.action === "login_throttled";
                        const time = when(item.created_at);
                        return (
                            <li key={item.audit_id} className="flex items-center gap-3 py-3 text-sm">
                                <span aria-hidden="true"
                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${warn ? "bg-red-50 text-red-600" : "bg-leaf-50 text-brand-800"}`}>
                                    <i className={`bi ${icon}`} />
                                </span>
                                <span className={`min-w-0 flex-1 ${warn ? "font-medium text-red-700" : "text-sage-800"}`}>{label}</span>
                                <time dateTime={item.created_at.replace(" ", "T") + "Z"} title={time.exact}
                                    className="shrink-0 whitespace-nowrap text-xs text-sage-500">
                                    {time.relative}
                                </time>
                            </li>
                        );
                    })}
                </ol>
            )}

            {items && items.length >= limit && limit < MORE && (
                <button type="button" onClick={() => setLimit(MORE)} className={`${inlineActionClass} mt-1`}>
                    Show more
                </button>
            )}
            {items?.some(item => item.action === "login_failed") && (
                <p className="m-0 mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
                    Failed sign-ins you don't recognise? Change your password, which also signs out other devices.
                </p>
            )}
        </section>
    );
}
