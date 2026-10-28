import { apiFetch } from "../api";
import React from 'react'
import AddPatient from '~/components/addpatient'
import { useNavigate } from 'react-router'
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function AddAppointment() {

    const navigate = useNavigate()
    const [services, setServices] = React.useState<any[]>([])
    const [patients, setPatients] = React.useState<any[]>([])
    const [showRegister, setShowRegister] = React.useState(false)
    const [appointmentDetails, setAppointmentDetails] = React.useState({
        patient_id: '',
        service_id: 0,
        appointment_date: '',
        start_time: '',
        status: 'Upcoming'
    })



    const [patientQuery, setPatientQuery] = React.useState('')
    const [filteredPatients, setFilteredPatients] = React.useState<any[]>([])
    const [selectedPatient, setSelectedPatient] = React.useState<any>(null)
    const [saving, setSaving] = React.useState(false)
    const [appointments, setAppointments] = React.useState<any[]>()
    const [flashMessage, setFlashMessage] = React.useState<{type: 'success' | 'error', message: string} | null>(null)

    const timeArr = ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM']
    const [availableTime, setAvailableTime] = React.useState<any[]>([])

    React.useEffect(() => {
        const filteredAppointments = appointments?.filter(app =>
            app.appointment_date.includes(appointmentDetails.appointment_date)
        )

        const available = timeArr.filter(time =>
            !filteredAppointments?.some(appt =>
            appt.start_time.includes(time) && appt.status != 'Cancelled'
            )
        )

        setAvailableTime(available)
    }, [appointmentDetails.appointment_date, appointments])

    React.useEffect(() => {
        if (
            availableTime.length > 0 &&
            !appointmentDetails.start_time
        ) {
            setAppointmentDetails(prev => ({
            ...prev,
            start_time: availableTime[0]
            }))
        }
    }, [availableTime])

    React.useEffect(() => {
        setAppointmentDetails(prev => ({
            ...prev,
            start_time: ""
        }))
    }, [appointmentDetails.appointment_date])


    console.log(availableTime)

    React.useEffect(() => {
        apiFetch(`/getallservices`)
            .then(res => res.json())
            .then(data => setServices(data))

        apiFetch(`/getallpatients`)
            .then(res => res.json())
            .then(data => setPatients(data))

            apiFetch(`/getallappointments`)
            .then(res => res.json())
            .then(data => setAppointments(data))
    }, [])


    console.log(appointmentDetails)

    React.useEffect(() => {
        if (!patientQuery) {
            setFilteredPatients([])
            return
        }
        const matches = patients.filter(p => {
            const name = `${p.first_name || ""} ${p.last_name || ""}`.toLowerCase()
            const studentId = String(p.student_id ?? "")
            return name.includes(patientQuery.toLowerCase()) || studentId.includes(patientQuery)
        })
        setFilteredPatients(matches)
    }, [patientQuery, patients])

    const handlePatientSelect = (patient: any) => {
        setSelectedPatient(patient)
        setAppointmentDetails({ ...appointmentDetails, patient_id: patient.patient_id })
        setPatientQuery(`${patient.first_name} ${patient.last_name}`)
        setFilteredPatients([])
    }

    const handleSaveAppointment = async () => {
        if (!appointmentDetails.patient_id) {
            setFlashMessage({ type: 'error', message: 'Please select a patient first' })
            return
        }
        if (!appointmentDetails.service_id || !appointmentDetails.appointment_date || !appointmentDetails.start_time) {
            setFlashMessage({ type: 'error', message: 'Please fill all appointment details' })
            return
        }

        setSaving(true)

        try {
            const res = await apiFetch(`/addappointment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(appointmentDetails)
            })
            const data = await res.json()

            if (res.ok) {
                setFlashMessage({ type: 'success', message: 'Appointment saved successfully!' })
                // Reset form
                setAppointmentDetails({
                    patient_id: '',
                    service_id: 0,
                    appointment_date: '',
                    start_time: '',
                    status: 'Upcoming'
                })
                setSelectedPatient(null)
                setPatientQuery('')
            } else {
                setFlashMessage({ type: 'error', message: `Error saving appointment: ${data.message}` })
            }
        } catch (err) {
            console.error(err)
            setFlashMessage({ type: 'error', message: 'Error saving appointment' })
        } finally {
            setSaving(false)
            // Remove flash message after 2 seconds
            setTimeout(() => setFlashMessage(null), 2000)
        }
    }

    const inputClasses = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-teal-300 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";
    const labelClasses = "mb-1.5 block text-xs font-medium text-slate-500";

    return (
        <div className="min-h-full font-sans text-slate-900">
            <div className="mx-auto max-w-full">

                {showRegister && <AddPatient hideForm={() => {
                    setShowRegister(false)
                    apiFetch(`/getallpatients`).then(res => res.json()).then(data => setPatients(data))
                }} />}

                {/* HEADER */}
                <div className="mb-6 flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
                    >
                        <i className="bi bi-caret-left-fill" />
                    </button>
                    <h1 className="text-[2rem] font-semibold tracking-tight">Add Appointment</h1>
                </div>

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

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

                    {/* LEFT: APPOINTMENT DETAILS */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <p className="mb-4 text-sm font-semibold text-slate-900">
                            Appointment Details <span className="text-red-500">*</span>
                        </p>

                        <div className="space-y-3.5">
                            <div>
                                <label className={labelClasses}>Service</label>
                                <select
                                    value={appointmentDetails.service_id}
                                    onChange={e => setAppointmentDetails({ ...appointmentDetails, service_id: Number(e.target.value) })}
                                    className={inputClasses}
                                >
                                    <option value={0}>Select Service</option>
                                    {services.map(service => (
                                        <option key={service.service_id} value={service.service_id}>{service.service_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className={labelClasses}>Date</label>
                                <input
                                    type="date"
                                    value={appointmentDetails.appointment_date}
                                    onChange={e => setAppointmentDetails({ ...appointmentDetails, appointment_date: e.target.value })}
                                    className={inputClasses}
                                />
                            </div>

                            <div>
                                <label className={labelClasses}>Time</label>
                                <select
                                    value={appointmentDetails.start_time || ""}
                                    onChange={e =>
                                        setAppointmentDetails({
                                            ...appointmentDetails,
                                            start_time: e.target.value
                                        })
                                    }
                                    disabled={!appointmentDetails.appointment_date}
                                    className={inputClasses}
                                >
                                    <option value="" disabled>
                                        Select Time
                                    </option>

                                    {availableTime.map(time => (
                                        <option key={time} value={time}>
                                            {time}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={handleSaveAppointment}
                                disabled={saving}
                                className="w-full rounded-xl bg-teal-800 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-teal-900 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {saving ? "Saving..." : "Save Appointment"}
                            </button>
                        </div>
                    </div>

                    {/* RIGHT: SELECT PATIENT */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <p className="mb-4 text-sm font-semibold text-slate-900">
                            Select Patient <span className="text-red-500">*</span>
                        </p>

                        <div className="relative">
                            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-400 focus-within:border-teal-300 focus-within:ring-2 focus-within:ring-teal-100">
                                <i className="bi bi-search text-sm" />
                                <input
                                    type="text"
                                    placeholder="Search patient..."
                                    value={patientQuery}
                                    onChange={(e) => setPatientQuery(e.target.value)}
                                    className="w-full border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                                />
                            </label>

                            {filteredPatients.length > 0 && (
                                <ul className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                                    {filteredPatients.map(p => (
                                        <li
                                            key={p.patient_id}
                                            onClick={() => handlePatientSelect(p)}
                                            className="cursor-pointer px-4 py-2.5 transition hover:bg-slate-50"
                                        >
                                            <div className="text-sm font-medium text-slate-900">{p.first_name} {p.last_name}</div>
                                            <div className="text-xs text-slate-400">ID: {p.student_id}</div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {selectedPatient && (
                            <div className="mt-3.5 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3">
                                <p className="text-sm font-semibold text-teal-900">{selectedPatient.first_name} {selectedPatient.last_name}</p>
                                <p className="text-xs text-teal-900">Student ID: {selectedPatient.student_id}</p>
                            </div>
                        )}

                        <button
                            onClick={() => setShowRegister(true)}
                            className="mt-4 w-full rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                        >
                            Register New Patient
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}