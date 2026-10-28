import { apiFetch } from "../api";
import { ROLES, STAFF_ROLE_NAME } from "../roles";
import AddRecord from '~/components/addrecord'
import EditPatient from '~/components/editpatient'
import ViewVisit from '~/components/viewVisit'
import React from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import 'bootstrap-icons/font/bootstrap-icons.css';
import user from '../images/user.png'
import EditRecord from '~/components/editrecord'
import { VisitOutcomeDialog } from '~/components/visitoutcome'
import { DISPOSITIONS, DISPOSITION_SHORT, DISPOSITION_TONES, NOTIFY_METHODS } from '../visitOutcomes'
import { describeLevel } from '../school'

export default function PatientDetails(){
    const role = localStorage.getItem('role');
    const { id } = useParams()
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const isClinician = role !== STAFF_ROLE_NAME
    // Arriving from the check-in box opens a new visit straight away.
    const [showAddRecord, setShowAddRecord] = React.useState(searchParams.get('visit') === 'new' && isClinician)
    const [showEdit, setShowEdit] = React.useState(false)
    const [showVisit, setShowVisit] = React.useState(false)
    const [showEditRecord, setShowEditRecord] = React.useState(false)
    const [recordToEdit, _setRecordToEdit] = React.useState()
    const [visitChosen, setVisitChosen] = React.useState(false)
    const [closingVisit, setClosingVisit] = React.useState<any>(null)

    const [studentData, setStudentData] = React.useState<any>()
    const [allergies, setAllergies] = React.useState<any[]>()
    const [conditions, setConditions] = React.useState<any[]>()
    const [clinicLogs, setClinicLogs]= React.useState<any[]>();
    const [currentUser, setCurrentUser] = React.useState<any>()
    const [timeline, setTimeline] = React.useState<Timeline>({ events: [], vitals: [] })

    function loadTimeline() {
        apiFetch(`/patienttimeline?idnum=${id}`)
            .then(res => res.json())
            .then(data => setTimeline(data && Array.isArray(data.events) ? data : { events: [], vitals: [] }))
    }

    React.useEffect(loadTimeline, [id])

    function closeAddRecord() {
        setShowAddRecord(false)
        if (searchParams.get('visit')) setSearchParams({}, { replace: true })
    }

    async function setArchived(archived: boolean) {
        const question = archived
            ? 'Archive this patient? They will be hidden from the patient list and pickers, but nothing is deleted.'
            : 'Restore this patient to the active list?'
        if (!window.confirm(question)) return
        const response = await apiFetch(`/archivepatient`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ patient_id: Number(id), archived }),
        })
        const result = await response.json()
        if (result.success) refetch()
        else alert(result.error || 'Could not update the patient')
    }

    React.useEffect(() => {
        apiFetch(`/getpatient?idnum=${id}`).then(res => res.json()).then(data => setStudentData(data[0]))

        apiFetch(`/getpatientcliniclogs?idnum=${id}`)
        .then(res => res.json())
        .then(data => setClinicLogs(data))

        const userId = localStorage.getItem('userid')
        if (userId) {
            apiFetch(`/finduser?id=${userId}`)
                .then(res => res.json())
                .then(data => setCurrentUser(data[0]))
        }
    }, [])

     React.useEffect(() => {
        apiFetch(`/getpatientallergies?idnum=${id}`).then(res => res.json()).then(data => setAllergies(data))
    }, [])

    React.useEffect(() => {
        apiFetch(`/getpatientconditions?idnum=${id}`).then(res => res.json()).then(data => setConditions(data))
    }, [])

    async function refetch(){
        apiFetch(`/getpatientcliniclogs?idnum=${id}`)
        .then(res => res.json())
        .then(data => setClinicLogs(data))

        await apiFetch(`/getpatient?idnum=${id}`).then(res => res.json()).then(data => setStudentData(data[0]))

         apiFetch(`/getpatientallergies?idnum=${id}`).then(res => res.json()).then(data => setAllergies(data))

          apiFetch(`/getpatientconditions?idnum=${id}`).then(res => res.json()).then(data => setConditions(data))

        loadTimeline()
    }

    const userName = currentUser
        ? `${currentUser.first_name || ""} ${currentUser.last_name || ""}`.trim()
        : "Staff"
    const userRole = ROLES.find(r => r.staff_category_id === Number(currentUser?.staff_category_id))?.category_name

    return(
        <div className="-mx-8 -my-7 min-h-full bg-[#f6f7f6] px-8 py-7 font-sans text-[#0b3d3a]">
            {showEditRecord && <EditRecord record={recordToEdit} hideForm={() => setShowEditRecord(false)} refetch={refetch}/>}
            {showVisit && visitChosen? <ViewVisit visit={visitChosen} hideForm={() => setShowVisit(false)}/> : null}
            {showEdit ? <EditPatient studentData={studentData} allergies={allergies} conditions={conditions} refetch={refetch} hideForm={() => setShowEdit(false)}/> : null}
            {closingVisit && (
                <VisitOutcomeDialog
                    visit={{ ...closingVisit, first_name: studentData?.first_name, last_name: studentData?.last_name,
                             emergency_contact_name: studentData?.emergency_contact_name,
                             emergency_contact_phone: studentData?.emergency_contact_phone }}
                    onClose={() => setClosingVisit(null)}
                    onDone={() => { setClosingVisit(null); refetch() }}
                />
            )}
            {showAddRecord ? <AddRecord hideForm={closeAddRecord} refetch={refetch} allergies={allergies} /> : null}

            <div className="mb-6 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
                <div>
                    <button
                        onClick={() => navigate('/patients')}
                        className="inline-flex items-center gap-1.5 whitespace-nowrap border-none bg-transparent p-0 text-sm text-[#7b8c87] transition hover:text-[#0b3d3a]"
                    >
                        <i className="bi bi-arrow-left" /> Back to patients
                    </button>
                    <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-[2rem]">Patient Details</h1>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 sm:pt-1">
                    {isClinician && (
                        <>
                            <button
                                type="button"
                                onClick={() => navigate(`/patientsummary/${id}`)}
                                className="inline-flex items-center gap-1.5 rounded-full border border-[#dfe7e2] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#0b3d3a] transition hover:bg-[#f3f8f4]"
                            >
                                <i className="bi bi-printer" aria-hidden="true" /> Print summary
                            </button>
                            <button
                                type="button"
                                onClick={() => setArchived(!studentData?.archived)}
                                className="inline-flex items-center gap-1.5 rounded-full border border-[#dfe7e2] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#5b716d] transition hover:bg-[#f3f8f4]"
                            >
                                <i className={`bi ${studentData?.archived ? 'bi-box-arrow-up' : 'bi-archive'}`} aria-hidden="true" />
                                {studentData?.archived ? 'Restore' : 'Archive'}
                            </button>
                        </>
                    )}
                    <button
                        type="button"
                        className="hidden h-9 w-9 items-center justify-center rounded-full border-none bg-transparent text-[#7b8c87] sm:flex"
                        title="Notifications"
                    >
                        <i className="bi bi-bell" />
                    </button>
                    <img src={user} alt="" className="hidden h-8 w-8 rounded-full object-cover sm:block" />
                    <div className="hidden sm:block">
                        <p className="text-sm font-medium leading-none">{userName || "Staff"}</p>
                        {userRole && <p className="mt-1 text-xs text-[#7b8c87]">{userRole}</p>}
                    </div>
                </div>
            </div>

            {allergies && allergies.length > 0 && (
                <div role="alert" className="mb-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-800">
                    <i className="bi bi-exclamation-octagon-fill mt-0.5 text-lg" aria-hidden="true" />
                    <div>
                        <p className="m-0 text-sm font-semibold">
                            Allergic to {allergies.map(a => a.allergy_name).join(', ')}
                        </p>
                        <p className="m-0 mt-0.5 text-xs text-red-700">Check before giving any medicine.</p>
                    </div>
                </div>
            )}
            {studentData?.archived ? (
                <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm text-slate-600">
                    <i className="bi bi-archive mr-2" aria-hidden="true" />
                    This patient is archived. Their record is kept but hidden from the patient list.
                </div>
            ) : null}
            {studentData && (!studentData.emergency_contact_phone || !studentData.birthday) && (
                <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm text-rose-800">
                    <i className="bi bi-telephone-x mr-2" aria-hidden="true" />
                    Missing {[!studentData.emergency_contact_phone && 'an emergency contact phone', !studentData.birthday && 'a birthday'].filter(Boolean).join(' and ')}.
                    {' '}<button type="button" onClick={() => setShowEdit(true)} className="font-semibold underline">Add it now</button>
                </div>
            )}

            <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
                {/* LEFT PANEL: who the patient is, what to watch for, who to call */}
                <aside className="flex flex-col gap-4 lg:sticky lg:top-4">
                    <section className="rounded-3xl bg-white p-5">
                        <div className="flex items-center gap-4">
                            <img src={user} alt="" className="h-16 w-16 flex-shrink-0 rounded-2xl object-cover" />
                            <div className="min-w-0">
                                <p className="m-0 break-words text-base font-semibold">
                                    {studentData?.first_name} {studentData?.middle_name} {studentData?.last_name}
                                </p>
                                <p className="m-0 mt-0.5 truncate text-sm text-[#7b8c87]">
                                    {studentData?.department || (studentData?.is_student ? 'Student' : 'Staff or visitor')}
                                </p>
                                <p className="m-0 mt-0.5 text-sm font-medium text-[#0b3d3a]">
                                    {describeLevel(studentData?.department, studentData?.level, studentData?.strand)}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowEdit(true)}
                            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#dfe7e2] bg-white px-4 py-2 text-sm font-semibold text-[#0b3d3a] transition hover:bg-[#f3f8f4]"
                        >
                            <i className="bi bi-pencil" aria-hidden="true" /> Edit details
                        </button>
                    </section>

                    <section className="rounded-3xl bg-white p-5" aria-labelledby="info-heading">
                        <h2 id="info-heading" className="m-0 mb-3 text-sm font-semibold">Information</h2>
                        <dl className="m-0 space-y-2.5 text-sm">
                            <InfoRow label="ID number" value={studentData?.student_id} />
                            <InfoRow label="Sex" value={studentData?.sex} />
                            <InfoRow label="Birthday" value={birthdayLabel(studentData?.birthday)} />
                            <InfoRow label="Email" value={studentData?.email} />
                            <InfoRow label="Phone" value={studentData?.phone} />
                        </dl>
                    </section>

                    <section className="rounded-3xl bg-white p-5" aria-labelledby="medical-heading">
                        <h2 id="medical-heading" className="m-0 mb-3 text-sm font-semibold">Medical</h2>
                        <p className="m-0 mb-1.5 text-xs text-[#7b8c87]">Allergies</p>
                        <div className="mb-4 flex flex-wrap gap-1.5">
                            {allergies && allergies.length > 0 ? allergies.map((allergy, idx) => (
                                <span key={idx} className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">
                                    {allergy.allergy_name}
                                </span>
                            )) : (
                                <span className="text-sm text-[#9aaea8]">None recorded</span>
                            )}
                        </div>
                        <p className="m-0 mb-1.5 text-xs text-[#7b8c87]">Conditions</p>
                        <div className="mb-4 flex flex-wrap gap-1.5">
                            {conditions && conditions.length > 0 ? conditions.map((condition, idx) => (
                                <span key={idx} className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-600">
                                    {condition.condition_name}
                                </span>
                            )) : (
                                <span className="text-sm text-[#9aaea8]">None recorded</span>
                            )}
                        </div>
                        <p className="m-0 mb-1.5 text-xs text-[#7b8c87]">Notes</p>
                        <p className="m-0 whitespace-pre-line text-sm text-[#5b716d]">{studentData?.notes || 'None'}</p>
                    </section>

                    <section className="rounded-3xl bg-white p-5" aria-labelledby="contact-heading">
                        <h2 id="contact-heading" className="m-0 mb-3 text-sm font-semibold">Emergency contact</h2>
                        {studentData?.emergency_contact_name || studentData?.emergency_contact_phone ? (
                            <>
                                <p className="m-0 text-sm font-medium">{studentData?.emergency_contact_name || 'Name not recorded'}</p>
                                <p className="m-0 mt-0.5 text-sm text-[#5b716d]">{studentData?.emergency_contact_phone || 'No phone number'}</p>
                            </>
                        ) : (
                            <p className="m-0 text-sm text-[#9aaea8]">None recorded</p>
                        )}
                        {studentData?.emergency_contact_phone && (
                            <a
                                href={`tel:${String(studentData.emergency_contact_phone).replace(/[^\d+]/g, '')}`}
                                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0b3d3a] px-4 py-2 text-sm font-semibold text-white no-underline transition hover:bg-[#082e2c]"
                            >
                                <i className="bi bi-telephone-fill" aria-hidden="true" />
                                Call {studentData?.emergency_contact_name || 'emergency contact'}
                            </a>
                        )}
                    </section>
                </aside>

                {/* MAIN: care history */}
                <div className="flex min-w-0 flex-col gap-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <StatCard icon="bi-calendar-check" iconClass="text-amber-500" label="Total visits" value={clinicLogs?.length ?? 0} />
                        <StatCard icon="bi-clock-history" iconClass="text-teal-600" label="Last visit" value={lastVisitLabel(clinicLogs)} />
                        <StatCard icon="bi-arrow-repeat" iconClass="text-sky-500" label="Visits in the last 30 days" value={visitsWithinDays(clinicLogs, 30)} />
                    </div>

                    <section className="rounded-3xl bg-white" aria-labelledby="visits-heading">
                        <div className="flex items-center justify-between px-6 py-5">
                            <h2 id="visits-heading" className="m-0 text-sm font-semibold">Clinic visits</h2>
                            {isClinician && (
                                <button
                                    onClick={() => setShowAddRecord(true)}
                                    className="inline-flex items-center gap-2 rounded-full bg-[#7dcf8a] px-4 py-2 text-sm font-semibold text-[#0b3d3a] transition hover:bg-[#6bc37a]"
                                >
                                    <i className="bi bi-plus-lg" /> Add record
                                </button>
                            )}
                        </div>

                        <div className="overflow-x-auto px-2 pb-2">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-[#9aaea8]">Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-[#9aaea8]">Reason</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-[#9aaea8]">Attending</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-[#9aaea8]">Outcome</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-[#9aaea8]">Notes</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-[#9aaea8]"><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {clinicLogs && clinicLogs.length > 0 ? [...clinicLogs].reverse().map((log, idx) => (
                                        <tr key={idx} className="align-top">
                                            <td className="whitespace-nowrap border-t border-[#eef2ef] px-4 py-3.5 text-sm">
                                                <span className="block font-medium">{String(log.visit_datetime).slice(0, 10)}</span>
                                                <span className="block text-xs text-[#7b8c87]">{String(log.visit_datetime).slice(11, 16)}</span>
                                            </td>
                                            <td className="border-t border-[#eef2ef] px-4 py-3.5">
                                                <span className="inline-flex items-center rounded-full bg-[#eaf6a8] px-2.5 py-1 text-xs font-medium text-[#0b3d3a]">
                                                    {log.service_name}
                                                </span>
                                                {log.complaint && <p className="m-0 mt-1 text-xs text-[#5b716d]">{log.complaint}</p>}
                                            </td>
                                            <td className="border-t border-[#eef2ef] px-4 py-3.5 text-sm font-medium">
                                                {log.staff_name}
                                            </td>
                                            <td className="border-t border-[#eef2ef] px-4 py-3.5 text-sm">
                                                <OutcomeCell log={log} canClose={isClinician} onClose={() => setClosingVisit(log)} />
                                            </td>
                                            <td className="max-w-[16rem] border-t border-[#eef2ef] px-4 py-3.5 text-sm text-[#5b716d]">
                                                <span className="line-clamp-2" title={log.notes || undefined}>{log.notes}</span>
                                            </td>
                                            <td className="border-t border-[#eef2ef] px-4 py-3.5 text-right">
                                                <button
                                                    onClick={() => { setShowVisit(true); setVisitChosen(log); }}
                                                    aria-label={`View visit on ${String(log.visit_datetime).slice(0, 10)}`}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border-none bg-transparent text-[#7b8c87] transition hover:bg-[#f3f8f4] hover:text-[#0b3d3a]"
                                                >
                                                    <i className="bi bi-eye" aria-hidden="true" />
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={6} className="border-t border-[#eef2ef] px-5 py-12 text-center">
                                                <p className="text-sm text-[#9aaea8]">No clinic visits yet</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <PatientTimeline timeline={timeline} />
                </div>
            </div>
        </div>
    )
}

