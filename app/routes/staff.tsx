import Searchbar from "~/components/searchbar"

export default function Staff(){
    return(
        <div className="route-page">
            <h1 className="route-header">Staff</h1>
            <p className="route-page-desc">Manage clinic staff, roles, and permissions</p>
            <Searchbar id='staff-searchbar' placeholder='Search staff'/>
            
            <div id="staff-table-container" className='table-container'>
                <table id="staff-table">
                    <tr>
                        <th></th>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Role</th>
                        <th>Phone</th>
                        <th>Email</th>
                        <th></th>
                    </tr>
                </table>
            </div>
        </div>
    )
}