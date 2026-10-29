import { apiFetch } from "../api";
import AddPatient from '~/components/addpatient'
import Pagination from '~/components/pagination'
import ClinicNow from '~/components/clinicnow'
import { DEPARTMENTS, STAGES, describeLevel, levelOptions } from '../school'
import React from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import 'bootstrap-icons/font/bootstrap-icons.css';

interface Patient {
    patient_id: string | number
    student_id?: string | number
    first_name?: string
    last_name?: string
    department?: string
    level?: string
    sex?: string
    is_student?: number
    strand?: string | null
    last_visit?: string | null
    allergies?: string | null
    frequent_visitor?: boolean
    recent_visits?: number
    missing_info?: number
}

interface Stats {
    total: number
    departments: number
    male: number
    female: number
    missing_info: number
    frequent: number
    archived: number
}

interface SearchResult {
    patients: Patient[]
    total: number
    stats: Stats
    departments: string[]
}

interface Filters {
    department: string
    level: string
    stage: string
    sex: string
    patient_type: string
    visited_within: string
    flag: string
    has_allergies: boolean
    has_conditions: boolean
    archived: boolean
}

type SortKey = "patient_id" | "name" | "student_id" | "department" | "level" | "last_visit" | "sex"

const EMPTY_RESULT: SearchResult = {
    patients: [],
    total: 0,
    stats: { total: 0, departments: 0, male: 0, female: 0, missing_info: 0, frequent: 0, archived: 0 },
    departments: [],
}

const NO_FILTERS: Filters = {
    department: "", level: "", stage: "", sex: "", patient_type: "", visited_within: "", flag: "",
    has_allergies: false, has_conditions: false, archived: false,
}

const PAGE_SIZE = 10

