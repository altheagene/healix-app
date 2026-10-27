import { apiFetch } from "../api";
import { ADMIN_ROLE_ID } from "../roles";
import '../login.css'
import React from 'react'

export default function LoginPage(props: any) {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [flashMessage, setFlashMessage] = React.useState(''); // Flash message state

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
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
      setFlashMessage(result.error || 'Invalid username or password'); // Set flash message
    }
  }

  return (
    <div className="login-container">
      {/* A real form, so Enter submits and password managers recognise it. */}
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Healix</h2>

        {flashMessage && (
          <div className="flash-message" role="alert" style={{backgroundColor: 'red'}}>
            {flashMessage}
          </div>
        )}

        <label>
          <span className="sr-only">Username</span>
          <input
            type="text"
            className='login-input'
            placeholder='Username'
            autoComplete="username"
            required
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>

        <label>
          <span className="sr-only">Password</span>
          <input
            type="password"
            className='login-input'
            placeholder='Password'
            autoComplete="current-password"
            required
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <button type="submit">Login</button>
      </form>
    </div>
  );
}
