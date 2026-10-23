/** The lesson index: it feeds the table of contents and numbers each section. */
export const LESSONS = [
  { id: "what-is", label: "What it is" },
  { id: "demo", label: "The live demo" },
  { id: "composition", label: "How it's composed" },
  { id: "rendering", label: "SSR, SSG and CSR" },
  { id: "shared-deps", label: "Shared dependencies" },
  { id: "failures", label: "Isolated failures" },
  { id: "when", label: "When is it worth it?" },
] as const;

export type LessonId = (typeof LESSONS)[number]["id"];

export const lessonNumber = (id: LessonId) => LESSONS.findIndex((lesson) => lesson.id === id) + 1;