export default function Patients() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [showForm, setShowForm] = React.useState(false)
    const [prefillStudentId, setPrefillStudentId] = React.useState<string | undefined>()
    const [searchTerm, setSearchTerm] = React.useState(searchParams.get("q") || "")
    const [query, setQuery] = React.useState(searchTerm)
    const [filters, setFilters] = React.useState<Filters>(NO_FILTERS)
    const [sort, setSort] = React.useState<{ key: SortKey; direction: "asc" | "desc" }>({ key: "patient_id", direction: "asc" })
    const [currentPage, setCurrentPage] = React.useState(1)
    const [result, setResult] = React.useState<SearchResult>(EMPTY_RESULT)
    const [reloadKey, setReloadKey] = React.useState(0)

    // Wait for a pause in typing before searching, and start again from page 1.
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setQuery(searchTerm)
            setCurrentPage(1)
        }, 250)
        return () => clearTimeout(timer)
    }, [searchTerm])

    // The server searches, filters, sorts and pages, so only one page reaches the browser.
    React.useEffect(() => {
        let stale = false
        const params = new URLSearchParams({
            q: query,
            page: String(currentPage),
            page_size: String(PAGE_SIZE),
            sort: sort.key,
            direction: sort.direction,
        })
        for (const [key, value] of Object.entries(filters)) {
            if (value === true) params.set(key, "1")
            else if (value) params.set(key, String(value))
        }
        apiFetch(`/searchpatients?${params}`)
            .then(res => res.json())
            .then(data => {
                if (!stale) setResult(data && Array.isArray(data.patients) ? data : EMPTY_RESULT)
            })
        return () => { stale = true }
    }, [query, currentPage, filters, sort, reloadKey])

    function refetchPatients() {
        setReloadKey(key => key + 1)
    }

    function updateFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
        setFilters(current => ({ ...current, [key]: value }))
        setCurrentPage(1)
    }

    function toggleSort(key: SortKey) {
        setSort(current => current.key === key
            ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
            // Most recent visit first is the useful default for that column.
            : { key, direction: key === "last_visit" ? "desc" : "asc" })
        setCurrentPage(1)
    }

    function openAddPatient(studentId?: string) {
        setPrefillStudentId(studentId)
        setShowForm(true)
    }

    const activeFilterCount = Object.entries(filters).filter(([, value]) => value !== "" && value !== false).length
    const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE))
    const stats = result.stats

    function initials(patient: Patient) {
        const f = patient.first_name?.[0] ?? ""
        const l = patient.last_name?.[0] ?? ""
        return (f + l).toUpperCase() || "?"
    }

    return (
        <div className="min-h-full font-sans text-sage-900">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 ">
                <div>
                    <h1 className="text-[2rem] font-semibold tracking-tight m-0">Patients</h1>
                    <p className="text-sage-400 text-sm mt-1">Manage your patients and their medical records.</p>
                </div>
                <button
                    id="add-patient-btn"
                    onClick={() => openAddPatient()}
                    className="inline-flex items-center gap-2 self-start rounded-lg bg-brand-800 px-4 py-2.5 text-sm font-medium text-white shadow-md transition hover:bg-brand-900"
                >
                    <i className="bi bi-plus-lg" /> Add new patient
                </button>
            </div>

            <CheckIn
                onExistingPatient={(id) => navigate(`/patientdetails/${id}?visit=new`)}
                onNewPatient={openAddPatient}
            />

            <ClinicNow />

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
                <StatCard icon="bi-people" value={stats.total} label="Total Patients" />
                <StatCard icon="bi-building" value={stats.departments} label="Departments" />
                <StatCard icon="bi-gender-male" value={stats.male} label="Male" />
                <StatCard icon="bi-gender-female" value={stats.female} label="Female" />
                <StatCard
                    icon="bi-telephone-x" value={stats.missing_info} label="Missing contact or birthday" tone="rose"
                    active={filters.flag === "missing_info"}
                    onClick={() => updateFilter("flag", filters.flag === "missing_info" ? "" : "missing_info")}
                />
                <StatCard
                    icon="bi-arrow-repeat" value={stats.frequent} label="Frequent visitors (30 days)" tone="amber"
                    active={filters.flag === "frequent"}
                    onClick={() => updateFilter("flag", filters.flag === "frequent" ? "" : "frequent")}
                />
            </div>

            {showForm && (
                <AddPatient
                    initialStudentId={prefillStudentId}
                    hideForm={() => { setShowForm(false); setPrefillStudentId(undefined) }}
                    refetchPatients={refetchPatients}
                />
            )}

            <div className="rounded-2xl border border-sage-200 bg-white shadow-card overflow-hidden">
                <div className="flex flex-col gap-3 border-b border-sage-200 px-5 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="m-0 text-sm text-sage-500">
                            {filters.archived ? "Archived patients" : "Patients"} · {result.total} shown
                            {activeFilterCount > 0 && (
                                <button
                                    type="button"
                                    onClick={() => { setFilters(NO_FILTERS); setCurrentPage(1) }}
                                    className="ml-3 text-xs font-medium text-brand-800 hover:underline"
                                >
                                    Clear {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}
                                </button>
                            )}
                        </p>
                        <div className="flex w-full sm:w-64 items-center gap-2 rounded-full border border-sage-200 bg-sage-50 px-3 py-1.5 text-sage-400">
                            <i className="bi bi-search text-sm" />
                            <input
                                type="text"
                                placeholder="Search by name or ID"
                                aria-label="Search patients by name or ID"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full border-none bg-transparent text-sm text-sage-900 outline-none placeholder:text-sage-400"
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter patients">
                        <FilterSelect label="Department" value={filters.department}
                            onChange={v => { setFilters(current => ({ ...current, department: v, level: "", stage: "" })); setCurrentPage(1) }}
                            options={[["", "All departments"], ...departmentChoices(result.departments).map(d => [d, d] as [string, string])]} />
                        <FilterSelect label="Basic Education stage" value={filters.stage}
                            onChange={v => { setFilters(current => ({ ...current, stage: v, department: v ? "" : current.department, level: "" })); setCurrentPage(1) }}
                            options={[["", "All stages"], ...Object.entries(STAGES).map(([key, s]) => [key, s.label] as [string, string])]} />
                        {filters.department && (
                            <FilterSelect label="Level" value={filters.level} onChange={v => updateFilter("level", v)}
                                options={[["", "All levels"], ...levelOptions(filters.department).flatMap(g => g.options).map(([n, label]) => [String(n), label] as [string, string])]} />
                        )}
                        <FilterSelect label="Sex" value={filters.sex} onChange={v => updateFilter("sex", v)}
                            options={[["", "Any sex"], ["male", "Male"], ["female", "Female"]]} />
                        <FilterSelect label="Patient type" value={filters.patient_type} onChange={v => updateFilter("patient_type", v)}
                            options={[["", "Students and others"], ["student", "Students"], ["other", "Staff and visitors"]]} />
                        <FilterSelect label="Last visit" value={filters.visited_within} onChange={v => updateFilter("visited_within", v)}
                            options={[["", "Any time"], ["7", "Visited in 7 days"], ["30", "Visited in 30 days"]]} />
                        <FilterCheck label="Has allergies" checked={filters.has_allergies} onChange={v => updateFilter("has_allergies", v)} />
                        <FilterCheck label="Has conditions" checked={filters.has_conditions} onChange={v => updateFilter("has_conditions", v)} />
                        <FilterCheck label={`Archived (${stats.archived})`} checked={filters.archived} onChange={v => updateFilter("archived", v)} />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table id="patients-table" className="w-full border-collapse">
                        <thead>
                            <tr>
                                <th className="w-14 border-b border-sage-200 px-5 py-3"><span className="sr-only">Initials</span></th>
                                <SortHeader label="ID No" sortKey="student_id" sort={sort} onSort={toggleSort} className="w-32" />
                                <SortHeader label="Name" sortKey="name" sort={sort} onSort={toggleSort} />
                                <SortHeader label="Department" sortKey="department" sort={sort} onSort={toggleSort} />
                                <SortHeader label="Level" sortKey="level" sort={sort} onSort={toggleSort} />
                                <SortHeader label="Last visit" sortKey="last_visit" sort={sort} onSort={toggleSort} />
                                <SortHeader label="Sex" sortKey="sex" sort={sort} onSort={toggleSort} />
                            </tr>
                        </thead>
                        <tbody>
                            {result.patients.map(patient => (
                                <tr
                                    key={patient.patient_id}
                                    onClick={() => navigate(`/patientdetails/${patient.patient_id}`)}
                                    className="cursor-pointer transition hover:bg-sage-50"
                                >
                                    <td className="border-b border-sage-200 px-5 py-3 last:border-none">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-800">
                                            {initials(patient)}
                                        </div>
                                    </td>
                                    <td className="border-b border-sage-200 px-5 py-3 text-sm text-sage-400 last:border-none">
                                        {patient.student_id || <span className="text-xs">{patient.is_student ? "-" : "Non-student"}</span>}
                                    </td>
                                    <td className="border-b border-sage-200 px-5 py-3 text-sm font-medium last:border-none">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            {/* A real link, so keyboard and screen reader users can open the patient too. */}
                                            <Link
                                                to={`/patientdetails/${patient.patient_id}`}
                                                onClick={(e) => e.stopPropagation()}
                                                className="rounded text-inherit no-underline hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                                            >
                                                {patient.first_name} {patient.last_name}
                                            </Link>
                                            {patient.allergies && (
                                                <Badge tone="red" icon="bi-exclamation-octagon-fill" title={`Allergies: ${patient.allergies}`}>
                                                    Allergies
                                                </Badge>
                                            )}
                                            {patient.frequent_visitor && (
                                                <Badge tone="amber" icon="bi-arrow-repeat" title={`${patient.recent_visits} visits in the last 30 days`}>
                                                    {patient.recent_visits} visits / 30d
                                                </Badge>
                                            )}
                                            {patient.missing_info ? (
                                                <Badge tone="rose" icon="bi-telephone-x" title="No emergency contact phone or birthday on file">
                                                    Missing info
                                                </Badge>
                                            ) : null}
                                        </div>
                                    </td>
                                    <td className="border-b border-sage-200 px-5 py-3 text-sm text-sage-400 last:border-none">{patient.department}</td>
                                    <td className="border-b border-sage-200 px-5 py-3 last:border-none">
                                        {patient.level !== null && patient.level !== undefined && patient.level !== "" && (
                                            <span
                                                title={describeLevel(patient.department, patient.level, patient.strand)}
                                                className="inline-block whitespace-nowrap rounded-full border border-sage-200 bg-sage-50 px-2.5 py-1 text-xs"
                                            >
                                                {describeLevel(patient.department, patient.level, patient.strand, true)}
                                            </span>
                                        )}
                                    </td>
                                    <td className="border-b border-sage-200 px-5 py-3 text-sm text-sage-500 last:border-none">
                                        {patient.last_visit
                                            ? <time dateTime={patient.last_visit} title={patient.last_visit}>{relativeDate(patient.last_visit)}</time>
                                            : <span className="text-sage-300">Never</span>}
                                    </td>
                                    <td className="border-b border-sage-200 px-5 py-3 text-sm text-sage-400 last:border-none">{patient.sex}</td>
                                </tr>
                            ))}
                            {result.patients.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-5 py-8 text-center text-sm text-sage-400">
                                        No patients match that search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            </div>
        </div>
    )
}

