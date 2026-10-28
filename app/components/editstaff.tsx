import { apiFetch } from "../api";
import Modal from "./modal"
import CancelSaveBtn from "./cancelsavebtn"
import { useEffect, useState } from "react"

export default function EditStaff(props:any){
    const [roles, setRoles] = useState<any[]>([])
    const [staff, setStaff] = useState<any>(null)
    const [newPassword, setNewPassword] = useState("")
    const [resetMessage, setResetMessage] = useState("")
    const isAdmin = localStorage.getItem("admin") === "true"

    // For staff who forgot their password. The server also signs them out everywhere.
    async function resetPassword() {
        setResetMessage("")
        const response = await apiFetch(`/adminresetpassword`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ staff_id: staff?.staff_id, new_password: newPassword })
        })
        const result = await response.json()
        if (response.ok && result.success) {
            setNewPassword("")
            setResetMessage("Password reset. They have been signed out and can log in with the new password.")
        } else {
            setResetMessage(result.error || "Could not reset the password.")
        }
    }

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
                    setStaff(data[0])
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
        <Modal title="Edit Staff" onClose={props.hideForm} width={500}>
            <div className="contents">
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
                        <select id="role" value={staff?.staff_category_id != null ? String(staff.staff_category_id) : ""} onChange={(e) => updateField("staff_category_id", e.target.value)} disabled={localStorage.getItem("admin") !== "true"}>
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

                    {isAdmin && (
                        <fieldset style={{border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.75rem'}}>
                            <legend>Reset password</legend>
                            <label htmlFor="new-password">New password (at least 8 characters)
                                <input type="password" id="new-password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}/>
                            </label>
                            <button type="button" onClick={resetPassword} disabled={newPassword.length < 8}>Reset password</button>
                            {resetMessage && <p role="status">{resetMessage}</p>}
                        </fieldset>
                    )}

                </div>
                <CancelSaveBtn hideForm={props.hideForm} submit={handleSubmit}/>
            </div>
        </Modal>
    )
}
