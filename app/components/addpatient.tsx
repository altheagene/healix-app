
// import '../patients.css';
// import '../app.css';
// import CancelSaveBtn from './cancelsavebtn';
// import React from 'react';

// export default function AddPatient(props: any) {
//   // ---------- STATE ----------
//   const [idnumSearch, setIdnumSearch] = React.useState('');
//   const [studentData, setStudentData] = React.useState({});
//   const [allergies, setAllergies] = React.useState<any[]>([]);
//   const [conditions, setConditions] = React.useState<any[]>([]);
//   const [selectedAllergy, setSelectedAllergy] = React.useState<number[]>([]);
//   const [selectedCondition, setSelectedCondition] = React.useState<number[]>([]);
//   const [showAllergyDropdown, setShowAllergyDropdown] = React.useState(false);
//   const [showConditionDropdown, setShowConditionDropdown] = React.useState(false);
//   const [allergyElements, setAllergyElements] = React.useState([]);
//   const [conditionElements, setConditionElements] = React.useState([]);
//   const [allergySearch, setAllergySearch] = React.useState('');
//   const [conditionSearch, setConditionSearch] = React.useState('');
//   const [flashMessage, setFlashMessage] = React.useState('');
//   const [found, setFound] = React.useState(false)

//   const filteredAllergies = allergies.filter(a =>
//     a.allergy_name.toLowerCase().includes(allergySearch.toLowerCase())
//   );

//   const filteredConditions = conditions.filter(c =>
//     c.condition_name.toLowerCase().includes(conditionSearch.toLowerCase())
//   );

  


//   async function handleSubmit(){
//     console.log(studentData);
    
//     let success = true;
//     const response = await fetch('http://localhost:5000/addpatient',
//         {
//             method: 'POST',
//             headers:{
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify(studentData)
//         }
//     )
//     success = await response.json()
//     console.log(success)

//     if (!success.success){
//       setFound(false)
//       setFlashMessage('This patient already exists!')
//       setTimeout(() => setFlashMessage(""), 3000)
//       return;
//     }else{
//       setFound(true)
//       setFlashMessage('Successfully saved new patient!')
//       setTimeout(() => setFlashMessage(""), 3000)
//     }

//     console.log(selectedAllergy)
//     if (selectedAllergy.length > 0){
//         const id = await fetch('http://localhost:5000/getmaxpatientid').
//         then(res => res.json())
        
//         await fetch('http://localhost:5000/addpatientallergies', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({
//                 'patient_id': id[0].last_id,
//                 'allergies' : selectedAllergy
//             })
//         });
//     }

//     if (selectedCondition.length > 0){
//         const id = await fetch('http://localhost:5000/getmaxpatientid').
//         then(res => res.json())
        
//         await fetch('http://localhost:5000/addpatientconditions', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({
//                 'patient_id': id[0].last_id,
//                 'conditions' : selectedCondition
//             })
//         });
//       }
//     props.refetchPatients()
//   }
//   // ---------- EFFECTS ----------

//   React.useEffect(() => {
//     fetch('http://localhost:5000/getallergies')
//       .then(res => res.json())
//       .then(data =>
//         setAllergies(
//           data.sort((a, b) =>
//             a.allergy_name.toLowerCase().localeCompare(b.allergy_name.toLowerCase())
//           )
//         )
//       );
//   }, []);

//   React.useEffect(() => {
//     fetch('http://localhost:5000/getconditions')
//       .then(res => res.json())
//       .then(data =>
//         setConditions(
//           data.sort((a, b) =>
//             a.condition_name.toLowerCase().localeCompare(b.condition_name.toLowerCase())
//           )
//         )
//       );
//   }, []);

//   // ---------- FUNCTIONS ----------
//   function refetchAllergyAndCondi(){
//      fetch('http://localhost:5000/getallergies')
//       .then(res => res.json())
//       .then(data =>
//         setAllergies(
//           data.sort((a, b) =>
//             a.allergy_name.toLowerCase().localeCompare(b.allergy_name.toLowerCase())
//           )
//         )
//       );

