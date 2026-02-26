import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import "./i18n/config"; // Initialize i18n
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
    <HelmetProvider>
        <App />
    </HelmetProvider>
);
