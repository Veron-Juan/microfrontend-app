import { createRoot } from "react-dom/client";
import Player from "./Player.tsx";

// Cada remote puede correr aislado: así su equipo lo desarrolla y prueba sin el shell.
createRoot(document.getElementById("root")!).render(<Player />);
