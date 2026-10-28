import { apiFetch } from "../api";
import { useParams } from "react-router"
import React from "react"
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function AddRecord(props:any){

    const {id} = useParams()
    const now = new Date()
    const [services, setServices] = React.useState<any[]>()
    const [staff, setStaff] = React.useState<any[]>()
    const [newService, setNewService] = React.useState("");

    const [recordDetails, setRecordDetails] = React.useState<any>({
        patient_id: id,
        appointment_id: null,
        weight: '',
        temperature: '',
        visit_datetime : now.toISOString().replace('T', ' ').slice(0, 19),
        service_id: 1,
        staff_id: 0,
        notes: '',
        complaint: '',
        assessment: '',
        treatment: '',
    })
    const [medicines, setMedicine] = React.useState<any[]>();
    const [medications, setMedications] = React.useState<{ supply_id: number | null; auto_deduct: false | true; quantity: number }[]>([]);

    React.useEffect(() => {
        apiFetch(`/getallservices`)
        .then(res => res.json())
        .then(data => setServices(data))

        apiFetch(`/getstaffandcateg`)
        .then(res => res.json())
        .then(data => setStaff(data))

        apiFetch(`/getallmedicine`)
        .then(res => res.json())
        .then(data => setMedicine(data))
    }, [])

    React.useEffect(() => {
    if (staff && staff.length > 0) {
        setRecordDetails({...recordDetails,staff_id: staff[0].staff_id});
    }
    }, [staff]);

    async function addServiceInline() {
        if (!newService.trim()) return;

        const res = await apiFetch(`/addservice`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ service_name: newService.trim() })
        });

        const result = await res.json();

        // reload services
        const refreshed = await apiFetch(`/getallservices`)
            .then(r => r.json());

        setServices(refreshed);

        // auto-select newly added service (assuming backend returns id)
        if (result?.service_id) {
            setRecordDetails({
                ...recordDetails,
                service_id: result.service_id
            });
        }

        setNewService("");
    }

    async function handleSubmit(){
        // A visit needs a reason: the complaint, or failing that some notes.
        if (!recordDetails?.complaint?.trim() && !recordDetails?.notes?.trim()) {
            alert('Please fill in the chief complaint.')
            return;
        }
        const response = await apiFetch(`/addvisitlog`,
            {
                method: 'POST',
                headers: {
                    'Content-Type' : 'application/json'
                },
                // The visit and its medicines are saved together, all or nothing.
                body: JSON.stringify({ ...recordDetails, medications })
            }
        )
        const result = await response.json()
        if (!response.ok || !result.visit_id) {
            alert(result.error || 'Failed to save the visit')
            return
        }

        props.hideForm()
        props.refetch()
    }

    function addMedication() {
            setMedications([...medications, { supply_id: medicines?.[0]?.supply_id, auto_deduct: medicines?.[0]?.auto_deduct, quantity: 1 }]
        );
    }

    function updateMedication(
        index: number,
        field: "supply_id" | "quantity",
        value: any
    ) {
        const updated: any = [...medications];
        updated[index][field] = value;
        if (field === "supply_id"){
             const med = medicines?.find(m => m.supply_id === parseInt(value))
            if (med.auto_deduct === 0){
                updated[index]['auto_deduct'] = false;
                updated[index]['quantity'] = 0
            }else{
                updated[index]['auto_deduct'] = true;
            }
        }

        setMedications(updated);
    }

    function removeMedication(index: number) {
        setMedications(medications.filter((_, i) => i !== index));
    }

    const inputClasses = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-teal-300 focus:ring-2 focus:ring-teal-100";
    const labelClasses = "mb-1.5 block text-xs font-medium text-slate-500";

    return(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">

                {/* HEADER */}
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <h2 className="text-base font-semibold text-slate-900">Visit Log</h2>
                    <button
                        onClick={props.hideForm}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-xl leading-none text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                        ×
                    </button>
                </div>

                {/* SCROLLABLE BODY */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

                    <div>
                        <label className={labelClasses}>Date <span className="text-red-500">*</span></label>
                        <input
                            type="date"
                            value={new Date().toISOString().split("T")[0]}
                            className={inputClasses}
                        />
                    </div>

                    <div>
                        <label className={labelClasses}>Service <span className="text-red-500">*</span></label>
                        <select
                            value={recordDetails.service_id}
                            onChange={(e) =>
                                setRecordDetails({
                                    ...recordDetails,
                                    service_id: parseInt(e.target.value)
                                })
                            }
                            className={inputClasses}
                        >
                            {services?.map(service => (
                                <option key={service.service_id} value={service.service_id}>
                                    {service.service_name}
                                </option>
                            ))}
                        </select>

                        <div className="mt-2 flex items-center gap-2">
                            <input
                                type="text"
                                placeholder="Add new service"
                                value={newService}
                                onChange={(e) => setNewService(e.target.value)}
                                className={inputClasses}
                            />
                            <button
                                type="button"
                                onClick={addServiceInline}
                                className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                            >
                                <i className="bi bi-plus-lg" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                        <div>
                            <label className={labelClasses} htmlFor="weight">Weight</label>
                            <input
                                type="text"
                                id="weight"
                                value={recordDetails?.weight}
                                onChange={(e) => setRecordDetails({...recordDetails, weight: e.target.value})}
                                className={inputClasses}
                            />
                        </div>
                        <div>
                            <label className={labelClasses} htmlFor="temp">Temperature</label>
                            <input
                                type="text"
                                id="temp"
                                value={recordDetails?.temperature}
                                onChange={(e) => setRecordDetails({...recordDetails, temperature: e.target.value})}
                                className={inputClasses}
                            />
                        </div>
                    </div>

                    <div>
                        <label className={labelClasses} htmlFor="complaint">Chief complaint <span className="text-red-500">*</span></label>
                        <input
                            id="complaint"
                            type="text"
                            placeholder="e.g. Headache, fever, sprained ankle"
                            value={recordDetails?.complaint || ''}
                            onChange={(e) => setRecordDetails({...recordDetails, complaint: e.target.value})}
                            className={inputClasses}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                        <div>
                            <label className={labelClasses} htmlFor="assessment">Assessment</label>
                            <textarea
                                id="assessment"
                                rows={2}
                                value={recordDetails?.assessment || ''}
                                onChange={(e) => setRecordDetails({...recordDetails, assessment: e.target.value})}
                                className={inputClasses}
                            />
                        </div>
                        <div>
                            <label className={labelClasses} htmlFor="treatment">Treatment</label>
                            <textarea
                                id="treatment"
                                rows={2}
                                value={recordDetails?.treatment || ''}
                                onChange={(e) => setRecordDetails({...recordDetails, treatment: e.target.value})}
                                className={inputClasses}
                            />
                        </div>
                    </div>

                    {props.allergies && props.allergies.length > 0 && (
                        <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800">
                            <i className="bi bi-exclamation-octagon-fill mt-0.5" aria-hidden="true" />
                            <p className="m-0">
                                <span className="font-semibold">Allergic to {props.allergies.map((a: any) => a.allergy_name).join(', ')}.</span>
                                {' '}Check every medicine below against this.
                            </p>
                        </div>
                    )}

                    {medicines && medicines.length > 0 && (
                        <div>
                            <label className={labelClasses}>Medications</label>

                            <div className="space-y-2">
                                {medications.map((med, index) => {
                                    const medicineInfo = medicines?.find(m => m.supply_id === parseInt(med.supply_id as any))
                                    return (
                                        <div key={index} className="flex items-end gap-2 rounded-xl border border-slate-200 p-3">
                                            <div className="flex-1">
                                                <label className="mb-1 block text-[11px] font-medium text-slate-400">Medicine</label>
                                                <select
                                                    value={med.supply_id ?? ""}
                                                    onChange={(e) => updateMedication(index, 'supply_id', e.target.value)}
                                                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
                                                >
                                                    {medicines?.map(m => (
                                                        <option key={m.supply_id} value={m.supply_id}>{m.supply_name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="w-28">
                                                <label className="mb-1 block text-[11px] font-medium text-slate-400">Quantity</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max={medicineInfo?.available_stock}
                                                    value={med.quantity}
                                                    onChange={(e) => updateMedication(index, "quantity", parseInt(e.target.value) > medicineInfo?.available_stock ? medicineInfo?.available_stock : parseInt(e.target.value))}
                                                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
                                                />
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => removeMedication(index)}
                                                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50"
                                            >
                                                <i className="bi bi-trash" />
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>

                            <button
                                type="button"
                                onClick={addMedication}
                                className="mt-2 flex items-center gap-1.5 text-sm font-medium text-teal-900 transition hover:text-teal-800"
                            >
                                <i className="bi bi-plus-lg" /> Add medication
                            </button>
                        </div>
                    )}

                    <div>
                        <label className={labelClasses}>Staff <span className="text-red-500">*</span></label>
                        <select
                            value={recordDetails?.staff_id}
                            onChange={(e) => setRecordDetails({...recordDetails, staff_id: parseInt(e.target.value)})}
                            className={inputClasses}
                        >
                            {staff?.map(person => (
                                <option key={person.staff_id} value={person.staff_id}>{person.first_name} {person.last_name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className={labelClasses} htmlFor="notes">Other notes</label>
                        <textarea
                            id="notes"
                            rows={3}
                            value={recordDetails?.notes}
                            onChange={(e) => setRecordDetails({...recordDetails, notes: e.target.value})}
                            className={inputClasses}
                        />
                    </div>
                </div>

                {/* FOOTER */}
                <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
                    <button
                        onClick={props.hideForm}
                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="rounded-xl bg-teal-800 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-teal-900"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    )
}