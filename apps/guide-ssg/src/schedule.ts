// La grilla del día: los datos que el build convierte en HTML. Separados del componente y del
// script de build para poder validarlos en un test.

export interface Slot {
  title: string;
  /** Cuántas horas ocupa el programa. */
  span: number;
}

export interface Channel {
  number: number;
  name: string;
  /** Programas en orden. */
  slots: Slot[];
}

export const HOURS: readonly string[] = ["18:00", "19:00", "20:00", "21:00", "22:00", "23:00"];

export const CHANNELS: readonly Channel[] = [
  {
    number: 101,
    name: "Deportes 1",
    slots: [
      { title: "Previa", span: 1 },
      { title: "Final continental", span: 2 },
      { title: "Resumen", span: 1 },
      { title: "Análisis", span: 2 },
    ],
  },
  {
    number: 205,
    name: "Docs",
    slots: [
      { title: "Andes profundos", span: 2 },
      { title: "Océanos", span: 1 },
      { title: "Ciudades", span: 2 },
      { title: "Archivo", span: 1 },
    ],
  },
  {
    number: 310,
    name: "Series",
    slots: [
      { title: "La frontera T2", span: 1 },
      { title: "La frontera T2", span: 1 },
      { title: "Estreno", span: 3 },
      { title: "Clásicos", span: 1 },
    ],
  },
  {
    number: 402,
    name: "Noticias 24",
    slots: [
      { title: "Noticiero 24", span: 3 },
      { title: "Entrevista", span: 1 },
      { title: "Cierre", span: 2 },
    ],
  },
  {
    number: 515,
    name: "Kids",
    slots: [
      { title: "Taller de robots", span: 2 },
      { title: "Cuentos", span: 2 },
      { title: "Repetición", span: 2 },
    ],
  },
];

/** Problemas de la grilla: canales repetidos o filas que no cubren exactamente todas las horas. */
export function scheduleProblems(channels: readonly Channel[], hours: readonly string[]): string[] {
  const problems: string[] = [];
  const seen = new Set<number>();
  for (const channel of channels) {
    if (seen.has(channel.number)) problems.push(`canal ${channel.number} repetido`);
    seen.add(channel.number);
    const total = channel.slots.reduce((sum, slot) => sum + slot.span, 0);
    if (total !== hours.length) problems.push(`${channel.name}: ocupa ${total} h de ${hours.length}`);
    if (channel.slots.some((slot) => !Number.isInteger(slot.span) || slot.span < 1)) {
      problems.push(`${channel.name}: hay un programa con duración inválida`);
    }
  }
  return problems;
}

/** Fecha y hora del build tal como se muestra, p. ej. "19 oct a las 18:12:34". */
export function formatBuiltAt(date: Date): string {
  return `${date.toLocaleDateString("es", { day: "2-digit", month: "short" })} a las ${date.toLocaleTimeString("es", { hour12: false })}`;
}
