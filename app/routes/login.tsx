
import '../login.css'
import React, { use } from 'react'

export default function LoginPage(props:any){

  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');


 async function handleSubmit(){
  const response = await fetch(`http://127.0.0.1:5000/validateuser`, {
    method: 'POST',
    headers: {
      'Content-Type' : 'application/json'
    },
    body: JSON.stringify({username: username, password: password})
  })

  const success = await response.json()

  console.log(success)

  if(success.success.length > 0){
    props.validate()
  }else{
    props.setFlash()
  }
 }
  return(
    <div className="login-container">
      <div className="login-form">
        <h2>Healix</h2>

        <label htmlFor="">
           <input type="text" className='login-input' placeholder='Username' onChange={(e) => setUsername(e.target.value)}/>
        </label>

        <label htmlFor="">
          <input type="password" className='login-input' placeholder='Password'  onChange={(e) => setPassword(e.target.value)}/>
        </label>
        

        <button onClick={handleSubmit}>Login</button>
      </div>
    </div>
  )
}