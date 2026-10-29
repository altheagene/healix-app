import { apiFetch } from "../api";
import React from 'react'
import { useNavigate } from 'react-router'
import 'bootstrap-icons/font/bootstrap-icons.css'
import EditAppointment from '~/components/editappointment'

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
    const [searchQuery, setSearchQuery] = React.useState('')
    const [showEdit, setShowEdit] = React.useState(false)
    const [flashMessage, setFlashMessage] = React.useState<{type: 'success' | 'error', message: string} | null>(null)
    const [selectedDate, setSelectedDate] = React.useState(); // default to today


    const navigate = useNavigate()
    console.log(today)

    // Fetch appointments
    React.useEffect(() => {
        refetchAppts()
    }, [])

    function refetchAppts() {
        apiFetch(`/getallappointments`)
            .then(res => res.json())
            .then(data => setAppointments(data))
    }

    // Show flash message
    const showFlash = (type: 'success' | 'error', message: string) => {
        setFlashMessage({ type, message })
        setTimeout(() => setFlashMessage(null), 2000)
    }

    // Mark completed
    async function markCompleted(appointment_id: any) {
        try {
            await apiFetch(`/updateappointment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ appointment_id, status: 'Completed' })
            })
            refetchAppts()
            showFlash('success', 'Appointment marked as Completed')
        } catch (err) {
            console.error(err)
            showFlash('error', 'Failed to update appointment')
        }
    }

    // Cancel appointment
    async function cancelAppt(appointment_id: any) {
        try {
            await apiFetch(`/updateappointment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ appointment_id, status: 'Cancelled' })
            })
            refetchAppts()
            showFlash('success', 'Appointment Cancelled')
        } catch (err) {
            console.error(err)
            showFlash('error', 'Failed to update appointment')
        }
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

    const totalAppointments = appointments.length
    const todayCount = appointments.filter(appt => String(appt.appointment_date || "").trim() === today).length
    const upcomingCount = appointments.filter(appt => String(appt.status || "").toLowerCase() === "upcoming").length
    const completedCount = appointments.filter(appt => String(appt.status || "").toLowerCase() === "completed").length

    function statusBadgeClasses(status: string) {
        if (status === 'Completed') return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60'
        if (status === 'Cancelled') return 'bg-red-50 text-red-700 ring-1 ring-red-200/60'
        return 'bg-brand-50 text-brand-800 ring-1 ring-brand-200/60'
    }

    return (
        <div className="min-h-full font-sans text-sage-900">
            <div className="mx-auto max-w-full">

                {/* FLASH MESSAGE */}
                {flashMessage && (
                    <div
                        className={`mb-4 rounded-xl border px-4 py-2.5 text-sm font-medium ${
                            flashMessage.type === 'success'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border-red-200 bg-red-50 text-red-700'
                        }`}
                    >
                        {flashMessage.message}
                    </div>
                )}

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
                    <div className="flex flex-col gap-3 border-b border-sage-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap gap-2">
                            {apptStatuses.map(status => (
                                <button
                                    key={status}
                                    onClick={() => setApptStatus(status)}
                                    className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                                        apptStatus === status
                                            ? 'bg-sage-900 text-white'
                                            : 'bg-sage-100 text-sage-500 hover:bg-sage-200'
                                    }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>

                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                            <label className="flex w-full items-center gap-2 rounded-full border border-sage-200 bg-sage-50 px-3.5 py-2 text-sage-400 focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-100 sm:w-64">
                                <i className="bi bi-search text-sm" />
                                <input
                                    type="text"
                                    placeholder="Search by patient or service"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full border-none bg-transparent text-sm text-sage-900 outline-none placeholder:text-sage-400"
                                />
                            </label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value as any)}
                                className="rounded-full border border-sage-200 bg-sage-50 px-3.5 py-2 text-sm text-sage-700 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                            />
                        </div>
                    </div>

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
                                    <th className="border-b border-sage-100 px-5 py-3 text-right text-xs font-medium text-sage-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAppointments.length > 0 ? filteredAppointments.map(appt => (
                                    <tr key={appt.appointment_id} className="transition hover:bg-brand-50/40">
                                        <td className="border-b border-sage-100 px-5 py-3 text-sm font-medium text-sage-900 last:border-none">
                                            {appt.patient_name}
                                        </td>
                                        <td className="border-b border-sage-100 px-5 py-3 text-sm text-sage-500 last:border-none">
                                            {appt.service_name}
                                        </td>
                                        <td className="border-b border-sage-100 px-5 py-3 text-sm text-sage-500 last:border-none">
                                            {appt.appointment_date}
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
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    title="Mark as Completed"
                                                    disabled={appt.status === 'Completed'}
                                                    onClick={() => markCompleted(appt.appointment_id)}
                                                    className="flex h-8 w-8 items-center justify-center rounded-full text-emerald-600 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:text-sage-300 disabled:hover:bg-transparent"
                                                >
                                                    <i className="bi bi-check-lg text-base" />
                                                </button>

                                                <button
                                                    title="Cancel Appointment"
                                                    disabled={appt.status === 'Cancelled'}
                                                    onClick={() => cancelAppt(appt.appointment_id)}
                                                    className="flex h-8 w-8 items-center justify-center rounded-full text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:text-sage-300 disabled:hover:bg-transparent"
                                                >
                                                    <i className="bi bi-x-lg text-base" />
                                                </button>

                                                <button
                                                    title="Edit Appointment"
                                                    onClick={() => { setApptId(appt); setShowEdit(true) }}
                                                    className="flex h-8 w-8 items-center justify-center rounded-full text-sage-400 transition hover:bg-sage-100 hover:text-sage-700"
                                                >
                                                    <i className="bi bi-pencil text-sm" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
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