
import '../patients.css';
import '../app.css';
import CancelSaveBtn from './cancelsavebtn';
import React from 'react';

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

  const [allergyElements, setAllergyElements] = React.useState([]); 
  const [conditionElements, setConditionElements] = React.useState([]);

  // ============================================================
  // EFFECTS — LOAD INITIAL DATA
  // ============================================================

  // Load allergies
  React.useEffect(() => {
    fetch('http://localhost:5000/getallergies')
      .then(res => res.json())
      .then(data =>
        setAllergies(data.sort((a, b) =>
          a.allergy_name.localeCompare(b.allergy_name)
        ))
      );
  }, []);

  // Load conditions
  React.useEffect(() => {
    fetch('http://localhost:5000/getconditions')
      .then(res => res.json())
      .then(data =>
        setConditions(data.sort((a, b) =>
          a.condition_name.localeCompare(b.condition_name)
        ))
      );
  }, []);

  // Load selected student & preset selections
  React.useEffect(() => {
    setStudentData(props.studentData);
    setSelectedAllergy(props.allergies?.map(a => a.allergy_id) || []);
    setSelectedCondition(props.conditions?.map(c => c.condition_id) || []);
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
    await fetch("http://localhost:5000/addallergies", {
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
    await fetch("http://localhost:5000/deletepatientallergies", {
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
    await fetch("http://localhost:5000/addconditions", {
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
    await fetch("http://localhost:5000/deletepatientconditions", {
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
    const res = await fetch("http://localhost:5000/updatepatient", {
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

  // ============================================================
  // RENDER LISTS
  // ============================================================

  const allergyCheckboxes = allergies.map(item => (
    <li key={item.allergy_id}>
      <input
        type="checkbox"
        checked={selectedAllergy.includes(item.allergy_id)}
        onChange={() =>
          selectedAllergy.includes(item.allergy_id)
            ? remove(item, "allergy")
            : add(item, "allergy")
        }
      />
      <label>{item.allergy_name}</label>
    </li>
  ));

  const conditionCheckboxes = conditions.map(item => (
    <li key={item.condition_id}>
      <input
        type="checkbox"
        checked={selectedCondition.includes(item.condition_id)}
        onChange={() =>
          selectedCondition.includes(item.condition_id)
            ? remove(item, "condition")
            : add(item, "condition")
        }
      />
      <label>{item.condition_name}</label>
    </li>
  ));
  // ---------- JSX ----------
  return (
    <div id="add-new-patient-div">
      <div className='gray-bg'></div>

      <div id="add-patient-form" className='modal-form'>
        {/* Header */}
        <div className='modal-header-div'>
          <p className="modal-header">Edit Patient</p>
        </div>

        <div id='main-add-patient-form'>
          {/* Search */}
          <div>
            <label htmlFor="search-by-id" style={{ display: 'inline-block', marginRight: '1rem' }}>
              <input
                type="text"
                id='search-by-id'
                placeholder='Search by ID Number'
                style={{ width: '250px' }}
                value={idnumSearch}
                onChange={(e) => setIdnumSearch(e.target.value)}
              />
            </label>
            <button
              style={{ height: '40px', width: '80px', borderRadius: '10px', border: 'none' }}
            >
              Search
            </button>
          </div>

          {/* Student Photo */}
          {/* <div>
            <img
              style={{ width: '150px', height: '150px', borderRadius: '80px', backgroundColor: 'gray' }}
            />
          </div> */}

          {/* Student Information */}
          <div id="student-information" className='form-div'>
            <p className='form-header'>Student Information</p>

            <div>
              <label htmlFor="firstname">First Name
                <input 
                    type="text" 
                    id="firstname" 
                    value={studentData?.first_name || ''}
                    onChange={(e) => setStudentData({...studentData, first_name: e.target.value})}  />
              </label>
              <label htmlFor="middlename">Middle Name
                <input 
                    type="text" 
                    id="middlename" 
                    value={studentData?.middle_name || ''}
                    onChange={(e) => setStudentData({...studentData, middle_name: e.target.value})}  />
              </label>
              <label htmlFor="lastname">Last Name
                <input 
                    type="text" 
                    id="lastname" 
                    value={studentData?.last_name || ''} 
                    onChange={(e) => setStudentData({...studentData, last_name: e.target.value})} />
              </label>
            </div>

            <div>
              <label htmlFor="birthdate">Birthdate
                <input type="date" id='birthdate' value={studentData?.birthday} onChange={(e)  => setStudentData({...studentData, birthday: e.target.value})}/>
              </label>

              <label style={{ display: 'block' }}>Sex
                <div id='gender-div'>
                  <div>
                    <input type="radio" name="gender" id='female' checked={studentData?.sex === 'Female'} />
                    <label htmlFor="female">Female</label>
                  </div>
                  <div>
                    <input type="radio" name="gender" id="male" checked={studentData?.sex === 'Male'} />
                    <label htmlFor="male">Male</label>
                  </div>
                </div>
              </label>
            </div>

            <div>
              <label htmlFor="email">Email
                <input type="text" id='email' value={studentData?.email} onChange={(e)  => setStudentData({...studentData, email: e.target.value})}/>
              </label>

              <label htmlFor="phone">Phone
                <input type="text" id='phone' value={studentData?.phone} onChange={(e)  => setStudentData({...studentData, phone: e.target.value})}/>
              </label>
            </div>

            <div>
              <label htmlFor="idno">ID Number
                <input 
                    type="number" 
                    id="idno" 
                    value={studentData?.student_id || ''} 
                    onChange={(e) => setStudentData({...studentData, student_id: e.target.value})} />
              </label>
              <label htmlFor="department">Department
                <input 
                    type='text' 
                    value={studentData?.department || ''}
                    onChange={(e) => setStudentData({...studentData, department: e.target.value})}  />
              </label>
              <label htmlFor="level">Level
                <input 
                    type='number' 
                    id='level' 
                    value={studentData?.level || ''}
                    onChange={(e) => setStudentData({...studentData, level: e.target.value})}  />
              </label>
            </div>
          </div>

          {/* Medical Information */}
          <div id="medical-information" className='form-div'>
            <p className='form-header'>Medical Information</p>

            <div>
                {/* Allergies */}
                <div>
                    <label>Allergies</label>
                    <input
                        type="text"
                        placeholder="Search Allergies"
                        onClick={() => setShowAllergyDropdown(prev => !prev)}
                    />
                    {showAllergyDropdown && (
                        <div className='dropdown'>
                        <ul>{allergyCheckboxes}</ul>
                        </div>
                    )}

                </div>

                {/* Conditions */}
                <div>
                    <label>Conditions</label>
                    <input
                        type="text"
                        placeholder="Search Conditions"
                        onClick={() => setShowConditionDropdown(prev => !prev)}
                    />
                    {showConditionDropdown && (
                        <div className='dropdown'>
                        <ul>{conditionCheckboxes}</ul>
                        </div>
                    )}
                </div>

                <div style={{display: 'block'}}>
                  <label htmlFor="notes">Notes
                    <input type="text"  onChange={(e) => setStudentData({...studentData, notes: e.target.value})}/>
                  </label>
                </div>
            </div>
            
          </div>

          {/* Emergency Contact */}
          <div id="emergency-contact-information" className='form-div'>
            <p className='form-header'>Emergency Contact Information</p>
            <div>
              <label htmlFor="ec-fullname">Full Name
                <input 
                    type="text" 
                    id="ec-fullname" 
                    value={studentData?.emergency_contact_name || ''} 
                    onChange={(e) => setStudentData({...studentData, emergency_contact_name: e.target.value})} />
              </label>
              <label htmlFor="phone">Phone
                <input 
                    type="text" 
                    id="phone" 
                    value={studentData?.emergency_contact_phone || ''}
                    onChange={(e) => setStudentData({...studentData, emergency_contact_phone: e.target.value})} />
              </label>
            </div>
          </div>
        </div>

        {/* Cancel / Save Buttons */}
        <div id='cancel-save-div'>
          <CancelSaveBtn hideForm={props.hideForm} submit={handleSubmit} />
        </div>
      </div>
    </div>
  );
}
