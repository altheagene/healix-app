import { apiFetch } from "../api";
import React from "react";
import Modal from "./modal";
import { DISPOSITIONS, NOTIFY_METHODS, visitDateParts } from "../visitOutcomes";

/**
 * Details of one visit. Pass `visit` when the full record is already loaded (the patient
 * page), or `visitId` to load it (the Visit Records list carries no notes or vitals).
 */
export default function ViewVisit(props: { visit?: any; visitId?: number; hideForm: () => void }) {
  const [visitInfo, setVisitInfo] = React.useState<any>(props.visit ?? null);
  const [medicationDetails, setMedicationDetails] = React.useState<any[]>([]);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (props.visit) {
      setVisitInfo(props.visit);
    } else if (props.visitId) {
      apiFetch(`/getvisit?idnum=${props.visitId}`).then(async res => {
        const data = await res.json();
        if (res.ok && data.visit_id) setVisitInfo(data);
        else setError(data.error || "Could not load this visit.");
      });
    }
  }, [props.visit, props.visitId]);

  React.useEffect(() => {
    if (visitInfo?.visit_id) {
      apiFetch(`/getmedicationdetails?idnum=${visitInfo.visit_id}`)
        .then(res => res.json())
        .then(data => setMedicationDetails(Array.isArray(data) ? data : []));
    }
  }, [visitInfo?.visit_id]);

  const when = visitDateParts(visitInfo?.visit_datetime);

  return (
    <Modal title="Visit details" onClose={props.hideForm} width={560}>
      <div className="overflow-y-auto px-6 py-5">
        {error && <p role="alert" className="m-0 text-sm text-red-700">{error}</p>}
        {!visitInfo && !error && <p className="m-0 text-sm text-slate-500">Loading...</p>}

        {visitInfo && (
          <>
            <dl className="m-0 grid grid-cols-1 gap-x-6 gap-y-2 text-sm text-slate-700 sm:grid-cols-2">
              <Row label="Patient" value={visitInfo.patient_name} />
              <Row label="Date" value={`${when.date}${when.time ? ` · ${when.time}` : ""}`} />
              <Row label="Service" value={visitInfo.service_name} />
              <Row label="Attending" value={visitInfo.staff_name} />
              <Row label="Weight" value={visitInfo.Weight} />
              <Row label="Temperature" value={visitInfo.Temperature} />
            </dl>

            {(visitInfo.complaint || visitInfo.assessment || visitInfo.treatment) && (
              <section className="mt-5 space-y-1.5 border-t border-slate-100 pt-4 text-sm text-slate-700">
                {visitInfo.complaint && <p className="m-0"><span className="font-semibold text-slate-900">Complaint:</span> {visitInfo.complaint}</p>}
                {visitInfo.assessment && <p className="m-0"><span className="font-semibold text-slate-900">Assessment:</span> {visitInfo.assessment}</p>}
                {visitInfo.treatment && <p className="m-0"><span className="font-semibold text-slate-900">Treatment:</span> {visitInfo.treatment}</p>}
              </section>
            )}

            {(visitInfo.disposition || visitInfo.time_in) && (
              <section className="mt-5 space-y-1.5 border-t border-slate-100 pt-4 text-sm text-slate-700">
                <p className="m-0"><span className="font-semibold text-slate-900">Outcome:</span>{" "}
                  {visitInfo.disposition ? DISPOSITIONS[visitInfo.disposition] || visitInfo.disposition : "Still in the clinic"}
                  {visitInfo.referred_to ? ` (${visitInfo.referred_to})` : ""}
                </p>
                {visitInfo.time_in && (
                  <p className="m-0"><span className="font-semibold text-slate-900">In / out:</span> {visitDateParts(visitInfo.time_in).time}
                    {visitInfo.time_out ? ` to ${visitDateParts(visitInfo.time_out).time}` : ""}</p>
                )}
                {visitInfo.picked_up_by && <p className="m-0"><span className="font-semibold text-slate-900">Picked up by:</span> {visitInfo.picked_up_by}</p>}
                <p className="m-0"><span className="font-semibold text-slate-900">Parent notified:</span>{" "}
                  {visitInfo.parent_notified
                    ? `Yes, by ${(NOTIFY_METHODS[visitInfo.notified_method] || visitInfo.notified_method || "").toLowerCase()} at ${visitDateParts(visitInfo.notified_at).time}${visitInfo.notified_by ? ` (${visitInfo.notified_by})` : ""}`
                    : "No"}
                </p>
              </section>
            )}

            <section className="mt-5 border-t border-slate-100 pt-4">
              <h3 className="m-0 mb-1.5 text-sm font-semibold text-slate-900">Notes</h3>
              <p className="m-0 whitespace-pre-line text-sm text-slate-500">{visitInfo.notes || "No notes."}</p>
            </section>

            <section className="mt-5 border-t border-slate-100 pt-4">
              <h3 className="m-0 mb-2 text-sm font-semibold text-slate-900">Medicines</h3>
              {medicationDetails.length > 0 ? (
                <ul className="m-0 list-none space-y-1.5 p-0">
                  {medicationDetails.map(med => (
                    <li key={med.supply_name} className="flex items-center gap-2 text-sm text-slate-700">
                      {med.quantity > 0 && (
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">{med.quantity}×</span>
                      )}
                      <span>{med.supply_name}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="m-0 text-sm text-slate-500">No medicines given.</p>
              )}
            </section>
          </>
        )}
      </div>
    </Modal>
  );
}

function Row({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <dt className="inline font-semibold text-slate-900">{label}: </dt>
      <dd className="inline">{value === null || value === undefined || value === "" ? "-" : value}</dd>
    </div>
  )
}
