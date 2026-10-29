import { apiFetch } from "../api";
import { ROLES } from "../roles";
import StaffDialog from "~/components/staffdialog";
import { Field, ModalForm, inputClass } from "~/components/form";
import { notify } from "../notify";
import React from "react";
import user from "../images/user.png";

export default function UserProfile() {
    const userId = localStorage.getItem("userid");
    const [staff, setStaff] = React.useState<any>();
    const [showEdit, setShowEdit] = React.useState(false);
    const [showReset, setShowReset] = React.useState(false);
    const [resetForm, setResetForm] = React.useState({ current: "", next: "", confirm: "" });
    const [resetError, setResetError] = React.useState("");
    const [resetSaving, setResetSaving] = React.useState(false);

    function loadProfile() {
        if (!userId) return;
        apiFetch(`/finduser?id=${userId}`)
            .then(res => res.json())
            .then(data => setStaff(data[0]));
    }

    React.useEffect(() => {
        loadProfile();
    }, []);

    function openReset() {
        setResetForm({ current: "", next: "", confirm: "" });
        setResetError("");
        setShowReset(true);
    }

    async function resetPassword() {
        if (!resetForm.current || !resetForm.next || !resetForm.confirm) {
            setResetError("Please fill in all password fields.");
            return;
        }
        if (resetForm.next.length < 8) {
            setResetError("New password must be at least 8 characters.");
            return;
        }
        if (resetForm.next !== resetForm.confirm) {
            setResetError("New passwords do not match.");
            return;
        }

        setResetSaving(true);
        setResetError("");
        try {
            const response = await apiFetch("/resetpassword", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    current_password: resetForm.current,
                    new_password: resetForm.next,
                }),
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                setResetError(result.error || "Could not reset your password.");
                return;
            }
            // The server signs out other sessions and sends this one a fresh token.
            if (result.token) localStorage.setItem("token", result.token);
            setShowReset(false);
            notify("Password changed. Other devices have been signed out.");
        } catch {
            setResetError("Could not reset your password.");
        } finally {
            setResetSaving(false);
        }
    }

    const fullName = [staff?.first_name, staff?.middle_name, staff?.last_name]
        .filter(Boolean)
        .join(" ") || "Staff";
    const roleName = ROLES.find(r => r.staff_category_id === Number(staff?.staff_category_id))?.category_name
        || staff?.category_name
        || localStorage.getItem("role")
        || "Staff";

    return (
        <div className="-mx-8 -my-7 min-h-full bg-sage-50 px-8 py-7 font-sans text-brand-800">
            {showEdit && staff && (
                <StaffDialog staffId={staff.staff_id} onClose={() => setShowEdit(false)}
                    onSaved={() => { setShowEdit(false); notify("Profile saved."); loadProfile(); }} />
            )}

            {showReset && (
                <ModalForm title="Change password" onClose={() => setShowReset(false)} onSubmit={resetPassword}
                    submitLabel="Change password" saving={resetSaving} error={resetError} width={460}>
                    <PasswordField id="pw-current" label="Current password" autoComplete="current-password" value={resetForm.current}
                        onChange={value => setResetForm(current => ({ ...current, current: value }))} />
                    <PasswordField id="pw-new" label="New password" autoComplete="new-password" value={resetForm.next}
                        hint="At least 8 characters, and not a common password or your username."
                        onChange={value => setResetForm(current => ({ ...current, next: value }))} />
                    <PasswordField id="pw-confirm" label="Confirm new password" autoComplete="new-password" value={resetForm.confirm}
                        onChange={value => setResetForm(current => ({ ...current, confirm: value }))} />
                    <p className="m-0 text-xs text-sage-500">You stay signed in here; other devices are signed out.</p>
                </ModalForm>
            )}

            <div className="mb-6">
                <h1 className="m-0 text-[2rem] font-semibold tracking-tight">My Profile</h1>
                <p className="mt-1 text-sm text-sage-500">Your clinic account and contact details</p>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="rounded-3xl bg-white p-6 shadow-card">
                    <div className="flex flex-col items-center text-center">
                        <img src={user} className="h-24 w-24 rounded-2xl object-cover" />
                        <p className="mt-4 text-base font-semibold">{fullName}</p>
                        <p className="mt-1 text-sm text-sage-500">{roleName}</p>
                        <button
                            onClick={() => setShowEdit(true)}
                            className="mt-4 inline-flex items-center gap-2 rounded-full bg-leaf-400 px-6 py-2 text-sm font-semibold text-brand-800 transition hover:bg-leaf-500"
                        >
                            Edit
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-4 lg:col-span-2">
                    <div className="rounded-3xl bg-white p-6 shadow-card">
                        <p className="mb-4 text-sm font-semibold">Information</p>
                        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                            <InfoRow label="First name" value={staff?.first_name} />
                            <InfoRow label="Last name" value={staff?.last_name} />
                            <InfoRow label="Sex" value={staff?.sex} />
                            <InfoRow label="Birthday" value={staff?.birthday} />
                            <InfoRow label="Email" value={staff?.email} />
                            <InfoRow label="Phone" value={staff?.phone} />
                        </dl>
                    </div>

                    <div className="rounded-3xl bg-white p-6 shadow-card">
                        <p className="mb-4 text-sm font-semibold">Account</p>
                        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                            <InfoRow label="Username" value={staff?.username} />
                            <InfoRow label="Role" value={roleName} />
                            <InfoRow label="Staff ID" value={staff?.staff_id} />
                        </dl>
                        <button
                            type="button"
                            onClick={openReset}
                            className="mt-5 inline-flex items-center gap-2 rounded-full border border-sage-200 bg-white px-4 py-2 text-sm font-medium text-sage-600 transition hover:bg-sage-50"
                        >
                            <i className="bi bi-key" /> Reset password
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function PasswordField({ id, label, value, onChange, hint, autoComplete }: {
    id: string; label: string; value: string; onChange: (value: string) => void; hint?: string; autoComplete: string
}) {
    const [visible, setVisible] = React.useState(false);
    return (
        <Field label={label} htmlFor={id} required hint={hint}>
            <div className="relative">
                <input id={id} type={visible ? "text" : "password"} autoComplete={autoComplete} value={value}
                    onChange={e => onChange(e.target.value)} className={`${inputClass} pr-10`} />
                <button type="button" onClick={() => setVisible(open => !open)} aria-pressed={visible}
                    aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
                    className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-sage-400 hover:text-sage-700">
                    <i className={`bi ${visible ? "bi-eye-slash" : "bi-eye"}`} aria-hidden="true" />
                </button>
            </div>
        </Field>
    );
}

function InfoRow({ label, value }: { label: string; value?: string | number }) {
    return (
        <div>
            <dt className="text-sage-500">{label}</dt>
            <dd className="mt-1 font-medium">{value || "-"}</dd>
        </div>
    );
}
