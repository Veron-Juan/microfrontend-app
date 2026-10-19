import { createRoot } from "react-dom/client";
import Catalog from "./Catalog.jsx";

// Cada remote puede correr aislado: así su equipo lo desarrolla y prueba sin el shell.
createRoot(document.getElementById("root")).render(<Catalog />);
