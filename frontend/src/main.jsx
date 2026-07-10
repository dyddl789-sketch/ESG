import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./app/providers/AuthProvider";
import { DemoDataProvider } from "./app/providers/DemoDataProvider";
import { EsgDataProvider } from "./app/providers/EsgDataProvider";
import "./shared/chart/registerChart";
import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <DemoDataProvider>
          <EsgDataProvider>
            <App />
          </EsgDataProvider>
        </DemoDataProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