/** The school's departments, plus any other names still found in older records. */
function departmentChoices(fromServer: string[]) {
    return [...DEPARTMENTS, ...fromServer.filter(d => !DEPARTMENTS.includes(d))]
}

/** Type or scan a student ID: opens the patient ready for a visit, or starts a new patient. */
function CheckIn({ onExistingPatient, onNewPatient }: {
    onExistingPatient: (patientId: string | number) => void
    onNewPatient: (studentId: string) => void
}) {
    const [studentId, setStudentId] = React.useState("")
    const [message, setMessage] = React.useState<{ text: string; studentId?: string } | null>(null)
    const [busy, setBusy] = React.useState(false)

    async function checkIn(event: React.FormEvent) {
        event.preventDefault()
        const id = studentId.trim()
        if (!id) return
        setBusy(true)
        setMessage(null)
        const result = await apiFetch(`/checkin?student_id=${encodeURIComponent(id)}`).then(res => res.json())
        setBusy(false)
        if (result?.status === "patient") {
            onExistingPatient(result.patient.patient_id)
        } else if (result?.status === "student") {
            setStudentId("")
            onNewPatient(id)
        } else if (result?.status === "not_found") {
            setMessage({ text: `No patient or student found with ID ${id}.`, studentId: id })
        }
    }

    return (
        // Wraps, so the "not found" notice gets its own line instead of squeezing the ID box.
        <form onSubmit={checkIn} className="mb-6 flex flex-col gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 p-4 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex flex-shrink-0 items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-800 text-white">
                    <i className="bi bi-upc-scan" aria-hidden="true" />
                </div>
                <div>
                    <p className="m-0 text-sm font-semibold text-brand-950">Check in a student</p>
                    <p className="m-0 text-xs text-brand-900/70">Scan or type their ID, then press Enter.</p>
                </div>
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:min-w-[18rem] sm:max-w-md">
                <label htmlFor="checkin-id" className="sr-only">Student ID</label>
                <input
                    id="checkin-id"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="Student ID"
                    value={studentId}
                    onChange={(e) => { setStudentId(e.target.value); setMessage(null) }}
                    className="min-w-0 flex-1 rounded-xl border border-brand-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
                <button
                    type="submit"
                    disabled={busy || !studentId.trim()}
                    className="flex-shrink-0 rounded-xl bg-brand-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-900 disabled:opacity-50"
                >
                    {busy ? "Checking..." : "Check in"}
                </button>
            </div>
            {message && (
                <p role="status" className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-900 sm:basis-full">
                    <i className="bi bi-exclamation-circle text-amber-700" aria-hidden="true" />
                    <span>{message.text}</span>
                    <button type="button" onClick={() => { setMessage(null); onNewPatient(message.studentId || "") }}
                        className="font-semibold text-brand-800 underline hover:text-brand-900">
                        Add them as a new patient
                    </button>
                </p>
            )}
        </form>
    )
}