//       fetch('http://localhost:5000/getconditions')
//       .then(res => res.json())
//       .then(data =>
//         setConditions(
//           data.sort((a, b) =>
//             a.condition_name.toLowerCase().localeCompare(b.condition_name.toLowerCase())
//           )
//         )
//       );
//   }
//   async function findStudent() {
//     const idnum = idnumSearch.trim();
//     const response = await fetch(`http://localhost:5000/getstudent?idnum=${idnum}`);

//       // const response = await fetch(`http://localhost:5000/getstudent?idnum=${idnum}`)
//       // .then(res => res.json())
//       // .then(data => setStudentData({...data[0], is_student:true}));


//     const jsonified = await response.json()
//     if (jsonified.length > 0){
//       setStudentData({...jsonified[0], is_student:true})
//       setFound(true);
//       setFlashMessage('Student found!')
//       setTimeout(() => setFlashMessage(''), 3000)
//     }else{
//       setFound(false);
//       setFlashMessage('This student does not exist!')
//      setTimeout(() => setFlashMessage(''), 3000)
//     }
//     setSelectedAllergy([])
//     setSelectedCondition([])
//     setShowAllergyDropdown(false)
//     setShowConditionDropdown(false)
//   }

// async function addNewAllergy(name: string) {
//   if (!name.trim()) return;
//   const response = await fetch('http://localhost:5000/addnewallergy', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ allergy_name: name.trim() }),
//   });
//   const result = await response.json();
//   if (result.success) {
//     setAllergies(prev => [...prev, { allergy_id: result.id, allergy_name: name.trim() }]);
//     setSelectedAllergy(prev => [...prev, result.id]); // select it automatically
//     setAllergySearch(''); // clear search
//   }

//   refetchAllergyAndCondi()
// }

// async function addNewCondition(name: string) {
//   if (!name.trim()) return;
//   const response = await fetch('http://localhost:5000/addnewcondition', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ condition_name: name.trim() }),
//   });
//   const result = await response.json();
//   if (result.success) {
//     setConditions(prev => [...prev, { condition_id: result.id, condition_name: name.trim() }]);
//     setSelectedCondition(prev => [...prev, result.id]);
//     setConditionSearch('');
//   }
//   refetchAllergyAndCondi()
// }
  

//   function toggleOption(id: number, type: 'allergy' | 'condition') {
//     if (type === 'allergy') {
//       if (!selectedAllergy.includes(id)) setSelectedAllergy(prev => [...prev, id]);
//       else setSelectedAllergy(prev => prev.filter(item => item !== id));
//     } else {
//       if (!selectedCondition.includes(id)) setSelectedCondition(prev => [...prev, id]);
//       else setSelectedCondition(prev => prev.filter(item => item !== id));
//     }
//   }

//   // ---------- CHECKBOXES ----------
// const allergyCheckboxes = filteredAllergies.map(item => (
//   <li key={item.allergy_id}>
//     <input
//       type="checkbox"
//       id={`allergy-${item.allergy_id}`}
//       checked={selectedAllergy.includes(item.allergy_id)}
//       onChange={() => toggleOption(item.allergy_id, 'allergy')}
//     />
//     <label htmlFor={`allergy-${item.allergy_id}`}>{item.allergy_name}</label>
//   </li>
// ));

// const conditionsCheckboxes = filteredConditions.map(item => (
//   <li key={item.condition_id}>
//     <input
//       type="checkbox"
//       id={`condition-${item.condition_id}`}
//       checked={selectedCondition.includes(item.condition_id)}
//       onChange={() => toggleOption(item.condition_id, 'condition')}
//     />
//     <label htmlFor={`condition-${item.condition_id}`}>{item.condition_name}</label>
//   </li>
// ));




//   // ---------- JSX ----------
//   return (
//     <div id="add-new-patient-div">
//       <div className='gray-bg'></div>

//       <div id="add-patient-form" className='modal-form'>
//         {/* Header */}
//         <div className='modal-header-div'>
//           <p className="modal-header">Add Patient</p>
//         </div>

