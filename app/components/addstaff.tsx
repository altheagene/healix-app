import CancelSaveBtn from "./cancelsavebtn"
import React from "react"
import {API_BASE_URL} from '../config'

export default function AddStaff(props:any){

    const [staffData, setStaffData] = React.useState<any>()
    const [roles, setRoles] = React.useState<any[]>()
    const [staff, setStaff] = React.useState<any[]>();
    const [showPass, setShowPass] = React.useState(false)




    React.useEffect(() => {
        fetch(`${API_BASE_URL}/getall?table=staff_categories`)
        .then(res => res.json())
        .then(data => setRoles(data))

        fetch(`${API_BASE_URL}/getall?table=staff`)
        .then(res => res.json())
        .then(data => setStaff(data))
    }, [])


    async function handleSubmit(){
        console.log(staffData);
        if (
        !staffData?.first_name ||
            !staffData?.last_name ||
            !staffData?.birthday ||
            !staffData?.sex ||
            !staffData?.staff_category_id ||
            !staffData?.email ||
            !staffData?.phone||
            !staffData?.username ||
            !staffData?.password
        ) {
            alert("Please fill out all required fields.");
            return;
        }
        let success = true;

        const exists = staff?.some(person =>
            person.username === staffData.username
        )

        if (exists) {
            alert('This username already exists!')
            return
        }

        const response = await fetch(`${API_BASE_URL}/addstaff`,
            {
                method: 'POST',
                headers:{
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(staffData)
            }
        )
        success = await response.json()
        console.log(success)

        if (success.success){
            alert('Successfully added!')
        return;
        }
    }

    console.log(roles)
    return(
        <div id="add-staff-div" className="modal-form-div">
            <div className="gray-bg"></div>
            <div className="modal-form"  style={{width: 500}}>
                <div className="modal-header-div">
                    <p className="modal-header">Add Staff</p>
                </div>

            <div className="main-form-content">
                <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
                    <label htmlFor="firstname">First Name <span style={{ color: 'red' }}>*</span>
                        <input 
                            type="text" 
                            id="firstname" 
                            value={staffData?.first_name || ''}
                            onChange={(e) => setStaffData({...staffData, first_name: e.target.value})}  />
                    </label>
                    <label htmlFor="middlename">Middle Name 
                        <input 
                            type="text" 
                            id="middlename" 
                            value={staffData?.middle_name || ''}
                            onChange={(e) => setStaffData({...staffData, middle_name: e.target.value})}  />
                    </label>
                    <label htmlFor="lastname">Last Name <span style={{ color: 'red' }}>*</span>
                        <input 
                            type="text" 
                            id="lastname" 
                            value={staffData?.last_name || ''} 
                            onChange={(e) => setStaffData({...staffData, last_name: e.target.value})} />
                    </label>
                </div>

                <div style={{display: 'flex', gap: '1rem'}}>
                    <label htmlFor="birthdate">Birthdate <span style={{ color: 'red' }}>*</span>
                        <input type="date" id='birthdate' value={staffData?.birthday} onChange={(e)  => setStaffData({...staffData, birthday: e.target.value})}/>
                    </label>

                    <label style={{ display: 'block' }}>Sex <span style={{ color: 'red' }}>*</span>
                        <div id='gender-div' style={{display: 'flex', gap: '0.6rem', flexDirection: 'column', marginTop: '0.5rem'}}>
                            <div>
                                <input type="radio" name="gender" id='female' value={'Female'} onChange={(e) => setStaffData({...staffData, sex: e.target.value})}/>
                                <label htmlFor="female">Female</label>
                            </div>
                            <div>
                                <input type="radio" name="gender" id="male" value={'Male'} onChange={(e) => setStaffData({...staffData, sex: e.target.value})}/>
                                <label htmlFor="male" >Male</label>
                            </div>
                        </div>
                    </label>
                </div>

                <label htmlFor="">Role <span style={{ color: 'red' }}>*</span>
                    <select name="" id="" value={staffData?.staff_category_id} onChange={(e) => setStaffData({...staffData, staff_category_id: e.target.value})}>
                        {roles?.map(role => {
                            return(
                                <option value={role.staff_category_id}>{role.category_name}</option>
                            )
                        })}
                    </select>
                </label>
                <div style={{display: 'flex', gap: '1rem', flexDirection: 'column'}}>
                    <label htmlFor="email">Email <span style={{ color: 'red' }}>*</span>
                        <input type="text" id='email' value={staffData?.email} onChange={(e)  => setStaffData({...staffData, email: e.target.value})}/>
                    </label>

                    <label htmlFor="phone">Phone <span style={{ color: 'red' }}>*</span>
                        <input type="text" id='phone' value={staffData?.phone} onChange={(e)  => setStaffData({...staffData, phone: e.target.value})}/>
                    </label>

                    <label htmlFor="username">Username <span style={{ color: 'red' }}>*</span>
                        <input type="text" id='username' value={staffData?.username} onChange={(e)  => setStaffData({...staffData, username: e.target.value})}/>
                    </label>

                    <label htmlFor="password">Password <span style={{ color: 'red' }}>*</span>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}} >
                        <input style={{width: '85%'}} type={showPass ? 'text' : 'password'} id='password' value={staffData?.password} onChange={(e)  => setStaffData({...staffData, password: e.target.value})}/>
                         <button  onClick={() => setShowPass(prev => !prev)} style={{backgroundColor: 'transparent', border: 'none', fontSize: '1rem'}}><i className="bi bi-eye"></i></button>
                    </div>
                    </label>
                </div>

            </div>
            

                <CancelSaveBtn hideForm={props.hideForm} submit={handleSubmit}/>
            </div>
        </div>
    )
}