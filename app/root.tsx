import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  replace,
  Scripts,
  ScrollRestoration,
} from "react-router";

import { createHashRouter } from "react-router";
import type { Route } from "./+types/root";
import "./app.css";
import Navbar from "./components/navbar";
import React from "react";
import LoginPage from "./routes/login";

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
  {
    rel:'stylesheet',
    href: "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&family=Manrope:wght@200..800&display=swap"
  },
  {
   
  rel:"stylesheet",
  href: "https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800&display=swap'
  }
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

// export default function App() {

//   const [showNavbar, setShowNavBar] = React.useState(true);
//   const [validUser, setValidUser] = React.useState(() => {
//     return localStorage.getItem("loggedIn") === "true";
//   });

//   function validate(){
//     localStorage.setItem("loggedIn", "true");
//     setValidUser(true)
//   }

//   function logout(){
//     setValidUser(false);
//     localStorage.setItem("loggedIn", "false");

//   }
//   return (
//     <>
    
//     {validUser ? 
//       <>
//         <div id='header'>
//           <div>
//             <button onClick={() => setShowNavBar(prev => !prev)}><i className={showNavbar ? 'bi bi-caret-left-fill' : 'bi bi-caret-right-fill'}></i></button>
//             <h1>Healix</h1>
//           </div>
          
//           <button onClick={logout} className="logout-btn">Logout</button>
//         </div>

//         <div id="main-content">
//           <Navbar showNavbar={showNavbar}/>
//           <div id="route-container">
//             <Outlet></Outlet>
//           </div>
//         </div>
//       </>
//       :
//       <LoginPage validate={validate}/>
//     }    
//     </>
//   )
// }

import { API_BASE_URL} from './config'
import './routepages.css'
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useNavigate } from "react-router";
export default function App() {
  const navigate = useNavigate()
  const [showNavbar, setShowNavBar] = React.useState(true);
  const [flashMessage, setFlashMessage] = React.useState("");

  const [validUser, setValidUser] = React.useState(false);

// Only access localStorage after component mounts
React.useEffect(() => {
  const loggedIn = localStorage.getItem("loggedIn") === "true";
  setValidUser(loggedIn);

  fetch(`${API_BASE_URL}/refreshbatches`)
  .then(res => res.json())
}, []);

function validate() {
  localStorage.setItem("loggedIn", "true");
  setValidUser(true);

  setFlashMessage("Logged in successfully!");
  setTimeout(() => setFlashMessage(""), 3000);
}

function logout() {
  navigate('/', {replace :true})
  setValidUser(false);
  setFlashMessage("Logged out!");
  setTimeout(() => setFlashMessage(""), 3000);
  localStorage.setItem("loggedIn", "false");
}

  return (
    <>
      {flashMessage && (
        <div className="flash-message" style={{backgroundColor: validUser ? '#4caf50' : '#FF3838'}}>{flashMessage}</div>
      )}

      {validUser ? 
        <>
          <div id='header'>
            <div>
              <button onClick={() => setShowNavBar(prev => !prev)}>
                <i className={showNavbar ? 'bi bi-caret-left-fill' : 'bi bi-caret-right-fill'}></i>
              </button>
              <h1>Healix</h1>
            </div>
            <button onClick={logout} className="logout-btn">Logout</button>
          </div>

          <div id="main-content">
            <Navbar showNavbar={showNavbar}/>
            <div id="route-container">
              <Outlet></Outlet>
            </div>
          </div>
        </>
        :
        <LoginPage validate={validate} setFlash={() => {setFlashMessage('Invalid credentials!'); setTimeout(() => setFlashMessage(""), 3000);}}/>
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