//         <div id='main-add-patient-form'>
//           {/* Search */}
//           {flashMessage.length > 0 ?
//           <div className='flash-message' style={{background: found ? '#4caf50' : '#FF3838'}}>
//             {flashMessage}
//           </div>
//           : null}
//           <div>
//             <label htmlFor="search-by-id" style={{ display: 'inline-block', marginRight: '1rem' }}> Find student by ID Number
//               <input
//                 type="text"
//                 id='search-by-id'
//                 placeholder='Search by ID Number'
//                 style={{ width: '250px' }}
//                 value={idnumSearch}
//                 onChange={(e) => setIdnumSearch(e.target.value)}
//               />
//             </label>
//             <button
//               style={{ height: '40px', width: '80px', borderRadius: '10px', border: 'none' }}
//               onClick={findStudent}
//             >
//               Search
//             </button>
//           </div>

//           {/* Student Photo */}
//           {/* <div>
//             <img
//               style={{ width: '150px', height: '150px', borderRadius: '80px', backgroundColor: 'gray' }}
//             />
//           </div> */}

//           {/* Student Information */}
//           <div id="student-information" className='form-div'>
//             <p className='form-header'>Student Information</p>

//             <div>
//               <label htmlFor="firstname">First Name
//                 <input 
//                     type="text" 
//                     id="firstname" 
//                     value={studentData?.first_name || ''}
//                     onChange={(e) => setStudentData({...studentData, first_name: e.target.value})}  />
//               </label>
//               <label htmlFor="middlename">Middle Name
//                 <input 
//                     type="text" 
//                     id="middlename" 
//                     value={studentData?.middle_name || ''}
//                     onChange={(e) => setStudentData({...studentData, middle_name: e.target.value})}  />
//               </label>
//               <label htmlFor="lastname">Last Name
//                 <input 
//                     type="text" 
//                     id="lastname" 
//                     value={studentData?.last_name || ''} 
//                     onChange={(e) => setStudentData({...studentData, last_name: e.target.value})} />
//               </label>
//             </div>

//             <div>
//               <label htmlFor="birthdate">Birthdate
//                 <input type="date" id='birthdate' value={studentData?.birthday} onChange={(e)  => setStudentData({...studentData, birthday: e.target.value})}/>
//               </label>

//               <label style={{ display: 'block' }}>Sex
//                 <div id='gender-div'>
//                   <div>
//                     <input type="radio" name="gender" id='female' checked={studentData?.sex === 'Female'} />
//                     <label htmlFor="female">Female</label>
//                   </div>
//                   <div>
//                     <input type="radio" name="gender" id="male" checked={studentData?.sex === 'Male'} />
//                     <label htmlFor="male">Male</label>
//                   </div>
//                 </div>
//               </label>
//             </div>

//             <div>
//               <label htmlFor="email">Email
//                 <input type="text" id='email' value={studentData?.email} onChange={(e)  => setStudentData({...studentData, email: e.target.value})}/>
//               </label>

//               <label htmlFor="phone">Phone
//                 <input type="text" id='phone' value={studentData?.phone} onChange={(e)  => setStudentData({...studentData, phone: e.target.value})}/>
//               </label>
//             </div>

//             <div>
//               <label htmlFor="idno">ID Number
//                 <input 
//                     type="number" 
//                     id="idno" 
//                     value={studentData?.student_id || ''} 
//                     onChange={(e) => setStudentData({...studentData, student_id: e.target.value})} />
//               </label>
//               <label htmlFor="department">Department
//                 <input 
//                     type='text' 
//                     value={studentData?.department || ''}
//                     onChange={(e) => setStudentData({...studentData, department: e.target.value})}  />
//               </label>
//               <label htmlFor="level">Level
//                 <input 
//                     type='number' 
//                     id='level' 
//                     value={studentData?.level || ''}
//                     onChange={(e) => setStudentData({...studentData, level: e.target.value})}  />
//               </label>
//             </div>
//           </div>

//           {/* Medical Information */}
//           <div id="medical-information" className='form-div'>
//             <p className='form-header'>Medical Information</p>

//             <div>
//                 {/* Allergies */}
//                 <div>
//                   <label>Allergies</label>

//                   <input
//                     type="text"
//                     placeholder="Search Allergies"
//                     onClick={() => setShowAllergyDropdown(prev => !prev)}
//                     onChange={e => setAllergySearch(e.target.value)}
//                   />

