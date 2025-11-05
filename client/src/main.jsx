import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./assets/index.css";
import "@xyflow/react/dist/style.css";
import App from "./App.jsx";
import { GlobalProvider } from "./context/GlobalStates.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GlobalProvider>
      <App />
    </GlobalProvider>
  </StrictMode>
);
