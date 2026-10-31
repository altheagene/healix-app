import { API_ERROR_EVENT, apiFetch } from "./api";
import { API_BASE_URL } from "./config";
import { ADMIN_ROLE_ID } from "./roles";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import Navbar from "./components/navbar";
import Modal from "./components/modal";
import Notices from "./components/notices";
import { primaryButton, secondaryButton } from "./components/form";
import React from "react";
import LoginPage from "./routes/login";
import Landing from "./components/landing";


// Limits where the page may load from and send data to, so injected script cannot
// ship patient data or the login token to another site. Inline scripts stay allowed
// because React Router's server rendering needs them. Skipped in dev for hot reload.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data:",
  `connect-src 'self' ${new URL(API_BASE_URL).origin}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const SECURITY_HEADERS: Record<string, string> = import.meta.env.DEV ? {} : {
  "Content-Security-Policy": CONTENT_SECURITY_POLICY,
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

export const headers: Route.HeadersFunction = () => SECURITY_HEADERS;

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}


import './routepages.css'
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useLocation, useNavigate } from "react-router";
import LoadingBar from "./components/loadingbar";
export default function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [showNavbar, setShowNavbar] = React.useState(false);
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);
  const [flashMessage, setFlashMessage] = React.useState("");
  const [apiError, setApiError] = React.useState("");

  const [validUser, setValidUser] = React.useState(false);
  // Signed-out visitors see the landing page first; Sign in shows the form.
  const [showSignIn, setShowSignIn] = React.useState(false);
  // Whether the stored session has been read yet, so signed-in users never see the landing page flash.
  const [sessionChecked, setSessionChecked] = React.useState(false);
  const [, setRoleChecked] = React.useState(0);

  // The role saved at login can be out of date if an admin changed it since.
  // Ask the server, then re-render so pages read the current one.
  function refreshRole() {
    apiFetch("/me")
      .then(res => res.json())
      .then(me => {
        if (!me || !me.staff_id) return;
        localStorage.setItem("userid", String(me.staff_id));
        localStorage.setItem("admin", String(me.staff_category_id === ADMIN_ROLE_ID));
        localStorage.setItem("role", me.category_name || "");
        setRoleChecked(n => n + 1);
      });
  }

  // Server or network failures: stays up until dismissed, so it is not missed.
  React.useEffect(() => {
    const onApiError = (event: Event) => setApiError((event as CustomEvent<string>).detail);
    window.addEventListener(API_ERROR_EVENT, onApiError);
    return () => window.removeEventListener(API_ERROR_EVENT, onApiError);
  }, []);

// Only access localStorage after component mounts
React.useEffect(() => {
  const loggedIn = localStorage.getItem("loggedIn") === "true" && !!localStorage.getItem("token");
  setValidUser(loggedIn);
  setSessionChecked(true);
  if (loggedIn) refreshRole();

  const onExpired = () => {
    localStorage.removeItem("token");
    localStorage.setItem("loggedIn", "false");
    setValidUser(false);
    // They were working a moment ago: take them straight back to the form.
    setShowSignIn(true);
  };
  window.addEventListener("auth-expired", onExpired);
  return () => window.removeEventListener("auth-expired", onExpired);
}, []);

function validate() {
  localStorage.setItem("loggedIn", "true");
  setValidUser(true);

  setFlashMessage("Logged in successfully!");
  setTimeout(() => setFlashMessage(""), 3000);
}

function logout() {
  // End the session on the server too, so a copied token stops working.
  apiFetch("/logout", { method: "POST" }).catch(() => {});
  setShowLogoutModal(false);
  navigate('/', {replace :true})
  setValidUser(false);
  setFlashMessage("Logged out!");
  setTimeout(() => setFlashMessage(""), 3000);
  localStorage.removeItem("token");
  localStorage.setItem("loggedIn", "false");
}

  return (
    <>
      {apiError && (
        <div role="alert" className="fixed inset-x-0 top-0 z-[60] flex items-center justify-center gap-4 bg-red-700 px-4 py-2.5 text-sm text-white shadow">
          <span><i className="bi bi-exclamation-triangle-fill mr-2" aria-hidden="true" />{apiError} What you see may be incomplete.</span>
          <button type="button" onClick={() => setApiError("")} className="rounded-md border border-white/40 px-2.5 py-1 text-xs font-medium hover:bg-white/10">
            Dismiss
          </button>
        </div>
      )}
      <Notices />
      {validUser && <LoadingBar />}
      {flashMessage && (
        <div className="flash-message" role="status" aria-live="polite" style={{backgroundColor: validUser ? 'var(--color-leaf-600)' : 'var(--color-red-600)'}}>{flashMessage}</div>
      )}

      {validUser ? 
        <>
          <div id="main-content">
            <Navbar
              expanded={showNavbar}
              onToggle={() => setShowNavbar(open => !open)}
              onLogout={() => setShowLogoutModal(true)}
            />
            <div className="min-w-0 flex-1 overflow-y-auto bg-white px-8 py-7">
              {/* Keyed by path so each page fades in when you open it. */}
              <div key={location.pathname} className="page-enter">
                <Outlet />
              </div>
            </div>
            {showLogoutModal && (
              <Modal title="Log out?" onClose={() => setShowLogoutModal(false)} width={400}>
                <p className="m-0 px-6 py-5 text-sm text-sage-600">You will need to sign in again to continue.</p>
                <div className="flex justify-end gap-2 border-t border-sage-100 px-6 py-4">
                  <button type="button" onClick={() => setShowLogoutModal(false)} className={secondaryButton}>Cancel</button>
                  <button type="button" onClick={logout} className={primaryButton}>Log out</button>
                </div>
              </Modal>
            )}
          </div>
        </>
        : !sessionChecked ? null
        : showSignIn ? (
          <LoginPage validate={validate} onBack={() => setShowSignIn(false)}
            setFlash={() => {setFlashMessage('Invalid credentials!'); setTimeout(() => setFlashMessage(""), 3000);}}/>
        ) : (
          <Landing onSignIn={() => setShowSignIn(true)} />
        )
      }    
    </>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
