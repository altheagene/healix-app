import { apiFetch } from "../api";
import type { Allergy, Condition } from "../types";
import DepartmentFields from "./departmentfields";
import { isBasicEducation, stageOf } from "../school";
import React from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function AddPatient(props: any) {
  // ---------- STATE ----------
  const [idnumSearch, setIdnumSearch] = React.useState('');
  const [studentData, setStudentData] = React.useState<any>({});
  const [allergies, setAllergies] = React.useState<any[]>([]);
  const [conditions, setConditions] = React.useState<any[]>([]);
  const [selectedAllergy, setSelectedAllergy] = React.useState<number[]>([]);
  const [selectedCondition, setSelectedCondition] = React.useState<number[]>([]);
  const [showAllergyDropdown, setShowAllergyDropdown] = React.useState(false);
  const [showConditionDropdown, setShowConditionDropdown] = React.useState(false);
  const [allergySearch, setAllergySearch] = React.useState('');
  const [conditionSearch, setConditionSearch] = React.useState('');
  const [flashMessage, setFlashMessage] = React.useState('');
  const [found, setFound] = React.useState(false);
  // Staff, faculty and visitors are patients too; they have no student record.
  const [isStudent, setIsStudent] = React.useState(true);

  const filteredAllergies = allergies.filter(a =>
    a.allergy_name.toLowerCase().includes(allergySearch.toLowerCase())
  );

  const filteredConditions = conditions.filter(c =>
    c.condition_name.toLowerCase().includes(conditionSearch.toLowerCase())
  );

  // ---------- EFFECTS ----------
  React.useEffect(() => {
    apiFetch(`/getallergies`)
      .then(res => res.json())
      .then((data: Allergy[]) =>
        setAllergies(
          data.sort((a, b) =>
            a.allergy_name.toLowerCase().localeCompare(b.allergy_name.toLowerCase())
          )
        )
      );
  }, []);

  React.useEffect(() => {
    apiFetch(`/getconditions`)
      .then(res => res.json())
      .then((data: Condition[]) =>
        setConditions(
          data.sort((a, b) =>
            a.condition_name.toLowerCase().localeCompare(b.condition_name.toLowerCase())
          )
        )
      );
  }, []);

  // Opened from the check-in box with an ID: look that student up straight away.
  React.useEffect(() => {
    if (props.initialStudentId) {
      setIdnumSearch(props.initialStudentId);
      findStudent(props.initialStudentId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.initialStudentId]);

  // ---------- FUNCTIONS ----------
  function showFlash(message: string, success: boolean = true) {
    setFlashMessage(message);
    setFound(success);
    setTimeout(() => setFlashMessage(''), 3000);
  }

  async function handleSubmit() {
    // ---------- VALIDATION ----------
    const requiredFields: Record<string, string> = {
      first_name: 'First name',
      middle_name: 'Middle name',
      last_name: 'Last name',
      birthday: 'Birthday',
      sex: 'Sex',
      email: 'Email',
      phone: 'Phone',
      ...(isStudent ? { student_id: 'Student ID', department: 'Department', level: 'Level' } : {}),
      emergency_contact_name: 'Emergency contact name',
      emergency_contact_phone: 'Emergency contact phone',
    };

    // Say which fields are missing, not just that something is.
    const missing = Object.entries(requiredFields)
      .filter(([field]) => studentData[field] === undefined || studentData[field] === null || studentData[field].toString().trim() === '')
      .map(([, label]) => label);
    if (isStudent && isBasicEducation(studentData.department) && stageOf(studentData.level) === 'senior_high' && !studentData.strand) {
      missing.push('Senior High strand');
    }
    if (missing.length > 0) {
      showFlash(`Please fill in: ${missing.join(', ')}`, false);
      return;
    }

    // ---------- SUBMIT STUDENT ----------
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
    });

    const success = await response.json();
    if (!success.success) {
      // A 400 carries the server's reason; a refused save with no reason is a duplicate.
      showFlash(success.error || 'This patient already exists!', false);
      return;
    }

    showFlash('Successfully saved new patient!');
    setTimeout(() => props.hideForm(), 1000)
    props.refetchPatients();
  }

  async function findStudent(idOverride?: string) {
    const idnum = (idOverride ?? idnumSearch).trim();
    if (idnum.length === 0){
      setFlashMessage('Please enter an id number!')
      return;
    }
    const response = await apiFetch(`/getstudent?idnum=${encodeURIComponent(idnum)}`);
    const jsonified = await response.json();

    if (jsonified.length > 0) {
      setStudentData({ ...jsonified[0], is_student: true });
      showFlash('Student found!');
    } else {
      setStudentData({});
      showFlash('This student does not exist!', false);
    }

    setSelectedAllergy([]);
    setSelectedCondition([]);
    setShowAllergyDropdown(false);
    setShowConditionDropdown(false);
  }

  async function addNewAllergy(name: string) {
    if (!name.trim()) return;
    const response = await apiFetch(`/addnewallergy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ allergy_name: name.trim() }),
    });
    const result = await response.json();
    if (result.success) {
      setAllergies(prev => [...prev, { allergy_id: result.id, allergy_name: name.trim() }]);
      setSelectedAllergy(prev => [...prev, result.id]);
      setAllergySearch('');
    }
  }

  async function addNewCondition(name: string) {
    if (!name.trim()) return;
    const response = await apiFetch(`/addnewcondition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ condition_name: name.trim() }),
    });
    const result = await response.json();
    if (result.success) {
      setConditions(prev => [...prev, { condition_id: result.id, condition_name: name.trim() }]);
      setSelectedCondition(prev => [...prev, result.id]);
      setConditionSearch('');
    }
  }

  function toggleOption(id: number, type: 'allergy' | 'condition') {
    if (type === 'allergy') {
      setSelectedAllergy(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    } else {
      setSelectedCondition(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    }
  }

  const selectedAllergyItems = allergies.filter(a => selectedAllergy.includes(a.allergy_id));
  const selectedConditionItems = conditions.filter(c => selectedCondition.includes(c.condition_id));

  const inputClasses = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-teal-300 focus:ring-2 focus:ring-teal-100";
  const labelClasses = "mb-1.5 block text-xs font-medium text-slate-500";

  // ---------- JSX ----------
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">

        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <button
            onClick={props.hideForm}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-800"
          >
            <i className="bi bi-x-lg" /> Hide
          </button>
          <p className="text-base font-semibold text-slate-900">Add Patient</p>
          <button
            onClick={() => { setStudentData({}); setIdnumSearch(''); setSelectedAllergy([]); setSelectedCondition([]); }}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-800"
          >
            <i className="bi bi-eraser" /> Clear
          </button>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {flashMessage.length > 0 && (
            <div role="alert" className={`mb-4 rounded-xl px-4 py-2.5 text-sm font-medium text-white ${found ? 'bg-emerald-500' : 'bg-red-500'}`}>
              {flashMessage}
            </div>
          )}

          {/* PATIENT TYPE */}
          <div className="mb-5 inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1" role="radiogroup" aria-label="Patient type">
            {[[true, 'Student'], [false, 'Staff or visitor']].map(([value, label]) => (
              <button
                key={String(value)}
                type="button"
                role="radio"
                aria-checked={isStudent === value}
                onClick={() => setIsStudent(value as boolean)}
                className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${isStudent === value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {label as string}
              </button>
            ))}
          </div>

          {/* SEARCH BY ID */}
          {isStudent && <div className="mb-6">
            <label className={labelClasses}>Find student by ID number</label>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 focus-within:border-teal-300 focus-within:ring-2 focus-within:ring-teal-100">
              <i className="bi bi-search text-sm text-slate-400" />
              <input
                type="text"
                placeholder="Search by ID Number"
                value={idnumSearch}
                onChange={(e) => setIdnumSearch(e.target.value)}
                className="w-full border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
              <button
                onClick={() => findStudent()}
                className="flex-shrink-0 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700"
              >
                Search
              </button>
            </div>
          </div>}

          {/* STUDENT INFORMATION */}
          <div className="mb-6">
            <p className="mb-3 text-sm font-semibold text-slate-900">
              {isStudent ? 'Student Information' : 'Personal Information'} <span className="text-red-500">*</span>
            </p>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
              <div>
                <label className={labelClasses}>First Name</label>
                <input
                  type="text"
                  value={studentData?.first_name || ''}
                  onChange={(e) => setStudentData({ ...studentData, first_name: e.target.value })}
                  className={inputClasses}
                  required
                />
              </div>
              <div>
                <label className={labelClasses}>Middle Name</label>
                <input
                  type="text"
                  value={studentData?.middle_name || ''}
                  onChange={(e) => setStudentData({ ...studentData, middle_name: e.target.value })}
                  className={inputClasses}
                  required
                />
              </div>
              <div>
                <label className={labelClasses}>Last Name</label>
                <input
                  type="text"
                  value={studentData?.last_name || ''}
                  onChange={(e) => setStudentData({ ...studentData, last_name: e.target.value })}
                  className={inputClasses}
                  required
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
                  required
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
                        ? 'border-teal-300 bg-teal-50 text-teal-800'
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    Female
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudentData({ ...studentData, sex: 'Male' })}
                    className={`flex-1 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition ${
                      studentData?.sex === 'Male'
                        ? 'border-teal-300 bg-teal-50 text-teal-800'
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50'
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

            {isStudent && <div className="mt-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
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
            </div>}
          </div>

          {/* MEDICAL INFORMATION */}
          <div className="mb-6">
            <p className="mb-3 text-sm font-semibold text-slate-900">Medical Information</p>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              {/* ALLERGIES */}
              <div className="relative">
                <label className={labelClasses}>Allergies</label>
                <div
                  onClick={() => setShowAllergyDropdown(prev => !prev)}
                  className="flex min-h-[44px] cursor-pointer flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 focus-within:border-teal-300 focus-within:ring-2 focus-within:ring-teal-100"
                >
                  {selectedAllergyItems.length > 0 ? (
                    <>
                      <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800 ring-1 ring-teal-200/60">
                        {selectedAllergyItems[0].allergy_name}
                      </span>
                      {selectedAllergyItems.length > 1 && (
                        <span className="text-xs text-slate-400">(+{selectedAllergyItems.length - 1} others)</span>
                      )}
                    </>
                  ) : (
                    <span className="text-sm text-slate-400">Search allergies</span>
                  )}
                  <div className="ml-auto flex items-center gap-1.5">
                    {selectedAllergyItems.length > 0 && (
                      <i
                        className="bi bi-x-lg text-xs text-slate-400 hover:text-slate-700"
                        onClick={(e) => { e.stopPropagation(); setSelectedAllergy([]); }}
                      />
                    )}
                    <i className={`bi bi-chevron-down text-xs text-slate-400 transition ${showAllergyDropdown ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {showAllergyDropdown && (
                  <div className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                    <div className="border-b border-slate-100 p-2">
                      <input
                        type="text"
                        autoFocus
                        placeholder="Search allergies"
                        onChange={e => setAllergySearch(e.target.value)}
                        className="w-full rounded-lg border-none bg-slate-50 px-3 py-2 text-sm outline-none placeholder:text-slate-400"
                      />
                    </div>
                    <ul className="max-h-40 overflow-y-auto py-1">
                      {filteredAllergies.map(item => (
                        <li key={item.allergy_id}>
                          <label className="flex cursor-pointer items-center gap-2.5 px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-50">
                            <input
                              type="checkbox"
                              checked={selectedAllergy.includes(item.allergy_id)}
                              onChange={() => toggleOption(item.allergy_id, 'allergy')}
                              className="h-4 w-4 rounded border-slate-300 text-teal-800 focus:ring-teal-200"
                            />
                            {item.allergy_name}
                          </label>
                        </li>
                      ))}
                      {allergySearch && !filteredAllergies.some(a => a.allergy_name.toLowerCase() === allergySearch.toLowerCase()) && (
                        <li
                          onClick={() => addNewAllergy(allergySearch)}
                          className="cursor-pointer px-3.5 py-2 text-sm font-medium text-teal-900 hover:bg-teal-50"
                        >
                          + Add "{allergySearch}"
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {/* CONDITIONS */}
              <div className="relative">
                <label className={labelClasses}>Conditions</label>
                <div
                  onClick={() => setShowConditionDropdown(prev => !prev)}
                  className="flex min-h-[44px] cursor-pointer flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 focus-within:border-teal-300 focus-within:ring-2 focus-within:ring-teal-100"
                >
                  {selectedConditionItems.length > 0 ? (
                    <>
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-200/60">
                        {selectedConditionItems[0].condition_name}
                      </span>
                      {selectedConditionItems.length > 1 && (
                        <span className="text-xs text-slate-400">(+{selectedConditionItems.length - 1} others)</span>
                      )}
                    </>
                  ) : (
                    <span className="text-sm text-slate-400">Search conditions</span>
                  )}
                  <div className="ml-auto flex items-center gap-1.5">
                    {selectedConditionItems.length > 0 && (
                      <i
                        className="bi bi-x-lg text-xs text-slate-400 hover:text-slate-700"
                        onClick={(e) => { e.stopPropagation(); setSelectedCondition([]); }}
                      />
                    )}
                    <i className={`bi bi-chevron-down text-xs text-slate-400 transition ${showConditionDropdown ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {showConditionDropdown && (
                  <div className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                    <div className="border-b border-slate-100 p-2">
                      <input
                        type="text"
                        autoFocus
                        placeholder="Search conditions"
                        onChange={e => setConditionSearch(e.target.value)}
                        className="w-full rounded-lg border-none bg-slate-50 px-3 py-2 text-sm outline-none placeholder:text-slate-400"
                      />
                    </div>
                    <ul className="max-h-40 overflow-y-auto py-1">
                      {filteredConditions.map(item => (
                        <li key={item.condition_id}>
                          <label className="flex cursor-pointer items-center gap-2.5 px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-50">
                            <input
                              type="checkbox"
                              checked={selectedCondition.includes(item.condition_id)}
                              onChange={() => toggleOption(item.condition_id, 'condition')}
                              className="h-4 w-4 rounded border-slate-300 text-teal-800 focus:ring-teal-200"
                            />
                            {item.condition_name}
                          </label>
                        </li>
                      ))}
                      {conditionSearch && !filteredConditions.some(c => c.condition_name.toLowerCase() === conditionSearch.toLowerCase()) && (
                        <li
                          onClick={() => addNewCondition(conditionSearch)}
                          className="cursor-pointer px-3.5 py-2 text-sm font-medium text-teal-900 hover:bg-teal-50"
                        >
                          + Add "{conditionSearch}"
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3.5">
              <label className={labelClasses}>Notes</label>
              <input
                type="text"
                onChange={(e) => setStudentData({ ...studentData, notes: e.target.value })}
                className={inputClasses}
              />
            </div>
          </div>

          {/* EMERGENCY CONTACT */}
          <div>
            <p className="mb-3 text-sm font-semibold text-slate-900">
              Emergency Contact Information <span className="text-red-500">*</span>
            </p>
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
        <div className="border-t border-slate-100 px-6 py-4">
          <button
            onClick={handleSubmit}
            className="w-full rounded-xl bg-teal-800 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-teal-900"
          >
            Save Patient
          </button>
        </div>
      </div>
    </div>
  );
}