import { apiFetch } from "../api";
import React from "react";
import { useNavigate } from "react-router";

const HOURS = [9, 10, 11, 12, 13, 14]
const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const BAR_TONES = [
    { bg: "bg-citron-300", text: "text-brand-800" },
    { bg: "bg-leaf-400", text: "text-brand-800" },
    { bg: "bg-brand-800", text: "text-white" },
]

function dateKey(value?: string) {
    if (!value) return ""
    return String(value).slice(0, 10)
}

function parseHour(time?: string) {
    if (!time) return 9
    const match = String(time).match(/(\d{1,2})/)
    let hour = match ? Number(match[1]) : 9
    if (/pm/i.test(String(time)) && hour < 12) hour += 12
    if (/am/i.test(String(time)) && hour === 12) hour = 0
    return hour
}

function formatTime(time?: string) {
    if (!time) return ""
    return String(time).replace(/^0/, "")
}

function startOfWeek(date: Date) {
    const start = new Date(date)
    const day = start.getDay()
    const offset = day === 0 ? -6 : 1 - day
    start.setDate(start.getDate() + offset)
    start.setHours(0, 0, 0, 0)
    return start
}

function addDays(date: Date, days: number) {
    const next = new Date(date)
    next.setDate(next.getDate() + days)
    return next
}

function toKey(date: Date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
}

function monthName(date: Date) {
    return date.toLocaleString("en-US", { month: "long" })
}

