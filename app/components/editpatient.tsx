import { apiFetch } from "../api";
import type { Allergy, Condition } from "../types";
import React from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { ModalForm } from "./form";
import PatientFields, { missingPatientFields } from "./patientfields";
import { useTagList } from "./tagpicker";
import { notify } from "../notify";

export default function EditPatient(props: any) {
  const [studentData, setStudentData] = React.useState<Record<string, any>>(props.studentData || {});
  // What the patient had when the form opened, so saving sends only what changed.
  const initialAllergies = React.useMemo(() => (props.allergies || []).map((a: Allergy) => a.allergy_id) as number[], [props.allergies]);
  const initialConditions = React.useMemo(() => (props.conditions || []).map((c: Condition) => c.condition_id) as number[], [props.conditions]);
  const [selectedAllergy, setSelectedAllergy] = React.useState<number[]>(initialAllergies);
  const [selectedCondition, setSelectedCondition] = React.useState<number[]>(initialConditions);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const allergies = useTagList("allergy");
  const conditions = useTagList("condition");
  const isStudent = Boolean(studentData?.is_student);

  async function post(path: string, body: object) {
    const response = await apiFetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json().catch(() => ({}));
    return response.ok && result.success !== false;
  }

  async function save() {
    const missing = missingPatientFields(studentData, isStudent);
    if (missing.length) return setError(`Please fill in: ${missing.join(', ')}.`);

    setSaving(true);
    setError('');
    const response = await apiFetch(`/updatepatient`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(studentData),
    }).catch(() => null);
    const result = await response?.json().catch(() => ({}));
    if (!response?.ok || !result?.success) {
      setSaving(false);
      setError(result?.error || "Could not save these changes.");
      return;
    }

    const id = studentData.patient_id;
    const added = (now: number[], before: number[]) => now.filter(x => !before.includes(x));
    const steps = [
      added(selectedAllergy, initialAllergies).length && post("/addallergies", { patient_id: id, allergies: added(selectedAllergy, initialAllergies) }),
      added(initialAllergies, selectedAllergy).length && post("/deletepatientallergies", { patient_id: id, allergies: added(initialAllergies, selectedAllergy) }),
      added(selectedCondition, initialConditions).length && post("/addconditions", { patient_id: id, conditions: added(selectedCondition, initialConditions) }),
      added(initialConditions, selectedCondition).length && post("/deletepatientconditions", { patient_id: id, conditions: added(initialConditions, selectedCondition) }),
    ];
    const outcomes = await Promise.all(steps.map(step => step || true));
    setSaving(false);
    if (outcomes.includes(false)) {
      notify("Details saved, but some allergies or conditions could not be updated. Please check them.", "error");
    } else {
      notify("Patient details saved.");
    }
    props.refetch();
    props.hideForm();
  }

  return (
    <ModalForm title="Edit patient" onClose={props.hideForm} onSubmit={save} submitLabel="Save changes" saving={saving}
      error={error} width={720}>
      <PatientFields data={studentData} isStudent={isStudent}
        onChange={(patch) => setStudentData(current => ({ ...current, ...patch }))}
        allergies={{ options: allergies.options, selected: selectedAllergy, onChange: setSelectedAllergy, onCreate: allergies.create }}
        conditions={{ options: conditions.options, selected: selectedCondition, onChange: setSelectedCondition, onCreate: conditions.create }} />
    </ModalForm>
  );
}
