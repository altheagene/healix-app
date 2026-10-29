import { apiFetch } from "../api";
import React from "react";
import Modal from "./modal";
import { ADMIN_ROLE_ID, ROLES } from "../roles";

const input = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-teal-300 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-50 disabled:text-slate-500"
const label = "mb-1.5 block text-xs font-medium text-slate-500"
const PASSWORD_RULE = "At least 8 characters, and not a common password or the username."

const EMPTY = {
    first_name: "", middle_name: "", last_name: "", birthday: "", sex: "", staff_category_id: "2",
    phone: "", email: "", username: "", password: "",
}

/**
 * Adds a staff member (no staffId) or edits one. Admins can change roles and reset
 * passwords; everyone else can only edit themselves.
 */
export default function StaffDialog({ staffId, onClose, onSaved }: {
    staffId?: number
    onClose: () => void
    onSaved: () => void
}) {
    const editing = staffId !== undefined
    const isAdmin = typeof window !== "undefined" && localStorage.getItem("admin") === "true"
    const [form, setForm] = React.useState<Record<string, string>>(EMPTY)
    const [loaded, setLoaded] = React.useState(!editing)
    const [showPassword, setShowPassword] = React.useState(false)
    const [saving, setSaving] = React.useState(false)
    const [error, setError] = React.useState("")
    const [newPassword, setNewPassword] = React.useState("")
    const [resetMessage, setResetMessage] = React.useState<{ ok: boolean; text: string } | null>(null)

    React.useEffect(() => {
        if (!editing) return
        apiFetch(`/findstaff?id=${staffId}`).then(res => res.json()).then(data => {
            const row = Array.isArray(data) ? data[0] : null
            if (!row) { setError("Could not load this staff member."); return }
            setForm({
                ...EMPTY,
                ...Object.fromEntries(Object.entries(row).map(([key, value]) => [key, value == null ? "" : String(value)])),
                sex: String(row.sex || "").toLowerCase(),
                password: "",
            })
            setLoaded(true)
        })
    }, [editing, staffId])

    const set = (field: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm(current => ({ ...current, [field]: event.target.value }))

    async function save() {
        const missing = [["first_name", "First name"], ["last_name", "Last name"], ["username", "Username"],
            ...(editing ? [] : [["password", "Password"]])].filter(([key]) => !form[key].trim()).map(([, name]) => name)
        if (missing.length) { setError(`Please fill in: ${missing.join(", ")}`); return }

        setSaving(true)
        setError("")
        const body: Record<string, unknown> = { ...form, staff_category_id: Number(form.staff_category_id) }
        if (editing) delete body.password
        const response = await apiFetch(editing ? "/updatestaff" : "/addstaff", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(editing ? { ...body, staff_id: staffId } : body),
        })
        const result = await response.json().catch(() => ({}))
        setSaving(false)
        if (response.ok && result.success) onSaved()
        else setError(result.error || (editing ? "Could not save these changes." : "Could not add this staff member. The username may be taken."))
    }

    async function resetPassword() {
        setResetMessage(null)
        const response = await apiFetch("/adminresetpassword", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ staff_id: staffId, new_password: newPassword }),
        })
        const result = await response.json().catch(() => ({}))
        if (response.ok && result.success) {
            setNewPassword("")
            setResetMessage({ ok: true, text: "Password reset. They have been signed out and can sign in with the new password." })
        } else {
            setResetMessage({ ok: false, text: result.error || "Could not reset the password." })
        }
    }

    const roleLocked = !isAdmin
    return (
        <Modal title={editing ? "Edit staff member" : "Add staff member"} onClose={onClose} width={560}>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
                {error && <p role="alert" className="m-0 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>}
                {!loaded && !error && <p className="m-0 text-sm text-slate-500">Loading...</p>}

                {loaded && (
                    <>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <Field id="staff-first" text="First name" required>
                                <input id="staff-first" className={input} value={form.first_name} onChange={set("first_name")} />
                            </Field>
                            <Field id="staff-middle" text="Middle name (optional)">
                                <input id="staff-middle" className={input} value={form.middle_name} onChange={set("middle_name")} />
                            </Field>
                            <Field id="staff-last" text="Last name" required>
                                <input id="staff-last" className={input} value={form.last_name} onChange={set("last_name")} />
                            </Field>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <Field id="staff-birthday" text="Birthday">
                                <input id="staff-birthday" type="date" className={input} value={form.birthday} onChange={set("birthday")} />
                            </Field>
                            <fieldset className="m-0 border-0 p-0">
                                <legend className={label}>Sex</legend>
                                <div className="flex gap-4 pt-2">
                                    {[["female", "Female"], ["male", "Male"]].map(([value, text]) => (
                                        <label key={value} className="flex items-center gap-2 text-sm text-slate-700">
                                            <input type="radio" name="staff-sex" value={value} checked={form.sex === value}
                                                onChange={set("sex")} className="h-4 w-4 text-teal-800" />
                                            {text}
                                        </label>
                                    ))}
                                </div>
                            </fieldset>
                        </div>

                        <Field id="staff-role" text="Role" required>
                            <select id="staff-role" className={input} value={form.staff_category_id} onChange={set("staff_category_id")}
                                disabled={roleLocked} aria-describedby={roleLocked ? "staff-role-help" : undefined}>
                                {ROLES.map(role => <option key={role.staff_category_id} value={String(role.staff_category_id)}>{role.category_name}</option>)}
                            </select>
                            {roleLocked && <p id="staff-role-help" className="m-0 mt-1 text-xs text-slate-400">Only an admin can change roles.</p>}
                            {Number(form.staff_category_id) === ADMIN_ROLE_ID && isAdmin && (
                                <p className="m-0 mt-1 text-xs text-slate-400">Admins can add staff, change roles and see everyone's contacts.</p>
                            )}
                        </Field>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <Field id="staff-phone" text="Phone">
                                <input id="staff-phone" type="tel" className={input} value={form.phone} onChange={set("phone")} placeholder="0917 123 4567" />
                            </Field>
                            <Field id="staff-email" text="Email">
                                <input id="staff-email" type="email" className={input} value={form.email} onChange={set("email")} />
                            </Field>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <Field id="staff-username" text="Username" required>
                                <input id="staff-username" className={input} value={form.username} onChange={set("username")} autoComplete="off" />
                            </Field>
                            {!editing && (
                                <Field id="staff-password" text="Password" required>
                                    <div className="relative">
                                        <input id="staff-password" type={showPassword ? "text" : "password"} className={`${input} pr-10`}
                                            value={form.password} onChange={set("password")} autoComplete="new-password"
                                            aria-describedby="staff-password-help" />
                                        <button type="button" onClick={() => setShowPassword(shown => !shown)}
                                            aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}
                                            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400 hover:text-slate-700">
                                            <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`} aria-hidden="true" />
                                        </button>
                                    </div>
                                    <p id="staff-password-help" className="m-0 mt-1 text-xs text-slate-400">{PASSWORD_RULE} They can change it later in their profile.</p>
                                </Field>
                            )}
                        </div>

                        {editing && isAdmin && (
                            <fieldset className="m-0 rounded-xl border border-slate-200 p-4">
                                <legend className="px-1 text-xs font-semibold text-slate-600">Reset password</legend>
                                <p className="m-0 mb-2 text-xs text-slate-500">For someone who forgot theirs. They are signed out everywhere. {PASSWORD_RULE}</p>
                                <div className="flex gap-2">
                                    <label htmlFor="staff-new-password" className="sr-only">New password</label>
                                    <input id="staff-new-password" type="password" autoComplete="new-password" className={input}
                                        value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" />
                                    <button type="button" onClick={resetPassword} disabled={newPassword.length < 8}
                                        className="flex-shrink-0 rounded-xl border border-slate-200 px-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                                        Reset
                                    </button>
                                </div>
                                {resetMessage && (
                                    <p role="status" className={`m-0 mt-2 text-xs ${resetMessage.ok ? "text-emerald-700" : "text-red-700"}`}>{resetMessage.text}</p>
                                )}
                            </fieldset>
                        )}
                    </>
                )}
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
                <button type="button" onClick={onClose}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                    Cancel
                </button>
                <button type="button" onClick={save} disabled={saving || !loaded}
                    className="rounded-xl bg-teal-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-900 disabled:opacity-60">
                    {saving ? "Saving..." : editing ? "Save changes" : "Add staff member"}
                </button>
            </div>
        </Modal>
    )
}

function Field({ id, text, required, children }: { id: string; text: string; required?: boolean; children: React.ReactNode }) {
    return (
        <div>
            <label htmlFor={id} className={label}>{text}{required && <span className="text-red-500"> *</span>}</label>
            {children}
        </div>
    )
}
