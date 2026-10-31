import { apiFetch } from "../api";
import { ROLES } from "../roles";
import StaffDialog from "~/components/staffdialog";
import { Field, ModalForm, inputClass, primaryButton, secondaryButton } from "~/components/form";
import { fullName, lastSignIn } from "~/components/viewstaff";
import { inlineActionClass } from "~/components/rowactions";
import MyActivity from "~/components/myactivity";
import { telHref, visitDateParts } from "../visitOutcomes";
import { notify } from "../notify";
import React from "react";

export default function UserProfile() {
    const userId = localStorage.getItem("userid");
    const [staff, setStaff] = React.useState<any>();
    const [showEdit, setShowEdit] = React.useState(false);
    const [showReset, setShowReset] = React.useState(false);
    const [resetForm, setResetForm] = React.useState({ current: "", next: "", confirm: "" });
    const [resetError, setResetError] = React.useState("");
    const [resetSaving, setResetSaving] = React.useState(false);
    const [loadFailed, setLoadFailed] = React.useState(false);

    function loadProfile() {
        if (!userId) return;
        setLoadFailed(false);
        apiFetch(`/finduser?id=${userId}`)
            .then(res => res.ok ? res.json() : Promise.reject())
            .then(data => data?.[0] ? setStaff(data[0]) : setLoadFailed(true))
            .catch(() => setLoadFailed(true));
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

    const name = fullName(staff) || "Staff";
    const roleName = ROLES.find(r => r.staff_category_id === Number(staff?.staff_category_id))?.category_name
        || staff?.category_name
        || localStorage.getItem("role")
        || "Staff";
    const initials = [staff?.first_name, staff?.last_name]
        .map(part => String(part || "").trim().charAt(0))
        .join("")
        .toUpperCase() || "?";
    const birthday = staff?.birthday ? visitDateParts(staff.birthday).date : "";
    const missing = staff ? [!staff.phone && "phone", !staff.email && "email"].filter(Boolean) as string[] : [];

    return (
        <div className="min-h-full font-sans text-sage-900">
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
                <p className="m-0 mt-1 text-sm text-sage-500">Your clinic account, contact details and password.</p>
            </div>

            {loadFailed ? (
                <div role="alert" className="rounded-3xl bg-white px-6 py-12 text-center shadow-card">
                    <i className="bi bi-exclamation-circle text-2xl text-sage-300" aria-hidden="true" />
                    <p className="m-0 mt-2 text-sm text-sage-600">Your profile could not be loaded.</p>
                    <button type="button" onClick={loadProfile} className={`${secondaryButton} mt-4`}>Try again</button>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {/* Who you are */}
                    <section className="flex flex-col gap-5 rounded-3xl bg-white p-6 shadow-card sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-center gap-4">
                            <div aria-hidden="true"
                                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-800 text-xl font-semibold text-white">
                                {staff ? initials : ""}
                            </div>
                            <div className="min-w-0">
                                {staff ? (
                                    <>
                                        <p className="m-0 truncate text-xl font-semibold">{name}</p>
                                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-sage-500">
                                            <span className="rounded-full bg-leaf-100 px-2.5 py-0.5 text-xs font-medium text-brand-800">{roleName}</span>
                                            {staff.username && <span>@{staff.username}</span>}
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-2" aria-label="Loading">
                                        <div className="h-5 w-44 animate-pulse rounded bg-sage-100" />
                                        <div className="h-4 w-28 animate-pulse rounded bg-sage-100" />
                                    </div>
                                )}
                            </div>
                        </div>
                        <button type="button" onClick={() => setShowEdit(true)} disabled={!staff}
                            className={`${primaryButton} self-start sm:self-center`}>
                            <i className="bi bi-pencil" aria-hidden="true" /> Edit profile
                        </button>
                    </section>

                    {missing.length > 0 && (
                        <div className="flex flex-col gap-3 rounded-2xl bg-citron-50 px-5 py-4 text-sm text-brand-800 ring-1 ring-citron-200/70 sm:flex-row sm:items-center sm:justify-between">
                            <span className="flex items-start gap-2">
                                <i className="bi bi-info-circle mt-0.5" aria-hidden="true" />
                                Add your {missing.join(" and ")} so the clinic and admins can reach you.
                            </span>
                            <button type="button" onClick={() => setShowEdit(true)} className={`${inlineActionClass} self-start sm:self-center`}>
                                Add now
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <Card title="Personal details" icon="bi-person">
                            <InfoRow label="Full name" value={staff && name} />
                            <InfoRow label="Sex" value={staff && (staff.sex || "")} capitalize />
                            <InfoRow label="Birthday" value={staff && birthday} />
                        </Card>

                        <Card title="Contact" icon="bi-telephone">
                            <InfoRow label="Phone" value={staff && (staff.phone || "")}
                                href={staff?.phone ? telHref(staff.phone) : undefined} />
                            <InfoRow label="Email" value={staff && (staff.email || "")}
                                href={staff?.email ? `mailto:${staff.email}` : undefined} />
                        </Card>

                        <Card title="Account" icon="bi-person-badge">
                            <InfoRow label="Username" value={staff && (staff.username || "")} />
                            <InfoRow label="Role" value={staff && roleName} />
                            <InfoRow label="Staff ID" value={staff && staff.staff_id} />
                            {staff && "last_login" in staff && <InfoRow label="Last signed in" value={lastSignIn(staff.last_login)} />}
                        </Card>

                        <Card title="Security" icon="bi-shield-lock">
                            <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="m-0 text-sm font-medium">Password</p>
                                    <p className="m-0 mt-0.5 text-xs text-sage-500">Changing it signs you out on every other device.</p>
                                </div>
                                <button type="button" onClick={openReset} className={`${secondaryButton} self-start sm:self-center`}>
                                    <i className="bi bi-key" aria-hidden="true" /> Change password
                                </button>
                            </div>
                        </Card>
                    </div>

                    <MyActivity />
                </div>
            )}
        </div>
    );
}

function Card({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
    return (
        <section className="rounded-3xl bg-white px-6 pb-3 pt-5 shadow-card">
            <h2 className="m-0 mb-1 flex items-center gap-2 text-sm font-semibold text-sage-900">
                <i className={`bi ${icon} text-sage-400`} aria-hidden="true" /> {title}
            </h2>
            <dl className="m-0 divide-y divide-sage-100">{children}</dl>
        </section>
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

// value is undefined while the profile loads, and empty when the field is not filled in.
function InfoRow({ label, value, href, capitalize }: { label: string; value?: string | number; href?: string; capitalize?: boolean }) {
    return (
        <div className="grid grid-cols-[8rem_1fr] items-baseline gap-3 py-3 text-sm">
            <dt className="text-sage-500">{label}</dt>
            <dd className={`m-0 min-w-0 break-words font-medium ${capitalize ? "capitalize" : ""}`}>
                {value === undefined ? <span className="inline-block h-4 w-24 animate-pulse rounded bg-sage-100 align-middle" />
                    : value === "" || value === null ? <span className="font-normal text-sage-400">Not set</span>
                    : href ? <a href={href} className="text-brand-800 hover:underline">{value}</a>
                    : value}
            </dd>
        </div>
    );
}
