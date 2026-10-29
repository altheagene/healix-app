import { apiFetch } from "../api";
import type { Allergy, Condition } from "../types";
import DepartmentFields from "./departmentfields";
import React from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function EditPatient(props: any) {
   // ============================================================
  // STATE
  // ============================================================
  const [idnumSearch, setIdnumSearch] = React.useState('');
  const [studentData, setStudentData] = React.useState<any>();

  // master lists from backend
  const [allergies, setAllergies] = React.useState<any[]>([]);
  const [conditions, setConditions] = React.useState<any[]>([]);

  // selected values
  const [selectedAllergy, setSelectedAllergy] = React.useState<any[]>([]);
  const [selectedCondition, setSelectedCondition] = React.useState<any[]>([]);

  // record changes
  const [addedAllergy, setAddedAllergy] = React.useState<any[]>([]);
  const [removedAllergy, setRemovedAllergy] = React.useState<any[]>([]);

  const [addedCondition, setAddedCondition] = React.useState<any[]>([]);
  const [removedCondition, setRemovedCondition] = React.useState<any[]>([]);

  // dropdowns
  const [showAllergyDropdown, setShowAllergyDropdown] = React.useState(false);
  const [showConditionDropdown, setShowConditionDropdown] = React.useState(false);

  // ============================================================
  // EFFECTS — LOAD INITIAL DATA
  // ============================================================

  // Load allergies
  React.useEffect(() => {
    apiFetch(`/getallergies`)
      .then(res => res.json())
      .then((data: Allergy[]) =>
        setAllergies(data.sort((a, b) =>
          a.allergy_name.localeCompare(b.allergy_name)
        ))
      );
  }, []);

  // Load conditions
  React.useEffect(() => {
    apiFetch(`/getconditions`)
      .then(res => res.json())
      .then((data: Condition[]) =>
        setConditions(data.sort((a, b) =>
          a.condition_name.localeCompare(b.condition_name)
        ))
      );
  }, []);

  // Load selected student & preset selections
  React.useEffect(() => {
    setStudentData(props.studentData);
    setSelectedAllergy(props.allergies?.map((a: Allergy) => a.allergy_id) || []);
    setSelectedCondition(props.conditions?.map((c: Condition) => c.condition_id) || []);
  }, [props.studentData]);

  // ============================================================
  // LOGIC — ADD / REMOVE ITEMS
  // ============================================================

  function add(item: any, type: 'allergy' | 'condition') {
    const id = type === 'allergy' ? item.allergy_id : item.condition_id;

    if (type === 'allergy') {
      setAddedAllergy(prev => [...new Set([...prev, id])]);
      setSelectedAllergy(prev => [...new Set([...prev, id])]);
      setRemovedAllergy(prev => prev.filter(x => x !== id));
    } else {
      setAddedCondition(prev => [...new Set([...prev, id])]);
      setSelectedCondition(prev => [...new Set([...prev, id])]);
      setRemovedCondition(prev => prev.filter(x => x !== id));
    }
  }

  function remove(item: any, type: 'allergy' | 'condition') {
    const id = type === 'allergy' ? item.allergy_id : item.condition_id;

    if (type === 'allergy') {
      setRemovedAllergy(prev => [...new Set([...prev, id])]);
      setAddedAllergy(prev => prev.filter(x => x !== id));
      setSelectedAllergy(prev => prev.filter(x => x !== id));
    } else {
      setRemovedCondition(prev => [...new Set([...prev, id])]);
      setAddedCondition(prev => prev.filter(x => x !== id));
      setSelectedCondition(prev => prev.filter(x => x !== id));
    }
  }

  // ============================================================
  // FETCH FUNCTIONS
  // ============================================================

  async function submitAddAllergies() {
    if (addedAllergy.length === 0) return;
    await apiFetch(`/addallergies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patient_id: studentData.patient_id,
        allergies: addedAllergy,
      }),
    });
  }

  async function submitDeleteAllergies() {
    if (removedAllergy.length === 0) return;
    await apiFetch(`/deletepatientallergies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patient_id: studentData.patient_id,
        allergies: removedAllergy,
      }),
    });
  }

  async function submitAddConditions() {
    if (addedCondition.length === 0) return;
    await apiFetch(`/addconditions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patient_id: studentData.patient_id,
        conditions: addedCondition,
      }),
    });
  }

  async function submitDeleteConditions() {
    if (removedCondition.length === 0) return;
    await apiFetch(`/deletepatientconditions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patient_id: studentData.patient_id,
        conditions: removedCondition,
      }),
    });
  }

  // ============================================================
  // SUBMIT — MAIN SAVE
  // ============================================================

  async function handleSubmit() {
    const res = await apiFetch(`/updatepatient`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(studentData),
    });

    const success = await res.json();

    if (success.success) {
      await submitAddAllergies();
      await submitDeleteAllergies();
      await submitAddConditions();
      await submitDeleteConditions();

      alert("Patient Updated Successfully!");
      props.hideForm();
      props.refetch();
    }
  }

  const selectedAllergyItems = allergies.filter(a => selectedAllergy.includes(a.allergy_id));
  const selectedConditionItems = conditions.filter(c => selectedCondition.includes(c.condition_id));

  const inputClasses = "w-full rounded-xl border border-sage-200 bg-white px-3.5 py-2.5 text-sm text-sage-900 outline-none placeholder:text-sage-400 focus:border-brand-300 focus:ring-2 focus:ring-brand-100";
  const labelClasses = "mb-1.5 block text-xs font-medium text-sage-500";

  // ---------- JSX ----------
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">

        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-sage-100 px-6 py-4">
          <button
            onClick={props.hideForm}
            className="flex items-center gap-1.5 text-sm font-medium text-sage-500 transition hover:text-sage-800"
          >
            <i className="bi bi-x-lg" /> Hide
          </button>
          <p className="text-base font-semibold text-sage-900">Edit Patient</p>
          <div className="w-[52px]" />
        </div>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* SEARCH BY ID */}
          <div className="mb-6">
            <label className={labelClasses}>Search by ID number</label>
            <div className="flex items-center gap-2 rounded-xl border border-sage-200 bg-white px-3.5 py-2.5 focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-100">
              <i className="bi bi-search text-sm text-sage-400" />
              <input
                type="text"
                placeholder="Search by ID Number"
                value={idnumSearch}
                onChange={(e) => setIdnumSearch(e.target.value)}
                className="w-full border-none bg-transparent text-sm text-sage-900 outline-none placeholder:text-sage-400"
              />
              <button
                className="flex-shrink-0 rounded-lg bg-sage-900 px-3.5 py-1.5 text-xs font-medium text-white transition hover:bg-sage-700"
              >
                Search
              </button>
            </div>
          </div>

          {/* STUDENT INFORMATION */}
          <div className="mb-6">
            <p className="mb-3 text-sm font-semibold text-sage-900">Student Information</p>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
              <div>
                <label className={labelClasses}>First Name</label>
                <input
                  type="text"
                  value={studentData?.first_name || ''}
                  onChange={(e) => setStudentData({ ...studentData, first_name: e.target.value })}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>Middle Name <span className="font-normal text-sage-400">(optional)</span></label>
                <input
                  type="text"
                  value={studentData?.middle_name || ''}
                  onChange={(e) => setStudentData({ ...studentData, middle_name: e.target.value })}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>Last Name</label>
                <input
                  type="text"
                  value={studentData?.last_name || ''}
                  onChange={(e) => setStudentData({ ...studentData, last_name: e.target.value })}
                  className={inputClasses}
                />
              </div>
            </div>

            <div className="mt-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <label className={labelClasses}>Birthdate</label>
                <input
                  type="date"
                  value={studentData?.birthday || ''}
                  onChange={(e) => setStudentData({ ...studentData, birthday: e.target.value })}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>Sex</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStudentData({ ...studentData, sex: 'Female' })}
                    className={`flex-1 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition ${
                      studentData?.sex === 'Female'
                        ? 'border-brand-300 bg-brand-50 text-brand-800'
                        : 'border-sage-200 text-sage-500 hover:bg-sage-50'
                    }`}
                  >
                    Female
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudentData({ ...studentData, sex: 'Male' })}
                    className={`flex-1 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition ${
                      studentData?.sex === 'Male'
                        ? 'border-brand-300 bg-brand-50 text-brand-800'
                        : 'border-sage-200 text-sage-500 hover:bg-sage-50'
                    }`}
                  >
                    Male
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <label className={labelClasses}>Email</label>
                <input
                  type="text"
                  value={studentData?.email || ''}
                  onChange={(e) => setStudentData({ ...studentData, email: e.target.value })}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>Phone</label>
                <input
                  type="text"
                  value={studentData?.phone || ''}
                  onChange={(e) => setStudentData({ ...studentData, phone: e.target.value })}
                  className={inputClasses}
                />
              </div>
            </div>

            <div className="mt-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
              <div>
                <label className={labelClasses}>ID Number</label>
                <input
                  type="number"
                  value={studentData?.student_id || ''}
                  onChange={(e) => setStudentData({ ...studentData, student_id: e.target.value })}
                  className={inputClasses}
                />
              </div>
              <DepartmentFields
                value={studentData || {}}
                onChange={(patch) => setStudentData({ ...studentData, ...patch })}
                inputClasses={inputClasses}
                labelClasses={labelClasses}
              />
            </div>
          </div>

          {/* MEDICAL INFORMATION */}
          <div className="mb-6">
            <p className="mb-3 text-sm font-semibold text-sage-900">Medical Information</p>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              {/* ALLERGIES */}
              <div className="relative">
                <label className={labelClasses}>Allergies</label>
                <div
                  onClick={() => setShowAllergyDropdown(prev => !prev)}
                  className="flex min-h-[44px] cursor-pointer flex-wrap items-center gap-1.5 rounded-xl border border-sage-200 bg-white px-3 py-2 focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-100"
                >
                  {selectedAllergyItems.length > 0 ? (
                    <>
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-800 ring-1 ring-brand-200/60">
                        {selectedAllergyItems[0].allergy_name}
                      </span>
                      {selectedAllergyItems.length > 1 && (
                        <span className="text-xs text-sage-400">(+{selectedAllergyItems.length - 1} others)</span>
                      )}
                    </>
                  ) : (
                    <span className="text-sm text-sage-400">Search allergies</span>
                  )}
                  <i className={`bi bi-chevron-down ml-auto text-xs text-sage-400 transition ${showAllergyDropdown ? 'rotate-180' : ''}`} />
                </div>

                {showAllergyDropdown && (
                  <div className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-sage-200 bg-white shadow-lg">
                    <ul className="max-h-40 overflow-y-auto py-1">
                      {allergies.map(item => (
                        <li key={item.allergy_id}>
                          <label className="flex cursor-pointer items-center gap-2.5 px-3.5 py-2 text-sm text-sage-700 hover:bg-sage-50">
                            <input
                              type="checkbox"
                              checked={selectedAllergy.includes(item.allergy_id)}
                              onChange={() =>
                                selectedAllergy.includes(item.allergy_id)
                                  ? remove(item, "allergy")
                                  : add(item, "allergy")
                              }
                              className="h-4 w-4 rounded border-sage-300 text-brand-800 focus:ring-brand-200"
                            />
                            {item.allergy_name}
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* CONDITIONS */}
              <div className="relative">
                <label className={labelClasses}>Conditions</label>
                <div
                  onClick={() => setShowConditionDropdown(prev => !prev)}
                  className="flex min-h-[44px] cursor-pointer flex-wrap items-center gap-1.5 rounded-xl border border-sage-200 bg-white px-3 py-2 focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-100"
                >
                  {selectedConditionItems.length > 0 ? (
                    <>
                      <span className="inline-flex items-center gap-1 rounded-full bg-citron-100 px-2.5 py-1 text-xs font-medium text-brand-800 ring-1 ring-citron-400/60">
                        {selectedConditionItems[0].condition_name}
                      </span>
                      {selectedConditionItems.length > 1 && (
                        <span className="text-xs text-sage-400">(+{selectedConditionItems.length - 1} others)</span>
                      )}
                    </>
                  ) : (
                    <span className="text-sm text-sage-400">Search conditions</span>
                  )}
                  <i className={`bi bi-chevron-down ml-auto text-xs text-sage-400 transition ${showConditionDropdown ? 'rotate-180' : ''}`} />
                </div>

                {showConditionDropdown && (
                  <div className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-sage-200 bg-white shadow-lg">
                    <ul className="max-h-40 overflow-y-auto py-1">
                      {conditions.map(item => (
                        <li key={item.condition_id}>
                          <label className="flex cursor-pointer items-center gap-2.5 px-3.5 py-2 text-sm text-sage-700 hover:bg-sage-50">
                            <input
                              type="checkbox"
                              checked={selectedCondition.includes(item.condition_id)}
                              onChange={() =>
                                selectedCondition.includes(item.condition_id)
                                  ? remove(item, "condition")
                                  : add(item, "condition")
                              }
                              className="h-4 w-4 rounded border-sage-300 text-brand-800 focus:ring-brand-200"
                            />
                            {item.condition_name}
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3.5">
              <label className={labelClasses}>Notes</label>
              <input
                type="text"
                value={studentData?.notes || ''}
                onChange={(e) => setStudentData({ ...studentData, notes: e.target.value })}
                className={inputClasses}
              />
            </div>
          </div>

          {/* EMERGENCY CONTACT */}
          <div>
            <p className="mb-3 text-sm font-semibold text-sage-900">Emergency Contact Information</p>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <label className={labelClasses}>Full Name</label>
                <input
                  type="text"
                  value={studentData?.emergency_contact_name || ''}
                  onChange={(e) => setStudentData({ ...studentData, emergency_contact_name: e.target.value })}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>Phone</label>
                <input
                  type="text"
                  value={studentData?.emergency_contact_phone || ''}
                  onChange={(e) => setStudentData({ ...studentData, emergency_contact_phone: e.target.value })}
                  className={inputClasses}
                />
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-2 border-t border-sage-100 px-6 py-4">
          <button
            onClick={props.hideForm}
            className="rounded-xl border border-sage-200 px-4 py-2.5 text-sm font-medium text-sage-600 transition hover:bg-sage-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="rounded-xl bg-brand-800 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-brand-900"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}