export default function AddPatientForm(props:any){

    return(
        <div id='add-patient-div'>
            <div className="gray-bg"></div>
            <div  id="create-record-div">
                <div style={{margin: '1rem 0'}}>
                    <p>Enter Student ID Number:</p>
                    <input type="text" id='search-by-idno' style={{width: '80%', height: '30px', margin: '1rem 0'}}/>
                    <button id='add-patient-search-btn'>Search</button>
                </div>

                <div id="student-record-create-div">
                    <div style={{width: '100%', display:'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '0.5rem'}}>
                        <img style={{height: '120px', width: '120px', borderRadius: '70px', backgroundColor: 'gray'}}></img>
                        <p>Dakota Fanning</p>
                        <p>ID No: 23827876</p>
                        <p>10 years old <span>Female</span></p>
                    </div>

                    <div>
                        <p style={{fontWeight: '500'}}>Medical Information</p>
                        <p className="info">Allergies</p>
                        <p className="info">Conditions</p>
                    </div>

                    <div>
                        <p style={{fontWeight: '500'}}>Emergency contact</p>
                        <p className="info">Name: Elle Fanning</p>
                        <p className="info">Relationship: Sister</p>
                        <p className="info">Contact: </p>
                    </div>

                    <div style={{display:'flex', gap: '1rem'}}>
                        <button style={{width: '120px', height:'30px', backgroundColor: '#E3412F', border: 'none', color:'white'}} onClick={props.hideForm}>Cancel</button>
                        <button style={{width: '120px',  height:'30px', backgroundColor: '#48C72C', border: 'none'}}>Create Record</button>
                    </div>
                </div>
            </div>
        </div>
    )
}