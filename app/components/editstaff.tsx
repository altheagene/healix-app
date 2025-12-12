import CancelSaveBtn from "./cancelsavebtn"
import { useEffect, useState } from "react"
import {API_BASE_URL} from '../config'

export default function EditStaff(props:any){
    const id = localStorage.getItem('userid')
    
    const [roles, setRoles] = useState<any[]>()
    const [staff, setStaff] = useState<any[]>()
    const [showPass, setShowPass] = useState(false)

   async function handleSubmit() {
    try {
        const response = await fetch(`${API_BASE_URL}/updatestaff`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(staff)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log(result);
    } catch (err) {
        console.error('Failed to submit:', err);
    }
}
    useEffect(() => {
        const fetchStaff = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/findstaff?id=${id}`);
                const data = await res.json();
                setStaff(data[0]);
            } catch (err) {
                // console.error(err);
            }
        };

        fetchStaff()

        fetch(`${API_BASE_URL}/getall?table=staff_categories`)
        .then(res => res.json())
        .then(data => setRoles(data))
    }, [])

    console.log(staff)
    console.log(roles)


    return(
        <div className="modal-form-div">
            <div className="gray-bg"></div>
            <div className="modal-form" style={{maxHeight: 'calc(100vh - 100px)'}}>
                <div className="modal-header-div">
                    <h2>Edit Staff</h2>
                </div>
                <div className="main-form-content">

                    <label htmlFor="firstname"> First Name
                        <input type="text" id="firstname" value={staff?.first_name} onChange={(e) => setStaff({...staff, first_name: e.target.value})}/>
                    </label>

                    <label htmlFor="lastname"> Last Name
                        <input type="text" id="lastname" value={staff?.last_name} onChange={(e) => setStaff({...staff, last_name: e.target.value})}/>
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
                                    onChange={(e) => setStaff({ ...staff, sex: e.target.value })}
                                    checked={staff?.sex === 'male'}
                                    />Male
                            </label>

                            <label htmlFor="female"> 
                                <input
                                    type="radio"
                                    name="gender"
                                    id="female"
                                    value="female"
                                    checked={staff?.sex === 'female'}
                                    onChange={(e) => setStaff({ ...staff, sex: e.target.value })}
                                    />Female
                            </label>
                        </div>
                    </label>

                    <select name="" id="" value={staff?.staff_catefory_id} onChange={(e) => setStaff({...staff, staff_category_id : e.target.value})}>
                        {roles?.map((role) => {
                            return(
                                <option value={role.staff_category_id}>{role.category_name}</option>
                            )
                        })}
                    </select>
                    
                    <label htmlFor="phone">
                         <input type="text" name="" id="phone" value={staff?.phone} onChange={(e) => setStaff({...staff, phone : e.target.value})}/>
                    </label>
                    
                    <label htmlFor="email">Email
                        <input type="text" name="" id="email" value={staff?.email} onChange={(e) => setStaff({...staff, email : e.target.value})}/>
                    </label>

                    <label htmlFor="username">
                         <input type="text" name="" id="username" value={staff?.username} onChange={(e) => setStaff({...staff, username : e.target.value})}/>
                    </label>

                    <label htmlFor="password">Password
                        <input type={showPass ? 'text' : 'password'} value={staff?.password} onChange={(e) => setStaff({...staff, password : e.target.value})}/>
                        <button onClick={() => setShowPass(prev => !prev)}><i className="bi bi-eye"></i></button>
                    </label>


                </div>
                <CancelSaveBtn hideForm={props.hideForm} submit={handleSubmit}/>
            </div>
        </div>
    )
}