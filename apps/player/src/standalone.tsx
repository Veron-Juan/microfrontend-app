import { createRoot } from "react-dom/client";
import Player from "./Player.tsx";
import "./standalone.css";

// Cada remote puede correr aislado: así su equipo lo desarrolla y prueba sin el shell.
const root = document.getElementById("root");
if (!root) throw new Error("Falta el elemento #root en index.html");
createRoot(root).render(<Player />);
