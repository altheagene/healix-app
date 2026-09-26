import { apiFetch } from "../api";
import CancelSaveBtn from "./cancelsavebtn"
import { useEffect, useState } from "react"

export default function EditStaff(props:any){
    const id = localStorage.getItem('userid')
    const [person, setPerson] = useState(props.chosenId);
    const [roles, setRoles] = useState<any[]>()
    const [staff, setStaff] = useState<any[]>()
    const [showPass, setShowPass] = useState(false)

   async function handleSubmit() {
        try {
            const response = await apiFetch(`/updatestaff`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(staff)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            if(result.success){
                alert('Successfully edited the patient!')
                props.hideForm()
                props.refetch()
            }
            
        } catch (err) {
            console.error('Failed to submit:', err);
        }
}

    useEffect(() => {
        const fetchStaff = async () => {
            try {
                const res = await apiFetch(`/findstaff?id=${props.chosenId}`);
                const data = await res.json();
                setStaff(data[0]);
            } catch (err) {
                // console.error(err);
            }
        };

        fetchStaff()

        apiFetch(`/getstaffcategories`)
        .then(res => res.json())
        .then(data => setRoles(data))
    }, [])

    console.log(staff)
    console.log(roles)


    return(
        <div className="modal-form-div">
            <div className="gray-bg"></div>
            <div className="modal-form w-[500px]" style={{maxHeight: 'calc(100vh - 100px)'}}>
                <div className="modal-header-div">
                    <h2>Edit Staff</h2>
                </div>
                <div className="main-form-content">

                    <label htmlFor="firstname"> First Name
                        <input type="text" id="firstname" value={person?.first_name} onChange={(e) => setStaff({...person, first_name: e.target.value})}/>
                    </label>

                    <label htmlFor="lastname"> Last Name
                        <input type="text" id="lastname" value={person?.last_name} onChange={(e) => setStaff({...person, last_name: e.target.value})}/>
                    </label>

                    <label htmlFor="sex">
                        Sex
                        <div style={{display: 'flex', gap: '2rem', alignItems: 'center'}}>
                            <label htmlFor="male"> 
                                <input
                                    type="radio"
                                    name="gender"
                                    id="male"
                                    value="male"
                                    onChange={(e) => setStaff({ ...person, sex: e.target.value })}
                                    checked={person?.sex === 'male'}
                                    />Male
                            </label>

                            <label htmlFor="female"> 
                                <input
                                    type="radio"
                                    name="gender"
                                    id="female"
                                    value="female"
                                    checked={person?.sex === 'female'}
                                    onChange={(e) => setStaff({ ...person, sex: e.target.value })}
                                    />Female
                            </label>
                        </div>
                    </label>

                    <select name="" id="" value={person?.staff_catefory_id} onChange={(e) => setStaff({...person, staff_category_id : e.target.value})}>
                        {roles?.map((role) => {
                            return(
                                <option value={role.staff_category_id}>{role.category_name}</option>
                            )
                        })}
                    </select>
                    
                    <label htmlFor="phone">
                         <input type="text" name="" id="phone" value={person?.phone} onChange={(e) => setStaff({...person, phone : e.target.value})}/>
                    </label>
                    
                    <label htmlFor="email">Email
                        <input type="text" name="" id="email" value={person?.email} onChange={(e) => setStaff({...person, email : e.target.value})}/>
                    </label>

                    <label htmlFor="username">
                         <input type="text" name="" id="username" value={person?.username} onChange={(e) => setStaff({...person, username : e.target.value})}/>
                    </label>

                    <label htmlFor="password">Password
                        <input type={showPass ? 'text' : 'password'} value={person?.password} onChange={(e) => setStaff({...person, password : e.target.value})}/>
                        <button onClick={() => setShowPass(prev => !prev)}><i className="bi bi-eye"></i></button>
                    </label>


                </div>
                <CancelSaveBtn hideForm={props.hideForm} submit={handleSubmit}/>
            </div>
        </div>
    )
}