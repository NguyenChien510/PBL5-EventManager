import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleAuthProviderWrapper } from "@/components/auth/GoogleAuthProviderWrapper";
import App from "./App.tsx";
import "./index.css";

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <GoogleAuthProviderWrapper>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </GoogleAuthProviderWrapper>
    </React.StrictMode>,
  );
}
