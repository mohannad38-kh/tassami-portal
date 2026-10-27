import { createRoot } from "react-dom/client";
import { setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

setBaseUrl("https://tassami-portal-1.onrender.com");

createRoot(document.getElementById("root")!).render(<App />);
// trigger Tue Jun 30 12:04:21 PM UTC 2026