function SortHeader({ label, sortKey, sort, onSort, className = "" }: {
    label: string
    sortKey: SortKey
    sort: { key: SortKey; direction: "asc" | "desc" }
    onSort: (key: SortKey) => void
    className?: string
}) {
    const active = sort.key === sortKey
    return (
        <th
            aria-sort={active ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}
            className={`border-b border-sage-200 px-5 py-3 text-left text-xs font-medium text-sage-400 ${className}`}
        >
            <button type="button" onClick={() => onSort(sortKey)} className="inline-flex items-center gap-1 hover:text-sage-700">
                {label}
                <i aria-hidden="true" className={`bi ${active ? (sort.direction === "asc" ? "bi-caret-up-fill" : "bi-caret-down-fill") : "bi-chevron-expand"} text-[10px]`} />
            </button>
        </th>
    )
}

function FilterSelect({ label, value, onChange, options }: {
    label: string
    value: string
    onChange: (value: string) => void
    options: [string, string][]
}) {
    return (
        <select
            aria-label={label}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`rounded-full border px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-brand-100 ${value ? "border-brand-300 bg-brand-50 text-brand-900" : "border-sage-200 bg-white text-sage-600"}`}
        >
            {options.map(([optionValue, text]) => <option key={optionValue} value={optionValue}>{text}</option>)}
        </select>
    )
}

