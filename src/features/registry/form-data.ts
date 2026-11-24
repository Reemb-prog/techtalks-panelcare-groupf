export function inputValues(data: FormData, optional: readonly string[]) {
  return Object.fromEntries(
    [...data.entries()].flatMap(([key, value]) => {
      if (typeof value !== "string") return [];
      const trimmed = value.trim();
      if (!trimmed && optional.includes(key)) return [];
      return [[key, trimmed]];
    }),
  );
}