interface TimelineEvent {
    type: 'visit' | 'appointment' | 'change'
    at: string
    service_name?: string
    staff_name?: string
    complaint?: string
    assessment?: string
    treatment?: string
    notes?: string
    medicines?: string
    status?: string
    action?: string
    username?: string
    disposition?: string
    referred_to?: string
    picked_up_by?: string
    parent_notified?: number
    notified_method?: string
}

/** How a visit ended, or "In clinic" with a Close button while it is still open. */
function OutcomeCell({ log, canClose, onClose }: { log: any; canClose: boolean; onClose: () => void }) {
    if (!log.disposition) {
        if (!log.time_in) return <span className="text-xs text-[#9aaea8]">Not recorded</span>
        return (
            <span className="inline-flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" /> In clinic
                </span>
                {canClose && (
                    <button type="button" onClick={onClose} className="text-xs font-semibold text-[#0b3d3a] underline">Close visit</button>
                )}
            </span>
        )
    }
    return (
        <span className="inline-flex flex-col gap-0.5">
            <span
                title={DISPOSITIONS[log.disposition] || log.disposition}
                className={`inline-flex w-fit items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${DISPOSITION_TONES[log.disposition] || ''}`}
            >
                {DISPOSITION_SHORT[log.disposition] || log.disposition}
            </span>
            {log.referred_to && <span className="text-xs text-[#5b716d]">{log.referred_to}</span>}
            {log.picked_up_by && <span className="text-xs text-[#5b716d]">Picked up by {log.picked_up_by}</span>}
            {log.parent_notified ? <span className="text-xs text-emerald-700">Parent notified</span> : null}
        </span>
    )
}

