import { apiFetch } from "../api";
import React from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { ChoiceGroup, Field, ModalForm, inputClass, secondaryButton } from "./form";
import PatientFields, { missingPatientFields } from "./patientfields";
import { useTagList } from "./tagpicker";
import { notify } from "../notify";

export default function AddPatient(props: any) {
  const [idnumSearch, setIdnumSearch] = React.useState('');
  const [lookup, setLookup] = React.useState<{ ok: boolean; text: string } | null>(null);
  const [studentData, setStudentData] = React.useState<Record<string, any>>({});
  const [selectedAllergy, setSelectedAllergy] = React.useState<number[]>([]);
  const [selectedCondition, setSelectedCondition] = React.useState<number[]>([]);
  // Staff, faculty and visitors are patients too; they have no student record.
  const [isStudent, setIsStudent] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const allergies = useTagList("allergy");
  const conditions = useTagList("condition");

  // Opened from the check-in box with an ID: look that student up straight away.
  React.useEffect(() => {
    if (props.initialStudentId) {
      setIdnumSearch(props.initialStudentId);
      findStudent(props.initialStudentId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.initialStudentId]);

  async function findStudent(idOverride?: string) {
    const idnum = (idOverride ?? idnumSearch).trim();
    if (!idnum) return setLookup({ ok: false, text: "Enter a student ID to look up." });
    const response = await apiFetch(`/getstudent?idnum=${encodeURIComponent(idnum)}`);
    const rows = await response.json().catch(() => []);
    if (Array.isArray(rows) && rows.length > 0) {
      setStudentData({ ...rows[0], is_student: true });
      setLookup({ ok: true, text: "Found in the school records. Check the details, then save." });
    } else {
      setStudentData(current => ({ ...current, student_id: idnum }));
      setLookup({ ok: false, text: "Not in the school records. Fill in the details below." });
    }
  }

  function clearForm() {
    setStudentData({});
    setIdnumSearch('');
    setLookup(null);
    setSelectedAllergy([]);
    setSelectedCondition([]);
    setError('');
  }

  async function save() {
    const missing = missingPatientFields(studentData, isStudent);
    if (missing.length) return setError(`Please fill in: ${missing.join(', ')}.`);

    setSaving(true);
    setError('');
    const response = await apiFetch(`/addpatient`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Allergies and conditions are saved with the patient, all or nothing.
      body: JSON.stringify({
        ...studentData,
        is_student: isStudent,
        ...(isStudent ? {} : { student_id: null }),
        allergies: selectedAllergy,
        conditions: selectedCondition,
      })
    }).catch(() => null);
    const result = await response?.json().catch(() => ({}));
    setSaving(false);
    if (!response?.ok || !result?.success) {
      // A 400 carries the server's reason; a refused save with no reason is a duplicate.
      setError(result?.error || 'This patient is already registered.');
      return;
    }
    notify(`${studentData.first_name} ${studentData.last_name} added.`);
    props.refetchPatients();
    props.hideForm();
  }

  return (
    <ModalForm title="Add patient" onClose={props.hideForm} onSubmit={save} submitLabel="Save patient" saving={saving}
      error={error} width={720}
      footerStart={<button type="button" onClick={clearForm} className="text-sm font-medium text-sage-500 hover:text-sage-800">
        <i className="bi bi-eraser mr-1" aria-hidden="true" />Clear form
      </button>}>
      <ChoiceGroup legend="Who is this?" name="patient-type" value={isStudent ? "student" : "other"}
        options={[["student", "A student"], ["other", "Staff or visitor"]] as const}
        onChange={(value) => setIsStudent(value === "student")} />

      {isStudent && (
        <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
          <Field label="Look up in the school records" htmlFor="patient-lookup"
            hint="Fills in the details the school already has. You can also type them in yourself.">
            <div className="flex gap-2">
              <input id="patient-lookup" inputMode="numeric" className={inputClass} placeholder="Student ID" value={idnumSearch}
                onChange={(e) => setIdnumSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); findStudent() } }} />
              <button type="button" onClick={() => findStudent()} className={`${secondaryButton} flex-shrink-0`}>
                <i className="bi bi-search" aria-hidden="true" /> Look up
              </button>
            </div>
          </Field>
          {lookup && (
            <p role="status" className={`m-0 mt-2 text-xs font-medium ${lookup.ok ? "text-leaf-700" : "text-amber-800"}`}>
              <i className={`bi ${lookup.ok ? "bi-check-circle" : "bi-info-circle"} mr-1`} aria-hidden="true" />{lookup.text}
            </p>
          )}
        </div>
      )}

      <PatientFields data={studentData} isStudent={isStudent}
        onChange={(patch) => setStudentData(current => ({ ...current, ...patch }))}
        allergies={{ options: allergies.options, selected: selectedAllergy, onChange: setSelectedAllergy, onCreate: allergies.create }}
        conditions={{ options: conditions.options, selected: selectedCondition, onChange: setSelectedCondition, onCreate: conditions.create }} />
    </ModalForm>
  );
}
