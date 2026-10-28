import { apiFetch } from "../api";
import React from "react";

export default function ViewVisit(props: any) {
  const [visitInfo, setVisitInfo] = React.useState<any>(false);
  const [medicationDetails, setMedicationDetails] = React.useState<any[]>([]);

  React.useEffect(() => {
    setVisitInfo(props.visit);
  }, [props.visit]);

  React.useEffect(() => {
    if (visitInfo) {
      apiFetch(`/getmedicationdetails?idnum=${visitInfo?.visit_id}`)
        .then(res => res.json())
        .then(data => setMedicationDetails(data));
    }
  }, [visitInfo]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">

        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">Visit Log</h2>
          <button
            onClick={props.hideForm}
            className="flex h-8 w-8 items-center justify-center rounded-full text-xl leading-none text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            ×
          </button>
        </div>

        {/* BODY */}
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">

          {/* VISIT INFO */}
          <div className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm text-slate-700 sm:grid-cols-2">
            <div><span className="font-semibold text-slate-900">Patient:</span> {visitInfo?.patient_name}</div>
            <div><span className="font-semibold text-slate-900">Date:</span> {visitInfo?.visit_datetime ? new Date(visitInfo.visit_datetime).toLocaleString() : ""}</div>
            <div><span className="font-semibold text-slate-900">Service:</span> {visitInfo?.service_name}</div>
            <div><span className="font-semibold text-slate-900">Weight:</span> {visitInfo?.Weight ?? "-"}</div>
            <div><span className="font-semibold text-slate-900">Temperature:</span> {visitInfo?.Temperature ?? "-"}</div>
            <div><span className="font-semibold text-slate-900">Staff:</span> {visitInfo?.staff_name}</div>
          </div>

          {(visitInfo?.complaint || visitInfo?.assessment || visitInfo?.treatment) && (
            <div className="mt-5 space-y-1.5 border-t border-slate-100 pt-4 text-sm text-slate-700">
              {visitInfo?.complaint && <p className="m-0"><span className="font-semibold text-slate-900">Complaint:</span> {visitInfo.complaint}</p>}
              {visitInfo?.assessment && <p className="m-0"><span className="font-semibold text-slate-900">Assessment:</span> {visitInfo.assessment}</p>}
              {visitInfo?.treatment && <p className="m-0"><span className="font-semibold text-slate-900">Treatment:</span> {visitInfo.treatment}</p>}
            </div>
          )}

          {/* NOTES */}
          <div className="mt-5 border-t border-slate-100 pt-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-1.5">Notes</h3>
            <p className="text-sm text-slate-500">{visitInfo?.notes || "No notes available."}</p>
          </div>

          {/* MEDICATIONS */}
          <div className="mt-5 border-t border-slate-100 pt-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">Medications</h3>
            {medicationDetails?.length > 0 ? (
              <ul className="space-y-1.5">
                {medicationDetails.map(med => (
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
  );
}