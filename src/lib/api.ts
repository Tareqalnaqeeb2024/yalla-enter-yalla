// API client for PartsLedger backend
// Default points to local dev API. Override at runtime via:
//   localStorage.setItem("apiBaseUrl", "https://your-host:port")
const DEFAULT_BASE = "https://localhost:7151";

export function getApiBase(): string {
  if (typeof window === "undefined") return DEFAULT_BASE;
  return localStorage.getItem("apiBaseUrl") || DEFAULT_BASE;
}

export function setApiBase(url: string) {
  localStorage.setItem("apiBaseUrl", url.replace(/\/$/, ""));
}

export interface ApiProduct {
  id: number;
  page: number;
  name: string;
  category: string;
  quantity: number;
  price: number;
  currency: string;
  year: number;
  createdAt?: string;
}

export type NewProduct = Omit<ApiProduct, "id" | "createdAt">;

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
  }
  if (res.status === 204) return undefined as T;
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return (await res.json()) as T;
  return (await res.text()) as unknown as T;
}

export async function listProducts(params: {
  year?: number;
  category?: string;
  search?: string;
}): Promise<ApiProduct[]> {
  const url = new URL(`${getApiBase()}/api/Products`);
  if (params.year != null) url.searchParams.set("year", String(params.year));
  if (params.category) url.searchParams.set("category", params.category);
  if (params.search) url.searchParams.set("search", params.search);
  const res = await fetch(url.toString());
  return handle<ApiProduct[]>(res);
}

export async function createProduct(p: NewProduct): Promise<ApiProduct> {
  const res = await fetch(`${getApiBase()}/api/Products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(p),
  });
  return handle<ApiProduct>(res);
}

export async function deleteProduct(id: number): Promise<void> {
  const res = await fetch(`${getApiBase()}/api/Products/${id}`, {
    method: "DELETE",
  });
  await handle<void>(res);
}

export function exportUrl(params: {
  year?: number;
  category?: string;
  search?: string;
}): string {
  const url = new URL(`${getApiBase()}/api/Products/export`);
  if (params.year != null) url.searchParams.set("year", String(params.year));
  if (params.category) url.searchParams.set("category", params.category);
  if (params.search) url.searchParams.set("search", params.search);
  return url.toString();
}
