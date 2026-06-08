export interface OilCode {
  id: string;
  oil_code: string;
  vehicle_brand: string;
  vehicle_model: string | null;
  year: string | null;
  engine: string | null;
  oil_type: string | null;
  viscosity: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type OilCodeInput = Omit<OilCode, "id" | "created_at" | "updated_at">;

export const BRANDS = [
  "Mercedes-Benz",
  "BMW",
  "Audi",
  "Volkswagen",
  "Toyota",
  "Subaru",
] as const;
