import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router"; // <- use HashRouter
import App from "./root"; // your root.tsx

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);