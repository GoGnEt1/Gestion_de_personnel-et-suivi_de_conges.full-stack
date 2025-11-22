import React from "react";
import "./index.css";
import App from "./App.tsx";
import "./i18n/i18n";
import { AuthProvider } from "./context/AuthContext.tsx";
import { BrowserRouter } from "react-router-dom";
import ReactDOM from "react-dom/client";
// import Navbar from "./components/Navbar";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        {/* <Navbar /> */}
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
