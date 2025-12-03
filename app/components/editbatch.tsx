import React from "react"
import CancelSaveBtn from "./cancelsavebtn"

export default function EditBatch(props:any){
    return(
        <div className='modal-form-div'>
            <div className='gray-bg'></div>
            <div className='modal-form'>
                <div className='modal-header-div'>
                    <p className='modal-header'>Edit Batch</p>
                </div>

                <div className='main-form-content'>
                    <label htmlFor="">Supply Name
                        <input type="text"/>
                    </label>

                    <label htmlFor="batch-number">Batch Number
                        <input type="text" id="batch-number"/>
                    </label>
                    <div>
                        <label htmlFor="expiration-date">Expiration Date
                            <input type="date"/>
                        </label>
                        <div style={{display: 'flex', alignItems: 'center', height: '30px'}}>
                            <input type="checkbox"
                                    id="noexpiry" 
                                    style={{width: '20px', margin: '0 0.5rem 0 0', display: 'inline-block', backgroundColor: 'none'}}
                                   /> 
                            <label htmlFor="noexpiry" style={{height: '100%', display: 'flex', alignItems: 'center'}}>This has no expiration date</label>
                            
                        </div>
                    </div>
                </div>
                <CancelSaveBtn></CancelSaveBtn>
            </div>
        </div>
    )
}