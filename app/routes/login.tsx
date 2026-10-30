import { apiFetch } from "../api";
import Logo from "~/components/logo";
import { ADMIN_ROLE_ID } from "../roles";
import React from 'react'
import { Field, FormError, inputClass } from "~/components/form";

/** The sign-in page, in the landing page's style: a lime panel beside the form. */
export default function LoginPage(props: { validate: () => void; onBack?: () => void; setFlash?: () => void }) {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState('');
  const [signingIn, setSigningIn] = React.useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!username.trim() || !password) return setError('Enter your username and password.');
    setSigningIn(true);
    setError('');
    try {
      const response = await apiFetch(`/validateuser`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        return;
      }
      // The server explains throttling and switched-off accounts; otherwise keep it vague.
      setError(result.error || 'Invalid username or password.');
    } catch {
      setError('Could not reach Healix. Check your connection and try again.');
    } finally {
      setSigningIn(false);
    }
  }

  return (
    // The app pins <body> to the screen, so this page scrolls itself on short screens.
    <div className="h-full overflow-y-auto bg-white font-sans text-sage-900">
      <div className="grid min-h-full grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
        <BrandPanel />

        <main className="flex flex-col px-6 py-6 sm:px-10">
          <div className="flex items-center justify-between">
            <span className="lg:invisible"><Logo /></span>
            {props.onBack && (
              <button type="button" onClick={props.onBack}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-sage-600 transition hover:bg-sage-100 hover:text-sage-900">
                <i className="bi bi-arrow-left" aria-hidden="true" /> Back to Healix
              </button>
            )}
          </div>

          <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
            <h1 className="m-0 text-[2.2rem] font-medium leading-tight tracking-tight">Welcome back</h1>
            <p className="m-0 mt-2 text-sm text-sage-600">Sign in with the account your clinic admin gave you.</p>

            {/* A real form, so Enter submits and password managers recognise it. */}
            <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-4">
              {error && <FormError>{error}</FormError>}
              <Field label="Username" htmlFor="login-username">
                <input id="login-username" className={inputClass} autoComplete="username" autoFocus value={username}
                  aria-invalid={Boolean(error) && !username.trim()}
                  onChange={(e) => { setUsername(e.target.value); setError('') }} />
              </Field>
              <Field label="Password" htmlFor="login-password">
                <div className="relative">
                  <input id="login-password" type={showPassword ? "text" : "password"} className={`${inputClass} pr-11`}
                    autoComplete="current-password" value={password}
                    onChange={(e) => { setPassword(e.target.value); setError('') }} />
                  <button type="button" onClick={() => setShowPassword(shown => !shown)} aria-pressed={showPassword}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-sage-400 hover:text-sage-700">
                    <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`} aria-hidden="true" />
                  </button>
                </div>
              </Field>
              <button type="submit" disabled={signingIn}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-citron-300 px-5 py-3 text-sm font-semibold text-brand-900 transition hover:bg-citron-400 disabled:cursor-wait disabled:opacity-70">
                {signingIn ? "Signing in..." : <>Sign in <i className="bi bi-arrow-right" aria-hidden="true" /></>}
              </button>
            </form>

            <p className="m-0 mt-6 rounded-2xl bg-sage-50 px-4 py-3 text-xs leading-relaxed text-sage-600">
              <i className="bi bi-key mr-1.5 text-sage-500" aria-hidden="true" />
              Forgot your password? Ask your clinic admin to reset it from the Staff page.
            </p>
          </div>

          <p className="m-0 text-center text-xs text-sage-400">Healix is for clinic staff. Students and parents don't sign in.</p>
        </main>
      </div>
    </div>
  );
}


/** The lime side panel; decoration only, hidden on phones. */
function BrandPanel() {
  return (
    <aside aria-hidden="true" className="relative m-3 hidden flex-col overflow-hidden rounded-[28px] p-8 lg:flex"
      style={{
        background:
          "radial-gradient(circle at 20% 15%, rgba(255,255,255,0.55) 0 2px, transparent 3px) 0 0 / 22px 22px," +
          "linear-gradient(160deg, var(--color-citron-200), var(--color-leaf-200))",
      }}>
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full border border-white/50" />
      <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full border border-white/50" />
      <div className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full border border-white/40" />

      <Logo />
      <div className="relative mt-auto">
        <p className="m-0 max-w-sm text-[2rem] font-medium leading-[1.12] tracking-tight text-sage-900">
          Every visit, medicine and parent call, on record.
        </p>

        <div className="mt-8 max-w-xs rounded-2xl bg-white p-4 shadow-card">
          <div className="flex items-center justify-between">
            <p className="m-0 text-xs font-semibold"><span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-leaf-500" />In the clinic now</p>
            <span className="rounded-full bg-sage-100 px-2 py-0.5 text-[10px] font-semibold text-sage-700">2</span>
          </div>
          {[["AB", "Andrea B.", "Headache", "12 min"], ["RM", "Rafael M.", "Fever", "28 min"]].map(([initials, name, detail, time]) => (
            <div key={name} className="mt-3 flex items-center gap-3 rounded-xl bg-sage-50 p-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-[11px] font-semibold text-brand-800">{initials}</span>
              <span className="flex-1">
                <span className="block text-xs font-semibold">{name}</span>
                <span className="block text-[11px] text-sage-500">{detail}</span>
              </span>
              <span className="text-[10px] font-medium text-sage-500">{time}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-2.5">
          {[["Fever", "-rotate-3"], ["First aid", "rotate-2"], ["Medical clearance", "-rotate-2"], ["Headache", "rotate-3"]].map(([text, tilt]) => (
            <span key={text} className={`rounded-full bg-white px-4 py-2 text-sm font-medium text-sage-800 shadow-card ${tilt}`}>{text}</span>
          ))}
        </div>
      </div>
    </aside>
  )
}
