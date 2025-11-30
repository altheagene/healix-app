import '../patients.css'
import '../app.css'
import CancelSaveBtn from '~/components/cancelsavebtn'

export default function AddPatient(props:any){

    return(
        <div className='route-page'>
                <p className="route-header">Add Patient</p>
                <div>

                    <div>
                        <label htmlFor="search-by-id" style={{display: 'inline-block', marginRight: '1rem'}}>
                            <input type="text" id='search-by-id' placeholder='Search by ID Number' style={{width: '250px'}}/>
                        </label>
                        <button style={{height: '40px', width: '80px', borderRadius: '10px', border: 'none'}}>Search</button>
                    </div>
                    <div>
                        <img style={{width: '150px', height: '150px', borderRadius: '80px', backgroundColor: 'gray'}}></img>
                    </div>
                    <div id="student-information">
                        <p className='form-header'>Student Information</p>
                        <div>
                            <label htmlFor="firstname">First Name
                                <input type="text" id="firstname" />
                            </label>
                            

                            <label htmlFor="middlename">Middle Name
                                <input type="text" id="middlename" />
                            </label>
            

                            <label htmlFor="lastname">Last Name
                                <input type="text" id="lastname" />
                            </label>
                            
                        </div>

                        <div>
                            <label htmlFor="birthdate">Birthdate
                                 <input type="date" />
                            </label>
                           
                            <label htmlFor="" style={{display: 'block'}}>Sex
                                <div id='gender-div'>
                                <input type="radio" name="gender" id='female' />
                                <label htmlFor="female">Female</label>

                                <input type="radio" name="gender" id="male" value='Male'/>
                                <label htmlFor="male">Male</label>
                            </div>
                            </label>
                            
                        </div>

                        <div>
                            <label htmlFor="idno">ID Number
                                <input type="number"  id="idno" />
                            </label>

                            <label htmlFor="department">Department
                                <select name="" id="department">
                                    <option value="basic education">Basic Education</option>
                                    <option value="college">College</option>
                                </select>
                            </label>

                            <label htmlFor=""></label>
                            
                           
                            <label htmlFor="level">Level
                                <select name="" id="">
                                    <option value="1">1</option>
                                    <option value="2">2</option>
                                    <option value="3">3</option>
                                    <option value="4">4</option>
                                </select>
                            </label>
                            
                        </div>
                    </div>

                    <div id="medical-information">
                        <p className='form-header'>Medical Information</p>

                        <div>
                            <div>
                                <label>Allergies</label>
                                <div id="allergies-container"></div>
                                <div>
                                    <input type="text" placeholder="Search Allergies" />
                                    <div>
                                        <ul>
                                            {/* list of allergies with checkboxes */}
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label>Conditions</label>
                                <div id="conditions-container"></div>
                                <div>
                                    <input type="text" placeholder="Search Conditions" />
                                    <div>
                                        <ul>
                                            {/* list of allergies with checkboxes */}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            
                        </div>
                        
                    </div>

                    <div id="emergency-contact-information">
                        <p className='form-header'>Emergency Contact Information</p>
                        <div>
                            <label htmlFor="firstname">First Name
                                <input type="text" id="firstname" />
                            </label>
                            

                            <label htmlFor="middlename">Middle Name
                                <input type="text" id="middlename" />
                            </label>
            

                            <label htmlFor="lastname">Last Name
                                <input type="text" id="lastname" />
                            </label>
                            
                        </div>

                        <div>
                             <label htmlFor="relationship">Relationship
                                <input type="text" id="relationship" />
                            </label>
                            

                            <label htmlFor="phone">Phone
                                <input type="text" id="phone" />
                            </label>
            

                            <label htmlFor="email">Email
                                <input type="text" id="email" />
                            </label>
                        </div>
                    </div>
                    <CancelSaveBtn hideForm={props.hideForm}></CancelSaveBtn>
                </div>
                
            </div>
    )
}