function FilterCheck({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
    return (
        <label className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs ${checked ? "border-brand-300 bg-brand-50 text-brand-900" : "border-sage-200 bg-white text-sage-600"}`}>
            <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-brand-800" />
            {label}
        </label>
    )
}

const BADGE_TONES = {
    red: "bg-red-50 text-red-700 border-red-200",
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
}

function Badge({ tone, icon, title, children }: { tone: keyof typeof BADGE_TONES; icon: string; title: string; children: React.ReactNode }) {
    return (
        <span title={title} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${BADGE_TONES[tone]}`}>
            <i className={`bi ${icon}`} aria-hidden="true" />
            {children}
            <span className="sr-only">: {title}</span>
        </span>
    )
}

function relativeDate(value: string) {
    const then = new Date(value.replace(" ", "T"))
    if (Number.isNaN(then.getTime())) return value
    const days = Math.floor((Date.now() - then.getTime()) / 86_400_000)
    if (days <= 0) return "Today"
    if (days === 1) return "Yesterday"
    if (days < 30) return `${days} days ago`
    return then.toLocaleDateString()
}

function StatCard({ icon, value, label, tone, active, onClick }: {
    icon: string
    value: number
    label: string
    tone?: "rose" | "amber"
    active?: boolean
    onClick?: () => void
}) {
    const iconTone = tone === "rose" ? "bg-rose-50 text-rose-700" : tone === "amber" ? "bg-amber-50 text-amber-800" : "bg-brand-50 text-brand-800"
    const body = (
        <>
            <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-lg ${iconTone}`}>
                <i className={`bi ${icon}`} />
            </div>
            <div className="text-left">
                <div className="text-xl font-bold leading-none">{value}</div>
                <div className="mt-1 text-xs text-sage-400">{label}</div>
            </div>
        </>
    )
    const base = "flex items-center gap-3.5 rounded-2xl border bg-white p-4 shadow-card"
    if (!onClick) return <div className={`${base} border-sage-200`}>{body}</div>
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={`${base} transition hover:border-brand-300 ${active ? "border-brand-500 ring-2 ring-brand-100" : "border-sage-200"}`}
        >
            {body}
        </button>
    )
}
