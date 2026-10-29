import { apiFetch } from "../api";
import React from "react";
import { ChoiceGroup, Field, ModalForm, Section, inputClass, secondaryButton, selectClass } from "./form";
import { ADMIN_ROLE_ID, ROLES } from "../roles";

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
        <ModalForm title={editing ? "Edit staff member" : "Add staff member"} onClose={onClose} onSubmit={save} width={600}
            submitLabel={editing ? "Save changes" : "Add staff member"} saving={saving} submitDisabled={!loaded} error={error}>
            {!loaded && !error && <p className="m-0 text-sm text-sage-500">Loading...</p>}

            {loaded && (
                <>
                    <Section title="Name" columns={3}>
                        <Field label="First name" htmlFor="staff-first" required>
                            <input id="staff-first" className={inputClass} value={form.first_name} onChange={set("first_name")} />
                        </Field>
                        <Field label="Middle name" htmlFor="staff-middle" optional>
                            <input id="staff-middle" className={inputClass} value={form.middle_name} onChange={set("middle_name")} />
                        </Field>
                        <Field label="Last name" htmlFor="staff-last" required>
                            <input id="staff-last" className={inputClass} value={form.last_name} onChange={set("last_name")} />
                        </Field>
                        <Field label="Birthday" htmlFor="staff-birthday" optional>
                            <input id="staff-birthday" type="date" className={inputClass} value={form.birthday} onChange={set("birthday")} />
                        </Field>
                        <div className="sm:col-span-2">
                            <ChoiceGroup legend="Sex" name="staff-sex" value={form.sex}
                                options={[["female", "Female"], ["male", "Male"]] as const}
                                onChange={(sex) => setForm(current => ({ ...current, sex }))} />
                        </div>
                    </Section>

                    <Section title="Role and contact">
                        <Field label="Role" htmlFor="staff-role" required className="sm:col-span-2"
                            hint={roleLocked ? "Only an admin can change roles."
                                : Number(form.staff_category_id) === ADMIN_ROLE_ID ? "Admins can add staff, change roles and see everyone's contacts." : undefined}>
                            <select id="staff-role" className={selectClass} value={form.staff_category_id} onChange={set("staff_category_id")} disabled={roleLocked}>
                                {ROLES.map(role => <option key={role.staff_category_id} value={String(role.staff_category_id)}>{role.category_name}</option>)}
                            </select>
                        </Field>
                        <Field label="Phone" htmlFor="staff-phone" optional>
                            <input id="staff-phone" type="tel" className={inputClass} value={form.phone} onChange={set("phone")} placeholder="0917 123 4567" />
                        </Field>
                        <Field label="Email" htmlFor="staff-email" optional>
                            <input id="staff-email" type="email" className={inputClass} value={form.email} onChange={set("email")} />
                        </Field>
                    </Section>

                    <Section title="Sign-in">
                        <Field label="Username" htmlFor="staff-username" required>
                            <input id="staff-username" className={inputClass} value={form.username} onChange={set("username")} autoComplete="off" />
                        </Field>
                        {!editing && (
                            <Field label="Password" htmlFor="staff-password" required hint={`${PASSWORD_RULE} They can change it later in their profile.`}>
                                <div className="relative">
                                    <input id="staff-password" type={showPassword ? "text" : "password"} className={`${inputClass} pr-10`}
                                        value={form.password} onChange={set("password")} autoComplete="new-password" />
                                    <button type="button" onClick={() => setShowPassword(shown => !shown)}
                                        aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}
                                        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-sage-400 hover:text-sage-700">
                                        <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`} aria-hidden="true" />
                                    </button>
                                </div>
                            </Field>
                        )}
                    </Section>

                    {editing && isAdmin && (
                        <div className="rounded-xl border border-sage-200 bg-sage-50/60 p-4">
                            <p className="m-0 text-sm font-semibold text-sage-900">Reset their password</p>
                            <p className="m-0 mb-3 mt-0.5 text-xs text-sage-500">For someone who forgot theirs. They are signed out everywhere. {PASSWORD_RULE}</p>
                            <div className="flex gap-2">
                                <label htmlFor="staff-new-password" className="sr-only">New password</label>
                                <input id="staff-new-password" type="password" autoComplete="new-password" className={inputClass}
                                    value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password"
                                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (newPassword.length >= 8) resetPassword() } }} />
                                <button type="button" onClick={resetPassword} disabled={newPassword.length < 8} className={`${secondaryButton} flex-shrink-0`}>
                                    Reset
                                </button>
                            </div>
                            {resetMessage && (
                                <p role="status" className={`m-0 mt-2 text-xs ${resetMessage.ok ? "text-leaf-700" : "text-red-700"}`}>{resetMessage.text}</p>
                            )}
                        </div>
                    )}
                </>
            )}
        </ModalForm>
    )
}
