/**
 * Bandingkan produk. Modul murni tanpa impor, supaya bisa dites dan dipakai di server (halaman
 * /compare) maupun browser (daftar pilihan pembeli di localStorage).
 */

/** Paling banyak produk yang dibandingkan sekaligus; tabel lebih dari ini sulit dibaca di ponsel. */
export const COMPARE_LIMIT = 4;

/** Kunci localStorage daftar bandingkan. */
export const COMPARE_STORAGE_KEY = "sellosy:compare";

/** Satu produk di daftar bandingkan: cukup untuk bilah bandingkan tanpa memanggil API. */
export interface CompareItem {
  /** ID produk ter-encode dari API; dipakai di URL /compare karena tetap walau slug diganti. */
  id: number;
  slug: string;
  name: string;
  image: string | null;
}

const isItem = (value: unknown): value is CompareItem => {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return Number.isSafeInteger(item.id) && (item.id as number) > 0
    && typeof item.slug === "string" && item.slug !== ""
    && typeof item.name === "string"
    && (item.image === null || typeof item.image === "string");
};

/** Isi localStorage (bisa rusak atau dari versi lama) menjadi daftar yang aman dipakai. */
export function readCompareItems(raw: string | null): CompareItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<number>();
    return parsed.filter((item): item is CompareItem => {
      if (!isItem(item) || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    }).slice(0, COMPARE_LIMIT);
  } catch {
    return [];
  }
}

/** Tambah atau hapus satu produk. `full` true bila daftar sudah penuh dan produk tidak ditambahkan. */
export function toggleCompareItem(items: CompareItem[], item: CompareItem): { items: CompareItem[]; full: boolean } {
  if (items.some((current) => current.id === item.id)) return { items: items.filter((current) => current.id !== item.id), full: false };
  if (items.length >= COMPARE_LIMIT) return { items, full: true };
  return { items: [...items, item], full: false };
}

/** `?p=12,34` dari URL halaman bandingkan: ID unik yang valid, paling banyak COMPARE_LIMIT. */
export function readCompareIds(param: string | string[] | undefined): number[] {
  const value = Array.isArray(param) ? param.join(",") : param ?? "";
  const ids = value.split(",").map((part) => part.trim()).filter((part) => /^\d{1,15}$/.test(part)).map(Number)
    .filter((id) => Number.isSafeInteger(id) && id > 0);
  return [...new Set(ids)].slice(0, COMPARE_LIMIT);
}

/** URL halaman bandingkan untuk ID ini (urutan dipertahankan). */
export function compareUrl(ids: number[]): string {
  return ids.length ? `/compare?p=${ids.join(",")}` : "/compare";
}

/** Satu baris tabel: label dan nilai per produk (null bila produk itu tidak punya baris ini). */
export interface CompareRow {
  label: string;
  values: (string | null)[];
  /** Nilainya tidak sama di semua produk; untuk menyorot perbedaan. */
  differs: boolean;
}

/**
 * Gabungan baris spesifikasi semua produk, urut kemunculan pertama. Label disamakan tanpa melihat
 * huruf besar/kecil dan spasi, jadi "Bahan" dan "bahan " jadi satu baris.
 */
export function compareSpecRows(specLists: { label: string; value: string }[][]): CompareRow[] {
  const key = (label: string) => label.trim().replace(/\s+/g, " ").toLowerCase();
  const rows = new Map<string, { label: string; values: (string | null)[] }>();
  specLists.forEach((specs, column) => {
    for (const spec of specs) {
      const id = key(spec.label);
      if (!id) continue;
      let row = rows.get(id);
      if (!row) {
        row = { label: spec.label.trim(), values: specLists.map(() => null) };
        rows.set(id, row);
      }
      // Baris ganda di satu produk: nilai pertama yang dipakai, sama seperti di halaman produk.
      if (row.values[column] === null) row.values[column] = spec.value.trim();
    }
  });
  return [...rows.values()].map((row) => ({ ...row, differs: differs(row.values) }));
}

/** Nilai tidak sama di semua kolom (kosong dihitung sebagai nilai tersendiri). */
export function differs(values: (string | null)[]): boolean {
  return new Set(values.map((value) => value?.trim().toLowerCase() ?? null)).size > 1;
}
