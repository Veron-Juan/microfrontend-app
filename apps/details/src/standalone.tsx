import { createRoot } from "react-dom/client";
import Details from "./Details.tsx";
import "./standalone.css";

// Each remote can run on its own: that's how its team develops and tests it without the shell.
const root = document.getElementById("root");
if (!root) throw new Error("index.html is missing the #root element");
createRoot(root).render(<Details />);
