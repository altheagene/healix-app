import { apiFetch } from "../api";
import React from 'react'
import Pagination, { usePaged } from '~/components/pagination'
import { useNavigate } from 'react-router'
import 'bootstrap-icons/font/bootstrap-icons.css'
import EditAppointment from '~/components/editappointment'
import RowActions, { inlineActionClass, rowLinkClass } from '~/components/rowactions'
import { notify } from '../notify'
import { visitDateParts } from '../visitOutcomes'
import { SkeletonRows } from '~/components/skeleton'
import { FilterBar, QuickSelect, type FilterChip } from '~/components/filterbar'

export default function Appointments() {
    const [_width, setWidth] = React.useState(0)

    React.useEffect(() => {
        const handleResize = () => setWidth(window.innerWidth)
        handleResize()
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])
    const today = new Date().toISOString().split('T')[0]
    const [apptStatus, setApptStatus] = React.useState('All')
    const [apptID, setApptId] = React.useState()
    const apptStatuses = ['All', 'Today', 'Upcoming', 'Completed', 'Cancelled']
    const [appointments, setAppointments] = React.useState<any[]>([])
    const [loaded, setLoaded] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState('')
    const [showEdit, setShowEdit] = React.useState(false)
    const [selectedDate, setSelectedDate] = React.useState('')


    const navigate = useNavigate()

    // Fetch appointments
    React.useEffect(() => {
        refetchAppts()
    }, [])

    function refetchAppts() {
        apiFetch(`/getallappointments`)
            .then(res => res.json())
            .then(data => { setAppointments(data); setLoaded(true) })
    }

    async function setStatus(appt: any, status: 'Completed' | 'Cancelled') {
        if (status === 'Cancelled' && !window.confirm(`Cancel ${appt.patient_name}'s appointment on ${visitDateParts(appt.appointment_date).date} at ${appt.start_time}?`)) return
        const response = await apiFetch(`/updateappointment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ appointment_id: appt.appointment_id, status })
        }).catch(() => null)
        const result = await response?.json().catch(() => ({}))
        if (!response?.ok || result?.success === false) {
            notify(result?.error || 'Could not update the appointment.', 'error')
            return
        }
        notify(status === 'Completed' ? `${appt.patient_name}'s appointment is marked completed.` : 'Appointment cancelled.')
        refetchAppts()
    }

    const filteredAppointments = appointments
    .filter(appt => {
        // Filter by selected date
        if (selectedDate) {
            return appt.appointment_date === selectedDate;
        }
        return true;
    })
    .filter(appt => {
        // Filter by status
        if (apptStatus === 'All') return true;
        if (apptStatus === 'Today') return appt.appointment_date.trimStart() == today
        return appt.status === apptStatus;
    })
    .filter(appt => {
        // Filter by search query
        const patientName = appt.patient_name?.toLowerCase() || '';
        const serviceName = appt.service_name?.toLowerCase() || '';
        const query = searchQuery.toLowerCase();
        return patientName.includes(query) || serviceName.includes(query);
    });

    const chips: FilterChip[] = []
    if (apptStatus !== 'All') chips.push({ key: 'status', label: apptStatus, onRemove: () => setApptStatus('All') })
    if (selectedDate) chips.push({ key: 'date', label: visitDateParts(selectedDate).date, onRemove: () => setSelectedDate('') })

    const totalAppointments = appointments.length
    const todayCount = appointments.filter(appt => String(appt.appointment_date || "").trim() === today).length
    const upcomingCount = appointments.filter(appt => String(appt.status || "").toLowerCase() === "upcoming").length
    const completedCount = appointments.filter(appt => String(appt.status || "").toLowerCase() === "completed").length

    function statusBadgeClasses(status: string) {
        if (status === 'Completed') return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60'
        if (status === 'Cancelled') return 'bg-red-50 text-red-700 ring-1 ring-red-200/60'
        return 'bg-brand-50 text-brand-800 ring-1 ring-brand-200/60'
    }

    const { pageRows: pagedAppointments, pager } = usePaged(filteredAppointments, 'appointments')

    return (
        <div className="min-h-full font-sans text-sage-900">
            <div className="mx-auto max-w-full">

                {showEdit && <EditAppointment appt={apptID} hideForm={() => setShowEdit(false)} refetch={refetchAppts} />}

                {/* HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-[2rem] font-semibold tracking-tight m-0">Appointments</h1>
                        <p className="text-sage-500 text-sm mt-1">Manage your clinic's appointments and schedules.</p>
                    </div>
                    <button
                        onClick={() => navigate('/addappointment')}
                        className="inline-flex items-center gap-2 self-start rounded-lg bg-brand-800 px-4 py-2.5 text-sm font-medium text-white shadow-md transition hover:bg-brand-900"
                    >
                        <i className="bi bi-plus-lg" /> Add Appointment
                    </button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <StatCard icon="bi-calendar-date" value={totalAppointments} label="Total Appointments" />
                    <StatCard icon="bi-clock" value={todayCount} label="Today" />
                    <StatCard icon="bi-calendar-event" value={upcomingCount} label="Upcoming" />
                    <StatCard icon="bi-check2-circle" value={completedCount} label="Completed" />
                </div>

                {/* CONTROLS */}
                <div className="rounded-2xl border border-sage-200 bg-white shadow-card overflow-hidden">
                    <FilterBar
                        search={{ value: searchQuery, onChange: setSearchQuery, placeholder: "Search by patient or service", label: "Search appointments" }}
                        quick={<>
                            <QuickSelect label="Status" value={apptStatus === 'All' ? '' : apptStatus} onChange={v => setApptStatus(v || 'All')}
                                options={[['', 'Any status'], ...apptStatuses.filter(st => st !== 'All').map(st => [st, st] as [string, string])]} />
                            <input type="date" aria-label="Appointment date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
                                className={`h-9 rounded-full border px-3.5 text-sm outline-none focus:ring-2 focus:ring-brand-100 ${selectedDate ? 'border-brand-300 bg-brand-50 text-brand-900' : 'border-sage-200 bg-white text-sage-700'}`} />
                        </>}
                        chips={chips}
                        onClearAll={() => { setApptStatus('All'); setSelectedDate('') }}
                        summary={`${filteredAppointments.length} appointment${filteredAppointments.length === 1 ? '' : 's'}`}
                    />

                    {/* TABLE */}
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-sage-50/60">
                                    <th className="border-b border-sage-100 px-5 py-3 text-left text-xs font-medium text-sage-400">Patient</th>
                                    <th className="border-b border-sage-100 px-5 py-3 text-left text-xs font-medium text-sage-400">Type</th>
                                    <th className="border-b border-sage-100 px-5 py-3 text-left text-xs font-medium text-sage-400">Date</th>
                                    <th className="border-b border-sage-100 px-5 py-3 text-left text-xs font-medium text-sage-400">Time</th>
                                    <th className="border-b border-sage-100 px-5 py-3 text-left text-xs font-medium text-sage-400">Status</th>
                                    <th className="border-b border-sage-100 px-5 py-3 text-right text-xs font-medium text-sage-400"><span className="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagedAppointments.length > 0 ? pagedAppointments.map(appt => (
                                    <tr key={appt.appointment_id} className="transition hover:bg-brand-50/40">
                                        <td className="border-b border-sage-100 px-5 py-3 text-sm last:border-none">
                                            <button type="button" onClick={() => navigate(`/patientdetails/${appt.patient_id}`)} className={rowLinkClass}>
                                                {appt.patient_name}
                                            </button>
                                        </td>
                                        <td className="border-b border-sage-100 px-5 py-3 text-sm text-sage-500 last:border-none">
                                            {appt.service_name}
                                        </td>
                                        <td className="border-b border-sage-100 px-5 py-3 text-sm text-sage-500 last:border-none">
                                            {visitDateParts(appt.appointment_date).date}
                                        </td>
                                        <td className="border-b border-sage-100 px-5 py-3 text-sm text-sage-500 last:border-none">
                                            {appt.start_time}
                                        </td>
                                        <td className="border-b border-sage-100 px-5 py-3 last:border-none">
                                            <span className={`inline-flex w-[90px] items-center justify-center rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClasses(appt.status)}`}>
                                                {appt.status}
                                            </span>
                                        </td>
                                        <td className="border-b border-sage-100 px-5 py-3 last:border-none">
                                            <div className="flex items-center justify-end gap-2">
                                                {appt.status !== 'Completed' && appt.status !== 'Cancelled' && (
                                                    <button type="button" onClick={() => setStatus(appt, 'Completed')} className={inlineActionClass}>
                                                        <i className="bi bi-check-lg" aria-hidden="true" /> Mark completed
                                                    </button>
                                                )}
                                                <RowActions label={`Actions for ${appt.patient_name}'s appointment`} actions={[
                                                    { label: "Edit appointment", icon: "bi-pencil", onSelect: () => { setApptId(appt); setShowEdit(true) } },
                                                    { label: "Open patient", icon: "bi-person", onSelect: () => navigate(`/patientdetails/${appt.patient_id}`) },
                                                    { label: "Cancel appointment", icon: "bi-x-circle", danger: true, hidden: appt.status === 'Cancelled' || appt.status === 'Completed', onSelect: () => setStatus(appt, 'Cancelled') },
                                                ]} />
                                            </div>
                                        </td>
                                    </tr>
                                )) : !loaded ? <SkeletonRows cols={6} /> : (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-12 text-center">
                                            <i className="bi bi-calendar-x text-2xl text-sage-300" />
                                            <p className="mt-2 text-sm text-sage-400">No appointments found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination {...pager} />
                </div>
            </div>
        </div>
    )
}

function StatCard({ icon, value, label }: { icon: string; value: number; label: string }) {
    return (
        <div className="flex items-center gap-3.5 rounded-2xl border border-sage-200 bg-white p-4 shadow-card">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-lg text-brand-800">
                <i className={`bi ${icon}`} />
            </div>
            <div>
                <div className="text-xl font-bold leading-none">{value}</div>
                <div className="mt-1 text-xs text-sage-400">{label}</div>
            </div>
        </div>
    )
}