//                   {showAllergyDropdown && (
//                     <div className="dropdown">
//                       <ul>{allergyCheckboxes}</ul>
//                       {allergySearch && !filteredAllergies.some(a => a.allergy_name.toLowerCase() === allergySearch.toLowerCase()) && (
//                         <li style={{ cursor: 'pointer', fontWeight: 'bold' }} onClick={() => addNewAllergy(allergySearch)}>
//                           + Add "{allergySearch}"
//                         </li>
//                       )}
//                     </div>
//                   )}
//                 </div>

//                 {/* Conditions */}
//                 <div>
//                   <label>Conditions</label>

//                   <input
//                     type="text"
//                     placeholder="Search Conditions"
//                     onClick={() => setShowConditionDropdown(prev => !prev)}
//                     onChange={e => setConditionSearch(e.target.value)}
//                   />

//                   {showConditionDropdown && (
//                     <div className="dropdown">
//                       <ul>{conditionsCheckboxes}</ul>
//                       {conditionSearch && !filteredConditions.some(c => c.condition_name.toLowerCase() === conditionSearch.toLowerCase()) && (
//                         <li style={{ cursor: 'pointer', fontWeight: 'bold' }} onClick={() => addNewCondition(conditionSearch)}>
//                           + Add "{conditionSearch}"
//                         </li>
//                       )}
//                     </div>
//                   )}
//                 </div>

//                 <div style={{display: 'block'}}>
//                   <label htmlFor="notes">Notes
//                     <input type="text"  onChange={(e) => setStudentData({...studentData, notes: e.target.value})}/>
//                   </label>
//                 </div>
//             </div>
            
//           </div>

//           {/* Emergency Contact */}
//           <div id="emergency-contact-information" className='form-div'>
//             <p className='form-header'>Emergency Contact Information</p>
//             <div>
//               <label htmlFor="ec-fullname">Full Name
//                 <input 
//                     type="text" 
//                     id="ec-fullname" 
//                     value={studentData?.emergency_contact_name || ''} 
//                     onChange={(e) => setStudentData({...studentData, emergency_contact_name: e.target.value})} />
//               </label>
//               <label htmlFor="phone">Phone
//                 <input 
//                     type="text" 
//                     id="phone" 
//                     value={studentData?.emergency_contact_phone || ''}
//                     onChange={(e) => setStudentData({...studentData, emergency_contact_phone: e.target.value})} />
//               </label>
//             </div>
//           </div>
//         </div>

//         {/* Cancel / Save Buttons */}
//         <div id='cancel-save-div'>
//           <CancelSaveBtn hideForm={props.hideForm} submit={handleSubmit} />
//         </div>
//       </div>
//     </div>
//   );
// }


