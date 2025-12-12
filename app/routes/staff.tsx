import Searchbar from "~/components/searchbar"
import AddStaff from "~/components/addstaff"
import EditStaff from "~/components/editstaff"
import React from "react"
import '../app.css'
import {API_BASE_URL} from '../config'
import 'bootstrap-icons/font/bootstrap-icons.css'



export default function Staff() {
    const [staff, setStaff] = React.useState<any[]>([])
    const [searchQuery, setSearchQuery] = React.useState('')
    const [showStaff, setShowStaff] = React.useState(false)
    const [showEdit, setShowEdit] = React.useState(false)

    // Fetch staff on mount
    React.useEffect(() => {
        fetch(`${API_BASE_URL}/getstaffandcateg`)
            .then(res => res.json())
            .then(data => setStaff(data))
    }, [])

    function handleEdit(id:number){
        const userid= localStorage.getItem('userid');
        if (userid && parseInt(userid) === id){
            console.log('YES YOU CAN EDIT!');
            setShowEdit(true);
        }else{
            console.log('ACCESS DENIED! YOU CANNOT EDIT THIS USER!')
        }
    }

    // Filter staff based on search query
    const filteredStaff = staff.filter(person => {
        const fullName = `${person.first_name} ${person.last_name}`.toLowerCase()
        const role = person.category_name?.toLowerCase() || ''
        const email = person.email?.toLowerCase() || ''
        const phone = person.phone?.toLowerCase() || ''
        const query = searchQuery.toLowerCase()
        return fullName.includes(query) || role.includes(query) || email.includes(query) || phone.includes(query)
    })

    return (
        <div className="route-page">
            {showStaff && <AddStaff hideForm={() => setShowStaff(false)} />}
            <h1 className="route-header">Staff</h1>
            <p className="route-page-desc">Manage clinic staff, roles, and permissions</p>
            {showEdit ? <EditStaff hideForm={() => setShowEdit(false)}/> : null}
            {/* Searchbar */}
            <input type="text"
                id='staff-searchbar'
                placeholder='Search staff by name, role, email or phone'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />

            <button onClick={() => setShowStaff(true)}>+ Add Staff</button>

            <div 
                //id="staff-table-container"
                className='table-container'>
                <table id="staff-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Role</th>
                            <th>Phone</th>
                            <th>Email</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStaff.length > 0 ? filteredStaff.map(person => (
                            <tr key={person.staff_id}>
                                <td>{person.staff_id}</td>
                                <td>{person.first_name} {person.last_name}</td>
                                <td>{person.category_name}</td>
                                <td>{person.phone}</td>
                                <td>{person.email}</td>
                                <td>
                                    <button><i className="bi bi-eye"></i></button>
                                    <button onClick={() => handleEdit(person.staff_id)}><i className="bi bi-pencil"></i></button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '15px' }}>
                                    No staff found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
