import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./assets/index.css";
import "@xyflow/react/dist/style.css";
import App from "./App.jsx";
import { GlobalProvider } from "./context/GlobalStates.jsx";
import { ReactFlowProvider } from "@xyflow/react";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ReactFlowProvider>
      <GlobalProvider>
        <App />
      </GlobalProvider>
    </ReactFlowProvider>
  </StrictMode>,
);
