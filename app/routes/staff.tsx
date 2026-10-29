import { apiFetch } from "../api";
import React from "react"
import 'bootstrap-icons/font/bootstrap-icons.css'
import StaffDialog from "~/components/staffdialog"
import ViewStaff, { fullName, lastSignIn } from "~/components/viewstaff"
import { ROLES } from "../roles"
import { telHref } from "../visitOutcomes"

const ROLE_TONES: Record<string, string> = {
    Nurse: "bg-teal-50 text-teal-800 ring-teal-200/60",
    Doctor: "bg-sky-50 text-sky-800 ring-sky-200/60",
    Staff: "bg-slate-100 text-slate-700 ring-slate-200",
    Admin: "bg-violet-50 text-violet-800 ring-violet-200/60",
}
const ROLE_CARDS: { role: string; label: string; icon: string }[] = [
    { role: "Nurse", label: "Nurses", icon: "bi-heart-pulse" },
    { role: "Doctor", label: "Doctors", icon: "bi-clipboard2-pulse" },
    { role: "Staff", label: "Staff / working scholars", icon: "bi-person-badge" },
    { role: "Admin", label: "Admins", icon: "bi-shield-lock" },
]

export default function Staff() {
    const isAdmin = typeof window !== "undefined" && localStorage.getItem("admin") === "true"
    const myId = typeof window !== "undefined" ? Number(localStorage.getItem("userid")) : NaN
    const [staff, setStaff] = React.useState<any[]>([])
    const [searchQuery, setSearchQuery] = React.useState("")
    const [roleFilter, setRoleFilter] = React.useState("")
    const [showActive, setShowActive] = React.useState(true)
    const [adding, setAdding] = React.useState(false)
    const [editingId, setEditingId] = React.useState<number | null>(null)
    const [viewing, setViewing] = React.useState<any>(null)
    const [openMenuId, setOpenMenuId] = React.useState<number | null>(null)
    const [notice, setNotice] = React.useState<{ ok: boolean; text: string } | null>(null)

    const refetch = React.useCallback(() => {
        apiFetch(`/getstaffandcateg`)
            .then(res => res.json())
            .then(data => setStaff(Array.isArray(data) ? data : []))
    }, [])
    React.useEffect(() => { refetch() }, [refetch])

    const canEdit = (person: any) => isAdmin || person.staff_id === myId

    async function setActive(person: any, active: boolean) {
        setOpenMenuId(null)
        if (!active && !window.confirm(`Switch off ${fullName(person)}'s account? They are signed out and cannot sign in until an admin turns it back on. Their name stays on past records.`)) return
        const response = await apiFetch(`/setstaffactive`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ staff_id: person.staff_id, is_active: active }),
        })
        const result = await response.json().catch(() => ({}))
        if (response.ok && result.success) {
            setNotice({ ok: true, text: active ? `${fullName(person)} can sign in again.` : `${fullName(person)}'s account is switched off.` })
            refetch()
        } else {
            setNotice({ ok: false, text: result.error || "Could not change this account." })
        }
    }

    function saved(message: string) {
        setAdding(false)
        setEditingId(null)
        setNotice({ ok: true, text: message })
        refetch()
    }

    const active = staff.filter(person => person.is_active !== 0)
    const inactiveCount = staff.length - active.length
    const query = searchQuery.trim().toLowerCase()
    const filteredStaff = staff.filter(person => {
        if ((person.is_active !== 0) !== showActive) return false
        if (roleFilter && person.category_name !== roleFilter) return false
        if (!query) return true
        return [fullName(person), person.category_name, person.email, person.phone, person.username]
            .some(value => String(value || "").toLowerCase().includes(query))
    })

    return (
        <div className="min-h-full font-sans text-slate-900">
            <div className="mx-auto max-w-full">
                {adding && <StaffDialog onClose={() => setAdding(false)} onSaved={() => saved("Staff member added.")} />}
                {editingId !== null && (
                    <StaffDialog staffId={editingId} onClose={() => setEditingId(null)} onSaved={() => saved("Changes saved.")} />
                )}
                {viewing && (
                    <ViewStaff staff={viewing} onClose={() => setViewing(null)}
                        onEdit={canEdit(viewing) ? () => { setEditingId(viewing.staff_id); setViewing(null) } : undefined} />
                )}

                {/* HEADER */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="m-0 text-[2rem] font-semibold tracking-tight">Staff</h1>
                        <p className="m-0 mt-1 text-sm text-slate-500">Who works in the clinic, their role, and how to reach them.</p>
                    </div>
                    {isAdmin && (
                        <button type="button" onClick={() => setAdding(true)}
                            className="inline-flex items-center gap-2 self-start rounded-lg bg-teal-800 px-4 py-2.5 text-sm font-medium text-white shadow-md transition hover:bg-teal-900">
                            <i className="bi bi-plus-lg" aria-hidden="true" /> Add Staff
                        </button>
                    )}
                </div>

                {notice && (
                    <div role={notice.ok ? "status" : "alert"}
                        className={`mb-4 flex items-start justify-between gap-3 rounded-xl px-4 py-3 text-sm ${notice.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
                        {notice.text}
                        <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss" className="text-current opacity-60 hover:opacity-100">
                            <i className="bi bi-x-lg" aria-hidden="true" />
                        </button>
                    </div>
                )}

                {/* ROLE CARDS: click one to show only that role */}
                <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {ROLE_CARDS.map(card => {
                        const selected = roleFilter === card.role
                        return (
                            <button key={card.role} type="button" aria-pressed={selected}
                                onClick={() => { setRoleFilter(selected ? "" : card.role); setShowActive(true) }}
                                className={`flex items-center gap-3.5 rounded-2xl border bg-white p-4 text-left shadow-sm transition ${selected ? "border-teal-400 ring-2 ring-teal-100" : "border-slate-200 hover:border-teal-300"}`}>
                                <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-lg ring-1 ${ROLE_TONES[card.role]}`}>
                                    <i className={`bi ${card.icon}`} aria-hidden="true" />
                                </div>
                                <div>
                                    <div className="text-xl font-bold leading-none">{active.filter(p => p.category_name === card.role).length}</div>
                                    <div className="mt-1 text-xs text-slate-400">{card.label}</div>
                                </div>
                            </button>
                        )
                    })}
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                            {isAdmin && (
                                <div className="flex rounded-full bg-slate-100 p-1">
                                    {([[true, "Active"], [false, `Switched off${inactiveCount ? ` (${inactiveCount})` : ""}`]] as const).map(([value, text]) => (
                                        <button key={String(value)} type="button" aria-pressed={showActive === value} onClick={() => setShowActive(value)}
                                            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${showActive === value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>
                                            {text}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <select aria-label="Role" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
                                className={`rounded-full border px-3.5 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-teal-100 ${roleFilter ? "border-teal-300 bg-teal-50 text-teal-900" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
                                <option value="">Every role</option>
                                {ROLES.map(role => <option key={role.staff_category_id} value={role.category_name}>{role.category_name}</option>)}
                            </select>
                        </div>
                        <label className="flex w-full items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2 text-slate-400 focus-within:border-teal-300 focus-within:ring-2 focus-within:ring-teal-100 sm:w-72">
                            <i className="bi bi-search text-sm" aria-hidden="true" />
                            <span className="sr-only">Search staff</span>
                            <input type="text" placeholder={isAdmin ? "Name, role, email, phone or username" : "Name or role"} value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400" />
                        </label>
                    </div>

                    {filteredStaff.length === 0 ? (
                        <div className="px-5 py-12 text-center">
                            <i className="bi bi-people text-2xl text-slate-300" aria-hidden="true" />
                            <p className="m-0 mt-2 text-sm text-slate-400">{showActive ? "No staff match." : "No switched-off accounts."}</p>
                        </div>
                    ) : (
                        <>
                            {/* Phones: one card per person */}
                            <ul className="m-0 list-none divide-y divide-slate-100 p-0 sm:hidden">
                                {filteredStaff.map(person => (
                                    <li key={person.staff_id} className="flex items-start justify-between gap-3 px-5 py-4">
                                        <div className="min-w-0">
                                            <NameButton person={person} isMe={person.staff_id === myId} onOpen={() => setViewing(person)} />
                                            <div className="mt-1"><RoleBadge role={person.category_name} /></div>
                                            <div className="mt-2 space-y-0.5 text-sm"><Contact person={person} /></div>
                                        </div>
                                        <RowMenu person={person} open={openMenuId === person.staff_id} setOpen={setOpenMenuId}
                                            onView={() => setViewing(person)} onEdit={canEdit(person) ? () => setEditingId(person.staff_id) : undefined}
                                            onToggle={isAdmin && person.staff_id !== myId ? () => setActive(person, person.is_active === 0) : undefined} />
                                    </li>
                                ))}
                            </ul>

                            <div className="hidden overflow-x-auto sm:block">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/60">
                                            {["Name", "Role", "Phone", "Email", ...(isAdmin ? ["Last signed in"] : [])].map(heading => (
                                                <th key={heading} className="border-b border-slate-100 px-5 py-3 text-left text-xs font-medium text-slate-400">{heading}</th>
                                            ))}
                                            <th className="w-14 border-b border-slate-100 px-5 py-3"><span className="sr-only">Actions</span></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStaff.map(person => (
                                            <tr key={person.staff_id} className="transition hover:bg-teal-50/40">
                                                <td className="border-b border-slate-100 px-5 py-3 text-sm">
                                                    <NameButton person={person} isMe={person.staff_id === myId} onOpen={() => setViewing(person)} />
                                                    {isAdmin && person.username && <span className="block text-xs text-slate-400">@{person.username}</span>}
                                                </td>
                                                <td className="border-b border-slate-100 px-5 py-3"><RoleBadge role={person.category_name} /></td>
                                                <Contact person={person} cells />
                                                {isAdmin && (
                                                    <td className="whitespace-nowrap border-b border-slate-100 px-5 py-3 text-sm text-slate-500">{lastSignIn(person.last_login)}</td>
                                                )}
                                                <td className="border-b border-slate-100 px-5 py-3 text-right">
                                                    <RowMenu person={person} open={openMenuId === person.staff_id} setOpen={setOpenMenuId}
                                                        onView={() => setViewing(person)} onEdit={canEdit(person) ? () => setEditingId(person.staff_id) : undefined}
                                                        onToggle={isAdmin && person.staff_id !== myId ? () => setActive(person, person.is_active === 0) : undefined} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                    {!isAdmin && (
                        <p className="m-0 border-t border-slate-100 px-5 py-3 text-xs text-slate-400">Only admins can see other staff members' phone and email.</p>
                    )}
                </div>
            </div>
        </div>
    )
}

function NameButton({ person, isMe, onOpen }: { person: any; isMe: boolean; onOpen: () => void }) {
    return (
        <span className="inline-flex flex-wrap items-center gap-2">
            <button type="button" onClick={onOpen} className="text-left text-sm font-medium text-slate-900 hover:underline">{fullName(person)}</button>
            {isMe && <span className="rounded-full bg-teal-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">You</span>}
        </span>
    )
}

function RoleBadge({ role }: { role: string }) {
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${ROLE_TONES[role] || ROLE_TONES.Staff}`}>{role}</span>
    )
}

function Contact({ person, cells }: { person: any; cells?: boolean }) {
    const hidden = Boolean(person.contact_hidden)
    const phone = hidden ? <span className="text-slate-400">Hidden</span>
        : person.phone ? <a href={telHref(person.phone)} className="text-teal-800 hover:underline">{person.phone}</a>
            : <span className="text-amber-700">Not given</span>
    const email = hidden ? <span className="text-slate-400">Hidden</span>
        : person.email ? <a href={`mailto:${person.email}`} className="break-all text-teal-800 hover:underline">{person.email}</a>
            : <span className="text-amber-700">Not given</span>
    if (cells) {
        return (
            <>
                <td className="whitespace-nowrap border-b border-slate-100 px-5 py-3 text-sm">{phone}</td>
                <td className="border-b border-slate-100 px-5 py-3 text-sm">{email}</td>
            </>
        )
    }
    if (hidden) return null
    return (<><span className="block">{phone}</span><span className="block">{email}</span></>)
}

function RowMenu({ person, open, setOpen, onView, onEdit, onToggle }: {
    person: any; open: boolean; setOpen: (id: number | null) => void
    onView: () => void; onEdit?: () => void; onToggle?: () => void
}) {
    const item = "flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition"
    // Placed against the window, so the table's scroll area cannot clip it on the last rows.
    const [place, setPlace] = React.useState<React.CSSProperties>({})
    function toggle(event: React.MouseEvent<HTMLButtonElement>) {
        const rect = event.currentTarget.getBoundingClientRect()
        const opensUp = rect.bottom + 170 > window.innerHeight
        setPlace({
            position: "fixed",
            right: window.innerWidth - rect.right,
            ...(opensUp ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.bottom + 4 }),
        })
        setOpen(open ? null : person.staff_id)
    }
    return (
        <div className="relative inline-block text-left">
            <button type="button" aria-label={`Actions for ${fullName(person)}`} aria-expanded={open}
                onClick={toggle}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                <i className="bi bi-three-dots-vertical" aria-hidden="true" />
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(null)} />
                    <div style={place} className="z-20 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                        <button type="button" onClick={() => { setOpen(null); onView() }} className={`${item} text-slate-700 hover:bg-slate-50`}>
                            <i className="bi bi-eye" aria-hidden="true" /> View
                        </button>
                        {onEdit && (
                            <button type="button" onClick={() => { setOpen(null); onEdit() }} className={`${item} text-slate-700 hover:bg-slate-50`}>
                                <i className="bi bi-pencil" aria-hidden="true" /> Edit
                            </button>
                        )}
                        {onToggle && (person.is_active === 0 ? (
                            <button type="button" onClick={onToggle} className={`${item} text-emerald-700 hover:bg-emerald-50`}>
                                <i className="bi bi-arrow-clockwise" aria-hidden="true" /> Turn back on
                            </button>
                        ) : (
                            <button type="button" onClick={onToggle} className={`${item} text-red-600 hover:bg-red-50`}>
                                <i className="bi bi-person-slash" aria-hidden="true" /> Switch off account
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
