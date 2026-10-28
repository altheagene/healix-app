import { apiFetch } from "../api";
import { useState, useEffect, useMemo } from "react";
import Pagination from "~/components/pagination";

export default function Records() {
    const [records, setRecords] = useState<any[]>([]);
    const [selectedVisit, setSelectedVisit] = useState<any | null>(null);
    const [medications, setMedications] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 10;

    useEffect(() => {
        apiFetch(`/getvisitlogs`)
            .then((res) => res.json())
            .then((data) => setRecords(data))
            .catch((err) => console.log(err));
    }, []);

    useEffect(() => {
        if (selectedVisit?.visit_id) {
            apiFetch(`/getmedicationdetails?idnum=${selectedVisit.visit_id}`)
                .then((res) => res.json())
                .then((data) => setMedications(data))
                .catch((err) => console.log(err));
        } else {
            setMedications([]);
        }
    }, [selectedVisit]);

    const filteredRecords = useMemo(() => {
        const query = searchTerm.toLowerCase()
        return records.filter((rec: any) => {
            const patientName = String(rec.patient_name ?? "").toLowerCase()
            const service = String(rec.service_name ?? "").toLowerCase()
            const visitId = String(rec.visit_id ?? "").toLowerCase()
            return patientName.includes(query) || service.includes(query) || visitId.includes(query)
        })
    }, [records, searchTerm])

    const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
    const paginatedRecords = filteredRecords.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const stats = useMemo(() => {
        const totalVisits = records.length;

        const uniquePatients = new Set(
            records.map((rec: any) => rec.patient_name).filter(Boolean)
        ).size;

        const today = new Date();
        const isSameDay = (d: Date) =>
            d.getFullYear() === today.getFullYear() &&
            d.getMonth() === today.getMonth() &&
            d.getDate() === today.getDate();

        const visitsToday = records.filter((rec: any) => {
            const d = new Date(rec.visit_datetime);
            return !isNaN(d.getTime()) && isSameDay(d);
        }).length;

        const serviceCounts: Record<string, number> = {};
        records.forEach((rec: any) => {
            const service = rec.service_name;
            if (!service) return;
            serviceCounts[service] = (serviceCounts[service] ?? 0) + 1;
        });
        let topServiceCount = 0;
        Object.values(serviceCounts).forEach((count) => {
            if (count > topServiceCount) topServiceCount = count;
        });
        const uniqueServices = Object.keys(serviceCounts).length;

        return { totalVisits, uniquePatients, visitsToday, uniqueServices, topServiceCount };
    }, [records]);

    return (
        <div className="min-h-full font-sans text-slate-900">
            <div className="mx-auto max-w-full">
                {/* HEADER */}
                <div className="mb-7">
                    <h1 className="text-[2rem] font-semibold tracking-tight">Visit Records</h1>
                    <p className="text-slate-500 text-sm mt-1">Browse past clinic visits and their details.</p>
                </div>

                {/* STAT CARDS */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <StatCard icon="bi-clipboard2-pulse" value={stats.totalVisits} label="Total Visits" />
                    <StatCard icon="bi-people" value={stats.uniquePatients} label="Unique Patients" />
                    <StatCard icon="bi-calendar-check" value={stats.visitsToday} label="Visits Today" />
                    <StatCard icon="bi-clipboard2-check" value={stats.uniqueServices} label="Services Offered" />
                </div>

                {/* TABLE */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-sm font-semibold text-slate-900">All visits</h2>
                            <p className="text-xs text-slate-400">{filteredRecords.length} of {records.length} shown</p>
                        </div>
                        <label className="flex w-full items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2 text-slate-400 focus-within:border-teal-300 focus-within:ring-2 focus-within:ring-teal-100 sm:w-72">
                            <i className="bi bi-search text-sm" />
                            <input
                                type="text"
                                placeholder="Search by patient, service or visit #"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                            />
                        </label>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50/60">
                                    <th className="w-24 border-b border-slate-100 px-5 py-3 text-left text-xs font-medium text-slate-400">Visit</th>
                                    <th className="w-48 border-b border-slate-100 px-5 py-3 text-left text-xs font-medium text-slate-400">Patient</th>
                                    <th className="border-b border-slate-100 px-5 py-3 text-left text-xs font-medium text-slate-400">Service</th>
                                    <th className="border-b border-slate-100 px-5 py-3 text-left text-xs font-medium text-slate-400">Date</th>
                                    <th className="border-b border-slate-100 px-5 py-3 text-right text-xs font-medium text-slate-400">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-12 text-center">
                                            <i className="bi bi-clipboard-x text-2xl text-slate-300" />
                                            <p className="mt-2 text-sm text-slate-400">
                                                {records.length === 0 ? "No visit records yet." : "No visits match that search."}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedRecords.map((rec: any) => (
                                        <tr
                                            key={rec.visit_id}
                                            onClick={() => setSelectedVisit(rec)}
                                            className="group cursor-pointer transition hover:bg-teal-50/40"
                                        >
                                            <td className="border-b border-slate-100 px-5 py-3 text-sm text-slate-400 last:border-none">
                                                #{rec.visit_id}
                                            </td>
                                            <td className="border-b border-slate-100 px-5 py-3 text-sm font-medium text-slate-900 last:border-none group-hover:text-teal-800">
                                                {rec.patient_name}
                                            </td>
                                            <td className="border-b border-slate-100 px-5 py-3 last:border-none">
                                                <span className="inline-flex items-center rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800 ring-1 ring-teal-200/60">
                                                    {rec.service_name}
                                                </span>
                                            </td>
                                            <td className="border-b border-slate-100 px-5 py-3 text-sm text-slate-500 last:border-none">
                                                {new Date(rec.visit_datetime).toLocaleString()}
                                            </td>
                                            <td className="border-b border-slate-100 px-5 py-3 text-right last:border-none">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setSelectedVisit(rec); }}
                                                    className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700"
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))
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

                {/* MODAL */}
                {selectedVisit && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
                        <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
                            {/* HEADER */}
                            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                                <h2 className="text-base font-semibold text-slate-900">Visit Log</h2>
                                <button
                                    onClick={() => setSelectedVisit(null)}
                                    className="flex h-8 w-8 items-center justify-center rounded-full text-xl leading-none text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                >
                                    ×
                                </button>
                            </div>

                            {/* BODY */}
                            <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
                                {/* VISIT INFO */}
                                <div className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm text-slate-700 sm:grid-cols-2">
                                    <div><span className="font-semibold text-slate-900">Patient:</span> {selectedVisit.patient_name}</div>
                                    <div><span className="font-semibold text-slate-900">Date:</span> {new Date(selectedVisit.visit_datetime).toLocaleString()}</div>
                                    <div><span className="font-semibold text-slate-900">Service:</span> {selectedVisit.service_name}</div>
                                    <div><span className="font-semibold text-slate-900">Weight:</span> {selectedVisit.Weight ?? "-"}</div>
                                    <div><span className="font-semibold text-slate-900">Temperature:</span> {selectedVisit.Temperature ?? "-"}</div>
                                    <div><span className="font-semibold text-slate-900">Staff:</span> {selectedVisit.staff_name}</div>
                                </div>

                                {/* NOTES */}
                                <div className="mt-5 border-t border-slate-100 pt-4">
                                    <h3 className="text-sm font-semibold text-slate-900 mb-1.5">Notes</h3>
                                    <p className="text-sm text-slate-500">{selectedVisit.notes || "No notes available."}</p>
                                </div>

                                {/* MEDICATIONS */}
                                <div className="mt-5 border-t border-slate-100 pt-4">
                                    <h3 className="text-sm font-semibold text-slate-900 mb-2">Medications</h3>
                                    {medications?.length > 0 ? (
                                        <ul className="space-y-1.5">
                                            {medications.map((med: any) => (
                                                <li key={med.supply_name} className="flex items-center gap-2 text-sm text-slate-700">
                                                    {med.quantity > 0 && (
                                                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">
                                                            {med.quantity}×
                                                        </span>
                                                    )}
                                                    <span>{med.supply_name}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-slate-500">No medications prescribed.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
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