import '../patients.css';
import '../app.css';
import CancelSaveBtn from './cancelsavebtn';
import React from 'react';

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

  const filteredAllergies = allergies.filter(a =>
    a.allergy_name.toLowerCase().includes(allergySearch.toLowerCase())
  );

  const filteredConditions = conditions.filter(c =>
    c.condition_name.toLowerCase().includes(conditionSearch.toLowerCase())
  );

  // ---------- EFFECTS ----------
  React.useEffect(() => {
    fetch('http://localhost:5000/getallergies')
      .then(res => res.json())
      .then(data =>
        setAllergies(
          data.sort((a, b) =>
            a.allergy_name.toLowerCase().localeCompare(b.allergy_name.toLowerCase())
          )
        )
      );
  }, []);

  React.useEffect(() => {
    fetch('http://localhost:5000/getconditions')
      .then(res => res.json())
      .then(data =>
        setConditions(
          data.sort((a, b) =>
            a.condition_name.toLowerCase().localeCompare(b.condition_name.toLowerCase())
          )
        )
      );
  }, []);

  // ---------- FUNCTIONS ----------
  function showFlash(message: string, success: boolean = true) {
    setFlashMessage(message);
    setFound(success);
    setTimeout(() => setFlashMessage(''), 3000);
  }

  async function handleSubmit() {
    // ---------- VALIDATION ----------
    const requiredFields = [
      'first_name',
      'middle_name',
      'last_name',
      'birthday',
      'sex',
      'email',
      'phone',
      'student_id',
      'department',
      'level',
      'emergency_contact_name',
      'emergency_contact_phone'
    ];

    for (let field of requiredFields) {
      if (!studentData[field] || studentData[field].toString().trim() === '') {
        showFlash('Please fill all required fields!', false);
        return;
      }
    }

    // ---------- SUBMIT STUDENT ----------
    const response = await fetch('http://localhost:5000/addpatient', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({...studentData, is_student: true})
    });

    const success = await response.json();
    if (!success.success) {
      showFlash('This patient already exists!', false);
      return;
    }

    showFlash('Successfully saved new patient!');

    // ---------- SUBMIT ALLERGIES ----------
    if (selectedAllergy.length > 0) {
      const id = await fetch('http://localhost:5000/getmaxpatientid').then(res => res.json());
      await fetch('http://localhost:5000/addpatientallergies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: id[0].last_id,
          allergies: selectedAllergy
        })
      });
    }

    // ---------- SUBMIT CONDITIONS ----------
    if (selectedCondition.length > 0) {
      const id = await fetch('http://localhost:5000/getmaxpatientid').then(res => res.json());
      await fetch('http://localhost:5000/addpatientconditions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: id[0].last_id,
          conditions: selectedCondition
        })
      });
    }

    props.refetchPatients();
  }

  async function findStudent() {
    const idnum = idnumSearch.trim();
    if (idnum.length === 0){
      setFlashMessage('Please enter an id number!')
      return;
    }
    const response = await fetch(`http://localhost:5000/getstudent?idnum=${idnum}`);
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
    const response = await fetch('http://localhost:5000/addnewallergy', {
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
    const response = await fetch('http://localhost:5000/addnewcondition', {
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

  // ---------- CHECKBOX ELEMENTS ----------
  const allergyCheckboxes = filteredAllergies.map(item => (
    <li key={item.allergy_id}>
      <input
        type="checkbox"
        id={`allergy-${item.allergy_id}`}
        checked={selectedAllergy.includes(item.allergy_id)}
        onChange={() => toggleOption(item.allergy_id, 'allergy')}
      />
      <label htmlFor={`allergy-${item.allergy_id}`}>{item.allergy_name}</label>
    </li>
  ));

  const conditionsCheckboxes = filteredConditions.map(item => (
    <li key={item.condition_id}>
      <input
        type="checkbox"
        id={`condition-${item.condition_id}`}
        checked={selectedCondition.includes(item.condition_id)}
        onChange={() => toggleOption(item.condition_id, 'condition')}
      />
      <label htmlFor={`condition-${item.condition_id}`}>{item.condition_name}</label>
    </li>
  ));

//   // ---------- JSX ----------
//   return (
//     <div id="add-new-patient-div">
//       <div className='gray-bg'></div>

//       <div id="add-patient-form" className='modal-form'>
//         {/* Header */}
//         <div className='modal-header-div'>
//           <p className="modal-header">Add Patient</p>
//         </div>

//         <div id='main-add-patient-form'>
//         {flashMessage.length > 0 && (
//           <div className='flash-message' style={{ background: found ? '#4caf50' : '#FF3838' }}>
//             {flashMessage}
//           </div>
//         )}
//           {/* Search */}
//           <div>
//             <label htmlFor="search-by-id" style={{ display: 'inline-block', marginRight: '1rem' }}>
//               Find student by ID Number
//               <input
//                 type="text"
//                 id='search-by-id'
//                 placeholder='Search by ID Number'
//                 style={{ width: '250px' }}
//                 value={idnumSearch}
//                 onChange={(e) => setIdnumSearch(e.target.value)}
//               />
//             </label>
//             <button
//               style={{ height: '40px', width: '80px', borderRadius: '10px', border: 'none' }}
//               onClick={findStudent}
//             >
//               Search
//             </button>
//           </div>

//           {/* Student Information */}
//           <div id="student-information" className='form-div'>
//             <p className='form-header'>Student Information</p>
//             <div>
//               <label>First Name
//                 <input 
//                   type="text" 
//                   value={studentData?.first_name || ''}
//                   onChange={(e) => setStudentData({ ...studentData, first_name: e.target.value })}
//                 />
//               </label>
//               <label>Middle Name
//                 <input 
//                   type="text" 
//                   value={studentData?.middle_name || ''}
//                   onChange={(e) => setStudentData({ ...studentData, middle_name: e.target.value })}
//                 />
//               </label>
//               <label>Last Name
//                 <input 
//                   type="text" 
//                   value={studentData?.last_name || ''}
//                   onChange={(e) => setStudentData({ ...studentData, last_name: e.target.value })}
//                 />
//               </label>
//             </div>

//             <div>
//               <label>Birthdate
//                 <input 
//                   type="date" 
//                   value={studentData?.birthday || ''}
//                   onChange={(e) => setStudentData({ ...studentData, birthday: e.target.value })}
//                 />
//               </label>

//               <label>Sex
//                 <div id='gender-div'>
//                   <div>
//                     <input type="radio" name="gender" checked={studentData?.sex === 'Female'} 
//                       onChange={() => setStudentData({ ...studentData, sex: 'Female' })}/>
//                     <label>Female</label>
//                   </div>
//                   <div>
//                     <input type="radio" name="gender" checked={studentData?.sex === 'Male'} 
//                       onChange={() => setStudentData({ ...studentData, sex: 'Male' })}/>
//                     <label>Male</label>
//                   </div>
//                 </div>
//               </label>
//             </div>

//             <div>
//               <label>Email
//                 <input 
//                   type="text" 
//                   value={studentData?.email || ''}
//                   onChange={(e) => setStudentData({ ...studentData, email: e.target.value })}
//                 />
//               </label>

//               <label>Phone
//                 <input 
//                   type="text" 
//                   value={studentData?.phone || ''}
//                   onChange={(e) => setStudentData({ ...studentData, phone: e.target.value })}
//                 />
//               </label>
//             </div>

//             <div>
//               <label>ID Number
//                 <input 
//                   type="number" 
//                   value={studentData?.student_id || ''}
//                   onChange={(e) => setStudentData({ ...studentData, student_id: e.target.value })}
//                 />
//               </label>
//               <label>Department
//                 <input 
//                   type='text' 
//                   value={studentData?.department || ''}
//                   onChange={(e) => setStudentData({ ...studentData, department: e.target.value })}
//                 />
//               </label>
//               <label>Level
//                 <input 
//                   type='number' 
//                   value={studentData?.level || ''}
//                   onChange={(e) => setStudentData({ ...studentData, level: e.target.value })}
//                 />
//               </label>
//             </div>

//             <div>
//               <label>Emergency Contact Name
//                 <input 
//                   type="text" 
//                   value={studentData?.emergency_contact_name || ''}
//                   onChange={(e) => setStudentData({ ...studentData, emergency_contact_name: e.target.value })}
//                 />
//               </label>

//               <label>Emergency Contact Phone
//                 <input 
//                   type="text" 
//                   value={studentData?.emergency_contact_phone || ''}
//                   onChange={(e) => setStudentData({ ...studentData, emergency_contact_phone: e.target.value })}
//                 />
//               </label>
//             </div>
//           </div>

//           {/* Medical Information (optional) */}
//           <div id="medical-information" className='form-div'>
//             <p className='form-header'>Medical Information (Optional)</p>

//             {/* Allergies */}
//             <div>
//               <label>Allergies</label>
//               <input
//                 type="text"
//                 placeholder="Search Allergies"
//                 onClick={() => setShowAllergyDropdown(prev => !prev)}
//                 onChange={e => setAllergySearch(e.target.value)}
//               />
//               {showAllergyDropdown && (
//                 <div className="dropdown">
//                   <ul>{allergyCheckboxes}</ul>
//                   {allergySearch && !filteredAllergies.some(a => a.allergy_name.toLowerCase() === allergySearch.toLowerCase()) && (
//                     <li style={{ cursor: 'pointer', fontWeight: 'bold' }} onClick={() => addNewAllergy(allergySearch)}>
//                       + Add "{allergySearch}"
//                     </li>
//                   )}
//                 </div>
//               )}
//             </div>

//             {/* Conditions */}
//             <div>
//               <label>Conditions</label>
//               <input
//                 type="text"
//                 placeholder="Search Conditions"
//                 onClick={() => setShowConditionDropdown(prev => !prev)}
//                 onChange={e => setConditionSearch(e.target.value)}
//               />
//               {showConditionDropdown && (
//                 <div className="dropdown">
//                   <ul>{conditionsCheckboxes}</ul>
//                   {conditionSearch && !filteredConditions.some(c => c.condition_name.toLowerCase() === conditionSearch.toLowerCase()) && (
//                     <li style={{ cursor: 'pointer', fontWeight: 'bold' }} onClick={() => addNewCondition(conditionSearch)}>
//                       + Add "{conditionSearch}"
//                     </li>
//                   )}
//                 </div>
//               )}
//             </div>

//             {/* Notes */}
//             <div>
//               <label>Notes
//                 <input 
//                   type="text"
//                   onChange={(e) => setStudentData({ ...studentData, notes: e.target.value })}
//                 />
//               </label>
//             </div>
//           </div>
//         </div>

//         {/* Cancel / Save Buttons */}
//         <div id='cancel-save-div'>
//           <CancelSaveBtn hideForm={props.hideForm} submit={handleSubmit} />
//         </div>
//       </div>
//     </div>
//   );
// }

  // ---------- JSX ----------
  return (
    <div id="add-new-patient-div">
      <div className='gray-bg'></div>

      <div id="add-patient-form" className='modal-form'>
        {/* Header */}
        <div className='modal-header-div'>
          <p className="modal-header">Add Patient</p>
        </div>

        <div id='main-add-patient-form'>
          {/* Search */}
          {flashMessage.length > 0 ?
          <div className='flash-message' style={{background: found ? '#4caf50' : '#FF3838'}}>
            {flashMessage}
          </div>
          : null}
          <div>
            <label htmlFor="search-by-id" style={{ display: 'inline-block', marginRight: '1rem' }}> Find student by ID Number
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
              onClick={findStudent}
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
                    onChange={(e) => setStudentData({...studentData, first_name: e.target.value})} required />
              </label>
              <label htmlFor="middlename">Middle Name
                <input 
                    type="text" 
                    id="middlename" 
                    value={studentData?.middle_name || ''}
                    onChange={(e) => setStudentData({...studentData, middle_name: e.target.value})}  required/>
              </label>
              <label htmlFor="lastname">Last Name
                <input 
                    type="text" 
                    id="lastname" 
                    value={studentData?.last_name || ''} 
                    onChange={(e) => setStudentData({...studentData, last_name: e.target.value})} required/>
              </label>
            </div>

            <div>
              <label htmlFor="birthdate">Birthdate
                <input type="date" id='birthdate' value={studentData?.birthday} onChange={(e)  => setStudentData({...studentData, birthday: e.target.value})} required/>
              </label>

              <label style={{ display: 'block' }}>Sex
                <div id='gender-div'>
                  <div>
                    <input type="radio" name="gender" id='female' checked={studentData?.sex === 'Female'} value='Female' onChange={(e)  => setStudentData({...studentData, sex: e.target.value})} required/>
                    <label htmlFor="female">Female</label>
                  </div>
                  <div>
                    <input type="radio" name="gender" id="male" checked={studentData?.sex === 'Male'} value='Male' onChange={(e)  => setStudentData({...studentData, sex: e.target.value})} required/>
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
                    onChange={e => setAllergySearch(e.target.value)}
                  />

                  {showAllergyDropdown && (
                    <div className="dropdown">
                      <ul>{allergyCheckboxes}</ul>
                      {allergySearch && !filteredAllergies.some(a => a.allergy_name.toLowerCase() === allergySearch.toLowerCase()) && (
                        <li style={{ cursor: 'pointer', fontWeight: 'bold' }} onClick={() => addNewAllergy(allergySearch)}>
                          + Add "{allergySearch}"
                        </li>
                      )}
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
                    onChange={e => setConditionSearch(e.target.value)}
                  />

                  {showConditionDropdown && (
                    <div className="dropdown">
                      <ul>{conditionsCheckboxes}</ul>
                      {conditionSearch && !filteredConditions.some(c => c.condition_name.toLowerCase() === conditionSearch.toLowerCase()) && (
                        <li style={{ cursor: 'pointer', fontWeight: 'bold' }} onClick={() => addNewCondition(conditionSearch)}>
                          + Add "{conditionSearch}"
                        </li>
                      )}
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
