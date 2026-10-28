import { apiFetch } from "../api";
import AddStaff from "~/components/addstaff"
import EditStaff from "~/components/editstaff"
import React from "react"
import 'bootstrap-icons/font/bootstrap-icons.css'
import ViewStaff from "~/components/viewstaff"



export default function Staff() {
    const [_width, setWidth] = React.useState(0)

        React.useEffect(() => {
        // Safe: window exists ONLY in the browser
        const handleResize = () => setWidth(window.innerWidth);

        handleResize(); // set initial width
        window.addEventListener("resize", handleResize);

        return () => window.removeEventListener("resize", handleResize);
        }, []);
    const [staff, setStaff] = React.useState<any[]>([])
    const [searchQuery, setSearchQuery] = React.useState('')
    const [showStaff, setShowStaff] = React.useState(false)
    const [showEdit, setShowEdit] = React.useState(false)
    const [chosenStaff, setChosenStaff] = React.useState();
    const [showStaffInfo, setShowStaffInfo] = React.useState(false)
    const [chosenId, setChosenId] = React.useState<number>();
    const [openMenuId, setOpenMenuId] = React.useState<number | null>(null);

    // Fetch staff on mount
    React.useEffect(() => {
        apiFetch(`/getstaffandcateg`)
            .then(res => res.json())
            .then(data => setStaff(data))
    }, [])

    function refetch(){
         apiFetch(`/getstaffandcateg`)
            .then(res => res.json())
            .then(data => setStaff(data))
    }

    function handleEdit(id:number, _person: any){
        const userid= localStorage.getItem('userid');
        const isAdmin = localStorage.getItem('admin')
        if (userid && parseInt(userid) === id || isAdmin == 'true'){
            console.log('YES YOU CAN EDIT!');
            setShowEdit(true);
            setChosenId(id)
        }else{
            alert('You are not authorized to edit this')
        }
    }
    console.log(staff)

    // Filter staff based on search query
    const filteredStaff = staff.filter(person => {
        const fullName = `${person.first_name} ${person.last_name}`.toLowerCase()
        const role = person.category_name?.toLowerCase() || ''
        const email = person.email?.toLowerCase() || ''
        const phone = person.phone?.toLowerCase() || ''
        const query = searchQuery.toLowerCase()
        return fullName.includes(query) || role.includes(query) || email.includes(query) || phone.includes(query)
    })

    // Stat totals (based on full staff list, not the search-filtered one)
    const totalStaff = staff.length
    const roleCount = new Set(staff.map(p => p.category_name).filter(Boolean)).size
    const missingEmail = staff.filter(p => !p.email).length
    const missingPhone = staff.filter(p => !p.phone).length

    return (
        <div className="min-h-full font-sans text-slate-900">
            <div className="mx-auto max-w-full">
                {showStaff && <AddStaff hideForm={() => setShowStaff(false)} />}
                {showStaffInfo && <ViewStaff staff={chosenStaff} hideForm={() => setShowStaffInfo(false)} />}
                {showEdit ? <EditStaff hideForm={() => setShowEdit(false)} chosenId={chosenId} refetch={refetch} /> : null}

                {/* HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-[2rem] font-semibold tracking-tight m-0">Staff</h1>
                        <p className="text-slate-500 text-sm mt-1">Manage clinic staff, roles, and permissions</p>
                    </div>
                    {localStorage.getItem('admin') === 'true' && (
                        <button
                            onClick={() => setShowStaff(true)}
                            className="inline-flex items-center gap-2 self-start rounded-lg bg-teal-800 px-4 py-2.5 text-sm font-medium text-white shadow-md transition hover:bg-teal-900"
                        >
                            <i className="bi bi-plus-lg" /> Add Staff
                        </button>
                    )}
                </div>

                {/* STAT CARDS */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <StatCard icon="bi-people" value={totalStaff} label="Total Staff" />
                    <StatCard icon="bi-diagram-3" value={roleCount} label="Roles" />
                    <StatCard icon="bi-envelope-exclamation" value={missingEmail} label="Missing Email" />
                    <StatCard icon="bi-telephone-x" value={missingPhone} label="Missing Phone" />
                </div>

                {/* TABLE */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="flex justify-end border-b border-slate-100 px-5 py-4">
                        <label className="flex w-full items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2 text-slate-400 focus-within:border-teal-300 focus-within:ring-2 focus-within:ring-teal-100 sm:w-80">
                            <i className="bi bi-search text-sm" />
                            <input
                                type="text"
                                placeholder="Search staff by name, role, email or phone"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                            />
                        </label>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50/60">
                                    <th className="w-20 border-b border-slate-100 px-5 py-3 text-left text-xs font-medium text-slate-400">ID</th>
                                    <th className="w-48 border-b border-slate-100 px-5 py-3 text-left text-xs font-medium text-slate-400">Name</th>
                                    <th className="border-b border-slate-100 px-5 py-3 text-left text-xs font-medium text-slate-400">Role</th>
                                    <th className="border-b border-slate-100 px-5 py-3 text-left text-xs font-medium text-slate-400">Phone</th>
                                    <th className="border-b border-slate-100 px-5 py-3 text-left text-xs font-medium text-slate-400">Email</th>
                                    <th className="w-14 border-b border-slate-100 px-5 py-3"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStaff.length > 0 ? filteredStaff.map(person => (
                                    <tr key={person.staff_id} className="transition hover:bg-teal-50/40">
                                        <td className="border-b border-slate-100 px-5 py-3 text-sm text-slate-400 last:border-none">
                                            {person.staff_id}
                                        </td>
                                        <td className="border-b border-slate-100 px-5 py-3 text-sm font-medium text-slate-900 last:border-none">
                                            {person.first_name} {person.last_name}
                                        </td>
                                        <td className="border-b border-slate-100 px-5 py-3 last:border-none">
                                            <span className="inline-flex items-center rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800 ring-1 ring-teal-200/60">
                                                {person.category_name}
                                            </span>
                                        </td>
                                        <td className="border-b border-slate-100 px-5 py-3 text-sm text-slate-500 last:border-none">
                                            {person.phone}
                                        </td>
                                        <td className="border-b border-slate-100 px-5 py-3 text-sm text-slate-500 last:border-none">
                                            {person.email}
                                        </td>
                                        <td className="border-b border-slate-100 px-5 py-3 last:border-none">
                                            <div className="relative inline-block text-left">
                                                <button
                                                    onClick={() => setOpenMenuId(openMenuId === person.staff_id ? null : person.staff_id)}
                                                    className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                                >
                                                    <i className="bi bi-three-dots-vertical" />
                                                </button>

                                                {openMenuId === person.staff_id && (
                                                    <>
                                                        <div
                                                            className="fixed inset-0 z-10"
                                                            onClick={() => setOpenMenuId(null)}
                                                        />
                                                        <div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                                                            <button
                                                                onClick={() => { setShowStaffInfo(true); setChosenStaff(person); setOpenMenuId(null); }}
                                                                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                                                            >
                                                                <i className="bi bi-eye" /> View
                                                            </button>

                                                            <button
                                                                onClick={() => { handleEdit(person.staff_id, person); setOpenMenuId(null); }}
                                                                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                                                            >
                                                                <i className="bi bi-pencil" /> Edit
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-12 text-center">
                                            <i className="bi bi-people text-2xl text-slate-300" />
                                            <p className="mt-2 text-sm text-slate-400">No staff found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatCard({ icon, value, label }: { icon: string; value: number; label: string }) {
    return (
        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-teal-50 text-lg text-teal-800">
                <i className={`bi ${icon}`} />
            </div>
            <div>
                <div className="text-xl font-bold leading-none">{value}</div>
                <div className="mt-1 text-xs text-slate-400">{label}</div>
            </div>
        </div>
    )
}