export default function Dashboard() {
    const navigate = useNavigate()
    const [search, setSearch] = React.useState("")
    const [visits, setVisits] = React.useState<any[]>([])
    const [appointments, setAppointments] = React.useState<any[]>([])
    const [supplies, setSupplies] = React.useState<any[]>([])

    React.useEffect(() => {
        apiFetch(`/getvisitlogs`).then(res => res.json()).then(setVisits)
        apiFetch(`/getallappointments`).then(res => res.json()).then(setAppointments)
        apiFetch(`/getallsupplies`).then(res => res.json()).then(setSupplies)
    }, [])

    const today = React.useMemo(() => new Date(), [])
    const todayKey = toKey(today)

    const dayCards = React.useMemo(() => {
        const keys = new Set<string>()
        visits.forEach(v => { const key = dateKey(v.visit_datetime); if (key) keys.add(key) })
        appointments.forEach(a => { const key = dateKey(a.appointment_date); if (key) keys.add(key) })
        const recent = [...keys].sort().slice(-3)
        while (recent.length < 3) recent.unshift(toKey(addDays(today, recent.length - 3)))
        return recent.map((key, index) => {
            const date = new Date(`${key}T00:00:00`)
            const dayVisits = visits.filter(v => dateKey(v.visit_datetime) === key)
            const dayAppts = appointments.filter(a => dateKey(a.appointment_date) === key)
            const followUps = dayAppts.filter(a => String(a.status).toLowerCase() === "upcoming").length
            const tones = [
                { card: "bg-citron-200 text-brand-800 divide-citron-400", label: "text-sage-600" },
                { card: "bg-leaf-400 text-brand-800 divide-leaf-500", label: "text-brand-800/70" },
                { card: "bg-brand-800 text-white divide-white/15", label: "text-white/70" },
            ][index]
            return {
                key,
                day: date.getDate(),
                weekday: date.toLocaleString("en-US", { weekday: "long" }),
                patientsSeen: dayVisits.length,
                appointments: dayAppts.length,
                followUps,
                ...tones,
            }
        })
    }, [appointments, today, visits])

    const monthStats = React.useMemo(() => {
        const latest = [...appointments, ...visits]
            .map(item => new Date(item.appointment_date || item.visit_datetime || ""))
            .filter(d => !Number.isNaN(d.getTime()))
            .sort((a, b) => b.getTime() - a.getTime())[0] || today
        const month = latest.getMonth()
        const year = latest.getFullYear()
        const inMonth = (value?: string) => {
            const d = new Date(value || "")
            return d.getMonth() === month && d.getFullYear() === year
        }
        const monthVisits = visits.filter(v => inMonth(v.visit_datetime))
        const monthAppts = appointments.filter(a => inMonth(a.appointment_date))
        const completed = monthAppts.filter(a => String(a.status).toLowerCase() === "completed").length
        const inStock = supplies.filter(s => Number(s.total_stock) > 0).length
        const visitPct = Math.round((monthVisits.length / Math.max(monthAppts.length || monthVisits.length, 1)) * 100)
        const completedPct = Math.round((completed / Math.max(monthAppts.length, 1)) * 100)
        const stockPct = Math.round((inStock / Math.max(supplies.length, 1)) * 100)
        const overall = Math.round((visitPct + completedPct + stockPct) / 3)
        return {
            title: `Statistics on ${monthName(latest)}`,
            visitPct: Math.min(visitPct, 100),
            completedPct: Math.min(completedPct, 100),
            stockPct: Math.min(stockPct, 100),
            overall: Math.min(overall, 100),
        }
    }, [appointments, supplies, today, visits])

    const weekDays = React.useMemo(() => {
        const upcoming = appointments
            .filter(a => dateKey(a.appointment_date) >= todayKey && String(a.status).toLowerCase() !== "cancelled")
            .sort((a, b) => dateKey(a.appointment_date).localeCompare(dateKey(b.appointment_date)))
        const recent = [...appointments].sort((a, b) => dateKey(b.appointment_date).localeCompare(dateKey(a.appointment_date)))[0]
        const focus = upcoming[0]?.appointment_date || recent?.appointment_date
        const start = startOfWeek(focus ? new Date(`${dateKey(focus)}T00:00:00`) : today)
        return DAY_LABELS.map((label, index) => {
            const date = addDays(start, index)
            const key = toKey(date)
            const items = appointments
                .filter(a => dateKey(a.appointment_date) === key)
                .map((a, i) => ({
                    id: a.appointment_id,
                    title: a.service_name || a.patient_name,
                    hour: parseHour(a.start_time),
                    tone: BAR_TONES[i % BAR_TONES.length],
                }))
            return { label, key, items }
        })
    }, [appointments, today])

    const todaysSchedule = React.useMemo(() => {
        const todayItems = appointments.filter(a => dateKey(a.appointment_date) === todayKey)
        const upcomingItems = appointments.filter(a => dateKey(a.appointment_date) >= todayKey)
        const source = todayItems.length > 0
            ? todayItems
            : upcomingItems.length > 0
                ? upcomingItems
                : appointments
        return [...source]
            .sort((a, b) => dateKey(a.appointment_date).localeCompare(dateKey(b.appointment_date)) || parseHour(a.start_time) - parseHour(b.start_time))
            .slice(0, 6)
    }, [appointments, todayKey])

    function submitSearch(event: React.FormEvent) {
        event.preventDefault()
        const query = search.trim()
        navigate(query ? `/patients?q=${encodeURIComponent(query)}` : "/patients")
    }

    return (
        <div className="min-h-full bg-white font-sans text-brand-800">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="m-0 text-[2rem] font-semibold tracking-tight">Clinic Dashboard</h1>
                    <p className="mt-1 text-sm text-sage-500">Let's check today's clinic activity</p>
                </div>
                <form onSubmit={submitSearch} className="flex w-full items-center gap-2 rounded-full bg-sage-100 px-4 py-2.5 text-sage-500 sm:w-72">
                    <i className="bi bi-search text-sm" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search for a student..."
                        className="w-full border-none bg-transparent text-sm text-brand-800 outline-none placeholder:text-sage-400"
                    />
                </form>
            </div>

            <div className="grid gap-8 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.9fr)]">
                <div className="flex flex-col gap-3">
                    {dayCards.map(card => (
                        <div key={card.key} className={`flex items-center overflow-hidden rounded-[28px] shadow-card ${card.card}`}>
                            <div className="date-tab flex h-full min-w-[118px] flex-col justify-center bg-white px-5 py-5 text-brand-800">
                                <span className="text-xs text-sage-500">{card.weekday}</span>
                                <span className="text-[2rem] font-semibold leading-none">{card.day}</span>
                            </div>
                            <div className="grid flex-1 grid-cols-3 divide-x">
                                <Metric label="Patients Seen" value={card.patientsSeen} muted={card.label} />
                                <Metric label="Appointments" value={card.appointments} muted={card.label} />
                                <Metric label="Follow-ups" value={card.followUps} muted={card.label} />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="px-2 py-1">
                    <h2 className="mb-5 text-lg font-semibold">{monthStats.title}</h2>
                    <div className="mb-8 flex justify-center">
                        <ProgressRing percent={monthStats.overall} />
                    </div>
                    <div className="space-y-5">
                        <StatBar label="Visits" value={monthStats.visitPct} />
                        <StatBar label="Completed Checkups" value={monthStats.completedPct} />
                        <StatBar label="Medicine Stock" value={monthStats.stockPct} />
                    </div>
                </div>
            </div>

            <div className="mt-10 grid gap-10 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.9fr)]">
                <div>
                    <h2 className="mb-5 text-lg font-semibold">Upcoming Appointments</h2>
                    <div className="grid grid-cols-[88px_repeat(6,minmax(0,1fr))] text-center text-[11px] text-sage-400">
                        <div />
                        {HOURS.map(hour => (
                            <div key={hour} className="pb-3">{String(hour).padStart(2, "0")}:00</div>
                        ))}
                    </div>
                    <div className="space-y-4">
                        {weekDays.map(day => (
                            <div key={day.key} className="grid grid-cols-[88px_repeat(6,minmax(0,1fr))] items-center">
                                <div className="text-xs text-sage-500">{day.label}</div>
                                <div className="relative col-span-6 h-8">
                                    <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-sage-200" />
                                    {day.items.map(item => {
                                        const start = Math.min(Math.max(item.hour, 9), 14)
                                        const left = ((start - 9) / 6) * 100
                                        return (
                                            <div
                                                key={item.id}
                                                className={`timeline-tab absolute top-0 flex h-8 items-center px-3 text-[11px] font-medium ${item.tone.bg} ${item.tone.text}`}
                                                style={{ left: `${left}%`, width: "15%" }}
                                                title={item.title}
                                            >
                                                <span className="truncate">{item.title}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h2 className="mb-5 text-lg font-semibold">Today's Schedule</h2>
                    <div className="space-y-5">
                        {todaysSchedule.length > 0 ? todaysSchedule.map(item => (
                            <div key={item.appointment_id} className="flex items-center gap-3">
                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-sage-300 text-brand-800">
                                    <i className="bi bi-heart-pulse" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold">{item.patient_name}</p>
                                    <p className="truncate text-xs text-sage-500">{item.service_name || "Clinic visit"}</p>
                                </div>
                                <p className="text-xs font-medium text-brand-800">{formatTime(item.start_time)}</p>
                            </div>
                        )) : (
                            <p className="text-sm text-sage-500">No upcoming appointments.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function Metric({ label, value, muted }: { label: string; value: number; muted: string }) {
    return (
        <div className="px-5 py-4">
            <p className={`text-xs ${muted}`}>{label}</p>
            <p className="mt-1 text-2xl font-semibold leading-none">{value}</p>
        </div>
    )
}

function StatBar({ label, value }: { label: string; value: number }) {
    return (
        <div>
            <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-sage-600">{label}</span>
                <span className="font-medium">{value}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-sage-100">
                <div className="h-full rounded-full bg-leaf-400" style={{ width: `${value}%` }} />
            </div>
        </div>
    )
}

function ProgressRing({ percent }: { percent: number }) {
    const radius = 52
    const circ = 2 * Math.PI * radius
    const offset = circ * (1 - percent / 100)
    return (
        <div className="relative h-36 w-36">
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                <circle cx="60" cy="60" r={radius} fill="none" stroke="#eef3ee" strokeWidth="8" />
                <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke="#7dcf8a"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circ}
                    strokeDashoffset={offset}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-2xl text-brand-800">
                <i className="bi bi-heart-pulse" />
            </div>
        </div>
    )
}
