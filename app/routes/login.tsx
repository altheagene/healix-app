import { apiFetch } from "../api";
import { ADMIN_ROLE_ID } from "../roles";
import '../login.css'
import React from 'react'

export default function LoginPage(props: any) {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [flashMessage, setFlashMessage] = React.useState(''); // Flash message state

  async function handleSubmit() {
    const response = await apiFetch(`/validateuser`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const result = await response.json();

    if (response.ok && result.token) {
      localStorage.setItem('token', result.token);
      localStorage.setItem('userid', result.user.staff_id);
      const isAdmin = result.user.staff_category_id == ADMIN_ROLE_ID
      localStorage.setItem('admin', isAdmin.toString())
      localStorage.setItem('role', result.user.category_name)
      props.validate();
    } else {
      setFlashMessage('Invalid username or password'); // Set flash message
    }
  }

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>Healix</h2>

        {flashMessage && (
          <div className="flash-message" style={{backgroundColor: 'red'}}>
            {flashMessage}
          </div>
        )}

        <label>
          <input
            type="text"
            className='login-input'
            placeholder='Username'
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>

        <label>
          <input
            type="password"
            className='login-input'
            placeholder='Password'
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <button onClick={handleSubmit}>Login</button>
      </div>
    </div>
  );
}