interface Timeline {
    events: TimelineEvent[]
    vitals: { date: string; weight: number | null; temperature: number | null }[]
}

const CHANGE_LABELS: Record<string, string> = {
    patient_create: 'Record created',
    patient_update: 'Details updated',
    patient_allergy_add: 'Allergy added',
    patient_allergy_delete: 'Allergy removed',
    patient_condition_add: 'Condition added',
    patient_condition_delete: 'Condition removed',
    patient_archive: 'Archived or restored',
}

function PatientTimeline({ timeline }: { timeline: Timeline }) {
    const [showAll, setShowAll] = React.useState(false)
    const events = showAll ? timeline.events : timeline.events.slice(0, 15)
    const hasWeight = timeline.vitals.some(v => v.weight !== null)
    const hasTemperature = timeline.vitals.some(v => v.temperature !== null)

    return (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
            <div className="rounded-3xl bg-white p-6 xl:col-span-2">
                <h2 className="m-0 mb-4 text-sm font-semibold">Vitals over time</h2>
                {timeline.vitals.length >= 2 ? (
                    <div className="h-56" role="img" aria-label={`Weight and temperature across ${timeline.vitals.length} visits`}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={timeline.vitals} margin={{ top: 5, right: 8, bottom: 0, left: -18 }}>
                                <CartesianGrid stroke="#eef2ef" vertical={false} />
                                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#7b8c87' }} tickLine={false} axisLine={false} />
                                {hasWeight && <YAxis yAxisId="weight" tick={{ fontSize: 11, fill: '#7b8c87' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />}
                                {hasTemperature && <YAxis yAxisId="temperature" orientation="right" tick={{ fontSize: 11, fill: '#7b8c87' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />}
                                <Tooltip />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                {hasWeight && <Line yAxisId="weight" type="monotone" dataKey="weight" name="Weight (kg)" stroke="#0b3d3a" strokeWidth={2} dot={{ r: 3 }} connectNulls />}
                                {hasTemperature && <Line yAxisId="temperature" type="monotone" dataKey="temperature" name="Temperature (°C)" stroke="#e0703a" strokeWidth={2} dot={{ r: 3 }} connectNulls />}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <p className="text-sm text-[#9aaea8]">
                        {timeline.vitals.length === 1 ? 'One visit with vitals so far. The chart appears after the second.' : 'No weight or temperature recorded yet.'}
                    </p>
                )}
            </div>

            <div className="rounded-3xl bg-white p-6 xl:col-span-3">
                <h2 className="m-0 mb-4 text-sm font-semibold">Timeline</h2>
                {events.length === 0 ? (
                    <p className="text-sm text-[#9aaea8]">Nothing recorded yet.</p>
                ) : (
                    <ol className="m-0 list-none space-y-4 border-l-2 border-[#eef2ef] p-0 pl-5">
                        {events.map((event, idx) => (
                            <li key={idx} className="relative">
                                <span
                                    aria-hidden="true"
                                    className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-white ${event.type === 'visit' ? 'bg-[#0b3d3a]' : event.type === 'appointment' ? 'bg-amber-400' : 'bg-slate-300'}`}
                                />
                                <p className="m-0 text-xs text-[#7b8c87]">{event.at}</p>
                                {event.type === 'visit' && (
                                    <div className="text-sm">
                                        <p className="m-0 font-medium">
                                            Visit: {event.complaint || event.service_name}
                                            {event.staff_name && <span className="font-normal text-[#7b8c87]"> · {event.staff_name}</span>}
                                        </p>
                                        {event.assessment && <p className="m-0 text-[#5b716d]">Assessment: {event.assessment}</p>}
                                        {event.treatment && <p className="m-0 text-[#5b716d]">Treatment: {event.treatment}</p>}
                                        {event.medicines && <p className="m-0 text-[#5b716d]">Medicines: {event.medicines}</p>}
                                        {event.notes && <p className="m-0 text-[#5b716d]">{event.notes}</p>}
                                        {event.disposition && (
                                            <p className="m-0 text-[#5b716d]">
                                                Outcome: {DISPOSITIONS[event.disposition] || event.disposition}
                                                {event.referred_to && ` (${event.referred_to})`}
                                                {event.picked_up_by && `, picked up by ${event.picked_up_by}`}
                                                {event.parent_notified ? ` · parent notified${event.notified_method ? ` by ${(NOTIFY_METHODS[event.notified_method] || event.notified_method).toLowerCase()}` : ''}` : ''}
                                            </p>
                                        )}
                                    </div>
                                )}
                                {event.type === 'appointment' && (
                                    <p className="m-0 text-sm">Appointment: {event.service_name || 'Clinic'} <span className="text-[#7b8c87]">({event.status})</span></p>
                                )}
                                {event.type === 'change' && (
                                    <p className="m-0 text-sm text-[#5b716d]">
                                        {CHANGE_LABELS[event.action || ''] || event.action}
                                        {event.username && <span className="text-[#7b8c87]"> by {event.username}</span>}
                                    </p>
                                )}
                            </li>
                        ))}
                    </ol>
                )}
                {timeline.events.length > 15 && (
                    <button type="button" onClick={() => setShowAll(v => !v)} className="mt-4 text-sm font-medium text-[#0b3d3a] underline">
                        {showAll ? 'Show less' : `Show all ${timeline.events.length} entries`}
                    </button>
                )}
            </div>
        </div>
    )
}

function birthdayLabel(birthday?: string) {
    if (!birthday) return undefined
    const born = new Date(`${birthday}T00:00:00`)
    if (Number.isNaN(born.getTime())) return birthday
    const today = new Date()
    let age = today.getFullYear() - born.getFullYear()
    if (today < new Date(today.getFullYear(), born.getMonth(), born.getDate())) age -= 1
    return `${birthday} (${age})`
}

function lastVisitLabel(logs?: any[]) {
    if (!logs || logs.length === 0) return 'Never'
    const latest = logs.map(log => String(log.visit_datetime)).sort().at(-1) as string
    const days = Math.floor((Date.now() - new Date(latest.replace(' ', 'T')).getTime()) / 86_400_000)
    if (days <= 0) return 'Today'
    if (days === 1) return 'Yesterday'
    return days < 30 ? `${days} days ago` : latest.slice(0, 10)
}

function visitsWithinDays(logs: any[] | undefined, days: number) {
    const since = Date.now() - days * 86_400_000
    return (logs ?? []).filter(log => new Date(String(log.visit_datetime).replace(' ', 'T')).getTime() >= since).length
}

function InfoRow({ label, value, stacked }: { label: string; value?: string | number; stacked?: boolean }) {
    return (
        <div className={stacked ? "space-y-1" : "flex items-center justify-between gap-3"}>
            <dt className="text-[#7b8c87]">{label}</dt>
            <dd className="font-medium">{value || '-'}</dd>
        </div>
    )
}

function StatCard({ icon, iconClass, label, value }: { icon: string; iconClass: string; label: string; value: number | string }) {
    return (
        <div className="rounded-3xl bg-white px-5 py-6 text-center">
            <i className={`bi ${icon} text-xl ${iconClass}`} />
            <p className="mt-3 text-xs text-[#7b8c87]">{label}</p>
            <p className="mt-1 text-2xl font-semibold leading-none">{value}</p>
        </div>
    )
}
