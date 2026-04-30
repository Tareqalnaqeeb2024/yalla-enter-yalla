// API client for PartsLedger backend
const DEFAULT_BASE = "http://localhost:5297";

/**
 * الحصول على عنوان الـ API من التخزين المحلي أو استخدام العنوان الافتراضي
 */
export function getApiBase(): string {
  if (typeof window === "undefined") return DEFAULT_BASE;
  return localStorage.getItem("apiBaseUrl") || DEFAULT_BASE;
}

/**
 * حفظ عنوان الـ API الجديد في التخزين المحلي
 */
export function setApiBase(url: string) {
  localStorage.setItem("apiBaseUrl", url.replace(/\/$/, ""));
}

/**
 * واجهة تعريف المنتج (Product) المتوافقة مع الباك إند
 */
export interface ApiProduct {
  id: number;
  page: number;
  name: string;
  category: string;
  quantity: number;
  price: number;
  currency: string;
  year: number;
  date?: string | null;  // حقل جديد
  notes?: string | null; // حقل جديد
  createdAt?: string;
}

/**
 * واجهة استجابة نظام الصفحات من الباك إند
 */
export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages?: number;
}

export type NewProduct = Omit<ApiProduct, "id" | "createdAt">;

/**
 * معالج الطلبات العام للتعامل مع استجابات Fetch
 */
async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
  }
  // في حالة PUT أو DELETE قد لا يكون هناك محتوى (204 No Content)
  if (res.status === 204) return undefined as T;
  
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return (await res.json()) as T;
  return (await res.text()) as unknown as T;
}

/**
 * جلب قائمة المنتجات مع دعم البحث والفلترة ونظام الصفحات
 */
export async function listProducts(params: {
  year?: number;
  category?: string;
  search?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<ApiProduct>> {
  const url = new URL(`${getApiBase()}/api/Products`);
  
  if (params.year != null) url.searchParams.set("year", String(params.year));
  if (params.category) url.searchParams.set("category", params.category);
  if (params.search) url.searchParams.set("search", params.search);
  if (params.pageNumber) url.searchParams.set("pageNumber", String(params.pageNumber));
  if (params.pageSize) url.searchParams.set("pageSize", String(params.pageSize));

  const res = await fetch(url.toString());
  return handle<PaginatedResponse<ApiProduct>>(res);
}

/**
 * إضافة منتج جديد
 */
export async function createProduct(p: NewProduct): Promise<ApiProduct> {
  const res = await fetch(`${getApiBase()}/api/Products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(p),
  });
  return handle<ApiProduct>(res);
}

/**
 * تحديث منتج موجود (PUT)
 */
export async function updateProduct(id: number, p: ApiProduct): Promise<void> {
  const res = await fetch(`${getApiBase()}/api/Products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(p),
  });
  return handle<void>(res);
}

/**
 * حذف منتج
 */
export async function deleteProduct(id: number): Promise<void> {
  const res = await fetch(`${getApiBase()}/api/Products/${id}`, {
    method: "DELETE",
  });
  await handle<void>(res);
}

/**
 * الحصول على رابط التصدير لملف Excel
 */
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

/**
 * جلب جميع الأسماء الفريدة من المنتجات
 */
export async function getAllNames(): Promise<string[]> {
  const res = await fetch(`${getApiBase()}/api/Products/all-names`);
  return handle<string[]>(res);
}