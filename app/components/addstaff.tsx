import CancelSaveBtn from "./cancelsavebtn"
import React from "react"

export default function AddStaff(props:any){

    const [staffData, setStaffData] = React.useState<any[]>()
    const [roles, setRoles] = React.useState<any[]>()

    React.useEffect(() => {
        fetch(`http://localhost:5000/getall?table=staff_categories`)
        .then(res => res.json())
        .then(data => setRoles(data))
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
            !staffData?.phone
        ) {
            alert("Please fill out all required fields.");
            return;
        }
        let success = true;
        const response = await fetch('http://localhost:5000/addstaff',
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
            <div className="modal-form" id="edit-details-div" style={{width: 500}}>
                <div className="modal-header-div">
                    <p className="modal-header">Add Staff</p>
                </div>

            <div className="main-form-content">
                <div>
                    <label htmlFor="firstname">First Name
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
                    <label htmlFor="lastname">Last Name
                        <input 
                            type="text" 
                            id="lastname" 
                            value={staffData?.last_name || ''} 
                            onChange={(e) => setStaffData({...staffData, last_name: e.target.value})} />
                    </label>
                </div>

                <div style={{display: 'flex', gap: '1rem'}}>
                    <label htmlFor="birthdate">Birthdate
                        <input type="date" id='birthdate' value={staffData?.birthday} onChange={(e)  => setStaffData({...staffData, birthday: e.target.value})}/>
                    </label>

                    <label style={{ display: 'block' }}>Sex
                        <div id='gender-div'>
                        <div>
                            <input type="radio" name="gender" id='female' />
                            <label htmlFor="female">Female</label>
                        </div>
                        <div>
                            <input type="radio" name="gender" id="male"/>
                            <label htmlFor="male">Male</label>
                        </div>
                        </div>
                    </label>
                </div>

                <label htmlFor="">Role
                    <select name="" id="" value={staffData?.staff_category_id} onChange={(e) => setStaffData({...staffData, staff_category_id: e.target.value})}>
                        {roles?.map(role => {
                            return(
                                <option value={role.staff_category_id}>{role.category_name}</option>
                            )
                        })}
                    </select>
                </label>
                <div>
                    <label htmlFor="email">Email
                        <input type="text" id='email' value={staffData?.email} onChange={(e)  => setStaffData({...staffData, email: e.target.value})}/>
                    </label>

                    <label htmlFor="phone">Phone
                        <input type="text" id='phone' value={staffData?.phone} onChange={(e)  => setStaffData({...staffData, phone: e.target.value})}/>
                    </label>
                </div>

            </div>
            

                <CancelSaveBtn hideForm={props.hideForm} submit={handleSubmit}/>
            </div>
        </div>
    )
}