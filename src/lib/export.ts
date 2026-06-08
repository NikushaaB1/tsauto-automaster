import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { OilCode } from "./oil-types";

const COLUMNS: { key: keyof OilCode; label: string }[] = [
  { key: "oil_code", label: "Oil Code" },
  { key: "vehicle_brand", label: "Brand" },
  { key: "vehicle_model", label: "Model" },
  { key: "year", label: "Year" },
  { key: "engine", label: "Engine" },
  { key: "oil_type", label: "Type" },
  { key: "viscosity", label: "Viscosity" },
  { key: "notes", label: "Notes" },
];

export function exportToExcel(rows: OilCode[], filename = "ts-auto-oil-codes.xlsx") {
  const data = rows.map((r) => {
    const out: Record<string, string> = {};
    COLUMNS.forEach((c) => (out[c.label] = String(r[c.key] ?? "")));
    return out;
  });
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Oil Codes");
  XLSX.writeFile(wb, filename);
}

export function exportToPDF(rows: OilCode[], filename = "ts-auto-oil-codes.pdf") {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(16);
  doc.text("TS-AUTO — Oil Codes Database", 14, 15);
  doc.setFontSize(10);
  doc.text(`Exported: ${new Date().toLocaleString()}`, 14, 22);
  autoTable(doc, {
    startY: 28,
    head: [COLUMNS.map((c) => c.label)],
    body: rows.map((r) => COLUMNS.map((c) => String(r[c.key] ?? ""))),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    alternateRowStyles: { fillColor: [240, 244, 250] },
  });
  doc.save(filename);
}

export function exportBackupJSON(rows: OilCode[], filename = "ts-auto-backup.json") {
  const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function parseBackupJSON(file: File): Promise<Partial<OilCode>[]> {
  const text = await file.text();
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) throw new Error("Invalid backup file format");
  return parsed;
}
