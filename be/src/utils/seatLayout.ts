/** Column letters are explicit: wide-body numbering commonly skips I and J. */
const layouts: Record<string, string[][]> = {
  "3-3": [
    ["A", "B", "C"],
    ["D", "E", "F"],
  ],
  "2-4-2": [
    ["A", "C"],
    ["D", "E", "F", "G"],
    ["H", "K"],
  ],
  "3-3-3": [
    ["A", "B", "C"],
    ["D", "E", "F"],
    ["G", "H", "K"],
  ],
  "3-4-3": [
    ["A", "B", "C"],
    ["D", "E", "F", "G"],
    ["H", "J", "K"],
  ],
};

export function seatColumnGroups(
  layout: string,
  columns: string[] = [],
): string[][] {
  if (layouts[layout]) return layouts[layout].map((group) => [...group]);
  if (!/^\d+(?:-\d+){1,2}$/.test(layout)) return [];
  const counts = layout.split("-").map(Number);
  if (counts.some((count) => count < 1 || count > 4)) return [];
  const unique = [...new Set(columns)].sort();
  if (unique.length !== counts.reduce((sum, count) => sum + count, 0))
    return [];
  let offset = 0;
  return counts.map((count) => {
    const group = unique.slice(offset, offset + count);
    offset += count;
    return group;
  });
}
