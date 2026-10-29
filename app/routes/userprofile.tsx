import { apiFetch } from "../api";
import { ROLES } from "../roles";
import React from "react";
import user from "../images/user.png";

export default function UserProfile() {
    const userId = localStorage.getItem("userid");
    const isAdmin = localStorage.getItem("admin") === "true";
    const [staff, setStaff] = React.useState<any>();
    const [showEdit, setShowEdit] = React.useState(false);
    const [showReset, setShowReset] = React.useState(false);
    const [form, setForm] = React.useState<any>({});
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState("");
    const [resetForm, setResetForm] = React.useState({ current: "", next: "", confirm: "" });
    const [resetError, setResetError] = React.useState("");
    const [resetSaving, setResetSaving] = React.useState(false);
    const [resetDone, setResetDone] = React.useState(false);

    function loadProfile() {
        if (!userId) return;
        apiFetch(`/finduser?id=${userId}`)
            .then(res => res.json())
            .then(data => setStaff(data[0]));
    }

    React.useEffect(() => {
        loadProfile();
    }, []);

    function openEdit() {
        setForm({
            staff_id: staff?.staff_id,
            first_name: staff?.first_name || "",
            last_name: staff?.last_name || "",
            sex: staff?.sex || "",
            phone: staff?.phone || "",
            email: staff?.email || "",
            username: staff?.username || "",
            staff_category_id: staff?.staff_category_id,
        });
        setError("");
        setShowEdit(true);
    }

    function openReset() {
        setResetForm({ current: "", next: "", confirm: "" });
        setResetError("");
        setResetDone(false);
        setShowReset(true);
    }

    function updateField(field: string, value: string) {
        setForm((current: any) => ({ ...current, [field]: value }));
    }

    async function saveProfile() {
        if (!form.first_name || !form.last_name || !form.username) {
            setError("Please fill in your name and username.");
            return;
        }

        setSaving(true);
        setError("");
        try {
            const response = await apiFetch("/updatestaff", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                setError(result.error || "Could not save your profile.");
                return;
            }
            setShowEdit(false);
            loadProfile();
        } catch {
            setError("Could not save your profile.");
        } finally {
            setSaving(false);
        }
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
            setResetDone(true);
            setResetForm({ current: "", next: "", confirm: "" });
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
            {showEdit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-sage-100 px-6 py-4">
                            <p className="text-base font-semibold text-sage-900">Edit Profile</p>
                            <button
                                type="button"
                                onClick={() => setShowEdit(false)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border-none bg-transparent text-sage-400 transition hover:bg-sage-50 hover:text-sage-700"
                                aria-label="Close"
                            >
                                <i className="bi bi-x-lg" />
                            </button>
                        </div>

                        <div className="space-y-3.5 overflow-y-auto px-6 py-5">
                            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                                <Field label="First name" value={form.first_name} onChange={value => updateField("first_name", value)} />
                                <Field label="Last name" value={form.last_name} onChange={value => updateField("last_name", value)} />
                            </div>
                            <div>
                                <p className="mb-1.5 text-xs font-medium text-sage-500">Sex</p>
                                <div className="flex gap-2">
                                    {["Female", "Male"].map(option => (
                                        <button
                                            key={option}
                                            type="button"
                                            onClick={() => updateField("sex", option)}
                                            className={`flex-1 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition ${
                                                String(form.sex || "").toLowerCase() === option.toLowerCase()
                                                    ? "border-brand-300 bg-brand-50 text-brand-800"
                                                    : "border-sage-200 text-sage-500 hover:bg-sage-50"
                                            }`}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <Field label="Email" value={form.email} onChange={value => updateField("email", value)} />
                            <Field label="Phone" value={form.phone} onChange={value => updateField("phone", value)} />
                            <Field label="Username" value={form.username} onChange={value => updateField("username", value)} />
                            <div>
                                <p className="mb-1.5 text-xs font-medium text-sage-500">Role</p>
                                <select
                                    value={String(form.staff_category_id ?? "")}
                                    disabled={!isAdmin}
                                    onChange={e => updateField("staff_category_id", e.target.value)}
                                    className="w-full rounded-xl border border-sage-200 bg-white px-3.5 py-2.5 text-sm text-sage-900 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100 disabled:bg-sage-50 disabled:text-sage-400"
                                >
                                    {ROLES.map(role => (
                                        <option key={role.staff_category_id} value={role.staff_category_id}>
                                            {role.category_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {error && <p className="text-sm text-red-500">{error}</p>}
                        </div>

                        <div className="flex justify-end gap-2 border-t border-sage-100 px-6 py-4">
                            <button
                                type="button"
                                onClick={() => setShowEdit(false)}
                                className="rounded-xl border border-sage-200 bg-white px-4 py-2.5 text-sm font-medium text-sage-700 transition hover:bg-sage-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={saveProfile}
                                disabled={saving}
                                className="rounded-xl bg-brand-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-900 disabled:opacity-60"
                            >
                                {saving ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showReset && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-sage-100 px-6 py-4">
                            <p className="text-base font-semibold text-sage-900">Reset Password</p>
                            <button
                                type="button"
                                onClick={() => setShowReset(false)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border-none bg-transparent text-sage-400 transition hover:bg-sage-50 hover:text-sage-700"
                                aria-label="Close"
                            >
                                <i className="bi bi-x-lg" />
                            </button>
                        </div>

                        <div className="space-y-3.5 px-6 py-5">
                            <PasswordField
                                label="Current password"
                                value={resetForm.current}
                                onChange={value => setResetForm(current => ({ ...current, current: value }))}
                            />
                            <PasswordField
                                label="New password"
                                value={resetForm.next}
                                onChange={value => setResetForm(current => ({ ...current, next: value }))}
                            />
                            <PasswordField
                                label="Confirm new password"
                                value={resetForm.confirm}
                                onChange={value => setResetForm(current => ({ ...current, confirm: value }))}
                            />
                            {resetError && <p className="text-sm text-red-500">{resetError}</p>}
                            {resetDone && <p className="text-sm text-brand-700">Password updated.</p>}
                        </div>

                        <div className="flex justify-end gap-2 border-t border-sage-100 px-6 py-4">
                            <button
                                type="button"
                                onClick={() => setShowReset(false)}
                                className="rounded-xl border border-sage-200 bg-white px-4 py-2.5 text-sm font-medium text-sage-700 transition hover:bg-sage-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={resetPassword}
                                disabled={resetSaving}
                                className="rounded-xl bg-brand-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-900 disabled:opacity-60"
                            >
                                {resetSaving ? "Saving..." : "Reset password"}
                            </button>
                        </div>
                    </div>
                </div>
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
                            onClick={openEdit}
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

function PasswordField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
    const [visible, setVisible] = React.useState(false);
    return (
        <div>
            <p className="mb-1.5 text-xs font-medium text-sage-500">{label}</p>
            <div className="flex items-center gap-2 rounded-xl border border-sage-200 bg-white px-3.5 py-2.5 focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-100">
                <input
                    type={visible ? "text" : "password"}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className="w-full border-none bg-transparent text-sm text-sage-900 outline-none"
                />
                <button
                    type="button"
                    onClick={() => setVisible(open => !open)}
                    className="border-none bg-transparent text-sage-400"
                    aria-label={visible ? "Hide password" : "Show password"}
                >
                    <i className={`bi ${visible ? "bi-eye-slash" : "bi-eye"}`} />
                </button>
            </div>
        </div>
    );
}

function Field({ label, value, onChange }: { label: string; value?: string; onChange: (value: string) => void }) {
    return (
        <div>
            <p className="mb-1.5 text-xs font-medium text-sage-500">{label}</p>
            <input
                type="text"
                value={value || ""}
                onChange={e => onChange(e.target.value)}
                className="w-full rounded-xl border border-sage-200 bg-white px-3.5 py-2.5 text-sm text-sage-900 outline-none placeholder:text-sage-400 focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
            />
        </div>
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
