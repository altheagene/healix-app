import Searchbar from "~/components/searchbar"
import React from "react"

export default function Staff(){

    const [staff, setStaff] = React.useState<any[]>()
    React.useEffect(() => {
        fetch(`http://localhost:5000/getstaffandcateg`)
        .then(res => res.json())
        .then(data => setStaff(data))
    }, [])

    console.log(staff)
    return(
        <div className="route-page">
            <h1 className="route-header">Staff</h1>
            <p className="route-page-desc">Manage clinic staff, roles, and permissions</p>
            <Searchbar id='staff-searchbar' placeholder='Search staff'/>
            
            <div id="staff-table-container" className='table-container'>
                <table id="staff-table">
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Role</th>
                        <th>Phone</th>
                        <th>Email</th>
                        <th></th>
                    </tr>
                    {
                        staff?.map(person => {
                            return(
                                <tr>
                                    <td>{person.staff_id}</td>
                                    <td>{person.first_name} {person.last_name}</td>
                                    <td>{person.category_name}</td>
                                    <td>{person.phone}</td>
                                    <td>{person.email}</td>
                                    <td><i className="bi bi-three-dots"></i></td>
                                </tr>
                            )
                        })
                    }
                </table>
            </div>
        </div>
    )
}