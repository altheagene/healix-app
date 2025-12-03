
import '../patients.css';
import '../app.css';
import CancelSaveBtn from './cancelsavebtn';
import React from 'react';

export default function AddPatient(props: any) {
  // ---------- STATE ----------
  const [idnumSearch, setIdnumSearch] = React.useState('');
  const [studentData, setStudentData] = React.useState({});
  const [allergies, setAllergies] = React.useState<any[]>([]);
  const [conditions, setConditions] = React.useState<any[]>([]);
  const [selectedAllergy, setSelectedAllergy] = React.useState<number[]>([]);
  const [selectedCondition, setSelectedCondition] = React.useState<number[]>([]);
  const [showAllergyDropdown, setShowAllergyDropdown] = React.useState(false);
  const [showConditionDropdown, setShowConditionDropdown] = React.useState(false);
  const [allergyElements, setAllergyElements] = React.useState([]);
  const [conditionElements, setConditionElements] = React.useState([]);


  async function handleSubmit(){
    console.log(studentData);
    

    const response = await fetch('http://localhost:5000/addpatient',
        {
            method: 'POST',
            headers:{
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(studentData)
        }
    )
    console.log(response.json())

    console.log(selectedAllergy)
    if (selectedAllergy.length > 0){
        const id = await fetch('http://localhost:5000/getmaxpatientid').
        then(res => res.json())
        
        await fetch('http://localhost:5000/addpatientallergies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                'patient_id': id[0].last_id,
                'allergies' : selectedAllergy
            })
        });
    }

    if (selectedCondition.length > 0){
        const id = await fetch('http://localhost:5000/getmaxpatientid').
        then(res => res.json())
        
        await fetch('http://localhost:5000/addpatientconditions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                'patient_id': id[0].last_id,
                'conditions' : selectedCondition
            })
        });
    }

    
    props.refetchPatients()
  }
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

//   React.useEffect(() => {
//     const elements = selectedAllergy.map(item => {
//         const allergy = allergies.find(item => item.id === item)
//         const name = allergy
//         return(
//             <li></li>
//         )
//     })
//     setSelectedAllergy()
//   }, [selectedAllergy])

//   React.useEffect(() => {
//     conditionElements = conditions.map(item => {
//         if (selectedCondition.includes(item.condition_id )){
//             return(
//                 <li>{item.condition_name}</li>
//             )
//         }
//     })
//   }, [selectedCondition])

  // ---------- FUNCTIONS ----------
  function findStudent() {
    const idnum = idnumSearch.trim();
    fetch(`http://localhost:5000/getstudent?idnum=${idnum}`)
      .then(res => res.json())
      .then(data => setStudentData({...data[0], is_student:true}));

    setSelectedAllergy([])
    setSelectedCondition([])
    setShowAllergyDropdown(false)
    setShowConditionDropdown(false)
  }

  

  function toggleOption(id: number, type: 'allergy' | 'condition') {
    if (type === 'allergy') {
      if (!selectedAllergy.includes(id)) setSelectedAllergy(prev => [...prev, id]);
      else setSelectedAllergy(prev => prev.filter(item => item !== id));
    } else {
      if (!selectedCondition.includes(id)) setSelectedCondition(prev => [...prev, id]);
      else setSelectedCondition(prev => prev.filter(item => item !== id));
    }
  }

  // ---------- CHECKBOXES ----------
  const allergyCheckboxes = allergies.map(item => (
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

  const conditionsCheckboxes = conditions.map(item => (
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

                    <ul>
                        {allergyElements}
                    </ul>
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
                        <ul>{conditionsCheckboxes}</ul>
                        </div>
                    )}

                    <ul>
                        {conditionElements}
                    </ul>
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
