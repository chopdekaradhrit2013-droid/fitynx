import { createRoot } from "react-dom/client";
import App from "./app";
import { initStore } from "./lib/store";
import "./index.css";

void initStore();
createRoot(document.getElementById("root")!).render(<App />);
