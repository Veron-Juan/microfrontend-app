/** El índice de la lección: alimenta la tabla de contenidos y numera cada sección. */
export const LESSONS = [
  { id: "que-es", label: "Qué es" },
  { id: "demo", label: "La demo en vivo" },
  { id: "composicion", label: "Cómo se compone" },
  { id: "render", label: "SSR, SSG y CSR" },
  { id: "dependencias", label: "Dependencias compartidas" },
  { id: "fallos", label: "Fallos aislados" },
  { id: "cuando", label: "¿Cuándo conviene?" },
] as const;

export type LessonId = (typeof LESSONS)[number]["id"];

export const lessonNumber = (id: LessonId) => LESSONS.findIndex((lesson) => lesson.id === id) + 1;
