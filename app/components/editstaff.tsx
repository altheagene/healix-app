import { apiFetch } from "../api";
import CancelSaveBtn from "./cancelsavebtn"
import { useEffect, useState } from "react"

export default function EditStaff(props:any){
    const [roles, setRoles] = useState<any[]>([])
    const [staff, setStaff] = useState<any>(null)
    const [showPass, setShowPass] = useState(false)

    function updateField(field: string, value: string) {
        setStaff((current: any) => ({ ...current, [field]: value }))
    }

   async function handleSubmit() {
        if (!staff?.staff_id) return
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
                alert('Successfully edited the staff member!')
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
                if (data?.[0]) {
                    setStaff({ ...data[0], password: "" })
                }
            } catch (err) {
                console.error(err);
            }
        };

        fetchStaff()

        apiFetch(`/getstaffcategories`)
        .then(res => res.json())
        .then(data => setRoles(data))
    }, [props.chosenId])

    return(
        <div className="modal-form-div">
            <div className="gray-bg"></div>
            <div className="modal-form w-[500px]" style={{maxHeight: 'calc(100vh - 100px)'}}>
                <div className="modal-header-div">
                    <h2>Edit Staff</h2>
                </div>
                <div className="main-form-content">

                    <label htmlFor="firstname"> First Name
                        <input type="text" id="firstname" value={staff?.first_name || ""} onChange={(e) => updateField("first_name", e.target.value)}/>
                    </label>

                    <label htmlFor="lastname"> Last Name
                        <input type="text" id="lastname" value={staff?.last_name || ""} onChange={(e) => updateField("last_name", e.target.value)}/>
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
                                    onChange={(e) => updateField("sex", e.target.value)}
                                    checked={String(staff?.sex || "").toLowerCase() === "male"}
                                    />Male
                            </label>

                            <label htmlFor="female"> 
                                <input
                                    type="radio"
                                    name="gender"
                                    id="female"
                                    value="female"
                                    checked={String(staff?.sex || "").toLowerCase() === "female"}
                                    onChange={(e) => updateField("sex", e.target.value)}
                                    />Female
                            </label>
                        </div>
                    </label>

                    <label htmlFor="role">Role
                        <select id="role" value={staff?.staff_category_id != null ? String(staff.staff_category_id) : ""} onChange={(e) => updateField("staff_category_id", e.target.value)}>
                            {roles.map((role) => {
                                return(
                                    <option key={role.staff_category_id} value={String(role.staff_category_id)}>{role.category_name}</option>
                                )
                            })}
                        </select>
                    </label>
                    
                    <label htmlFor="phone">Phone
                         <input type="text" name="" id="phone" value={staff?.phone || ""} onChange={(e) => updateField("phone", e.target.value)}/>
                    </label>
                    
                    <label htmlFor="email">Email
                        <input type="text" name="" id="email" value={staff?.email || ""} onChange={(e) => updateField("email", e.target.value)}/>
                    </label>

                    <label htmlFor="username">Username
                         <input type="text" name="" id="username" value={staff?.username || ""} onChange={(e) => updateField("username", e.target.value)}/>
                    </label>

                    <label htmlFor="password">Password
                        <input type={showPass ? "text" : "password"} id="password" placeholder="Leave blank to keep the current password" value={staff?.password || ""} onChange={(e) => updateField("password", e.target.value)}/>
                        <button type="button" onClick={() => setShowPass(prev => !prev)}><i className="bi bi-eye"></i></button>
                    </label>


                </div>
                <CancelSaveBtn hideForm={props.hideForm} submit={handleSubmit}/>
            </div>
        </div>
    )
}
