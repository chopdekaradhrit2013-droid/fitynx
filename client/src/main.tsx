import { createRoot } from "react-dom/client";
import App from "./app";
import { initStore } from "./library/store";
import "./index.css";

void initStore();
createRoot(document.getElementById("root")!).render(<App />);
