import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, useMemo, useEffect, useCallback, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import {
  Trash2,
  Save,
  Package,
  Calculator,
  NotebookPen,
  Download,
  Search,
  Settings2,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  listProducts,
  createProduct,
  deleteProduct,
  exportUrl,
  getApiBase,
  setApiBase,
  type ApiProduct,
} from "@/lib/api";

export const Route = createFileRoute("/")({
  component: Index,
});

const TYPES = ["صيني", "فرنسي", "مصري", "تركي"] as const;
const CURRENCIES = ["IQD", "USD", "EUR", "SAR"] as const;

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 11 }, (_, i) => String(currentYear - i));

function Index() {
  const [year, setYear] = useState<string>(String(currentYear));
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [apiUrl, setApiUrlState] = useState<string>(() => getApiBase());
  const [showSettings, setShowSettings] = useState(false);

  // form
  const [page, setPage] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<(typeof TYPES)[number]>("صيني");
  const [currency, setCurrency] = useState<(typeof CURRENCIES)[number]>("IQD");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");

  const pageRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const typeRef = useRef<HTMLButtonElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);

  const totals = useMemo(() => {
    const count = products.length;
    const total = products.reduce((s, p) => s + p.quantity * p.price, 0);
    return { count, total };
  }, [products]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listProducts({
        year: Number(year),
        search: search.trim() || undefined,
      });
      setProducts(data);
    } catch (e) {
      setError(
        "تعذّر الاتصال بالخادم. تأكد من تشغيل الـ API على " +
          getApiBase() +
          " وقبول شهادة SSL في المتصفح، وتفعيل CORS.",
      );
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [year, search]);

  useEffect(() => {
    pageRef.current?.focus();
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const resetForm = () => {
    setPage("");
    setName("");
    setType("صيني");
    setQuantity("");
    setPrice("");
    pageRef.current?.focus();
  };

  const save = async () => {
    const trimmed = name.trim();
    const pg = Number(page);
    const q = Number(quantity);
    const p = Number(price);
    if (
      !trimmed ||
      !Number.isFinite(pg) ||
      pg <= 0 ||
      !Number.isFinite(q) ||
      !Number.isFinite(p) ||
      q <= 0 ||
      p < 0
    ) {
      pageRef.current?.focus();
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const created = await createProduct({
        page: pg,
        name: trimmed,
        category: type,
        quantity: q,
        price: p,
        currency,
        year: Number(year),
      });
      setProducts((prev) => [created, ...prev]);
      resetForm();
    } catch {
      setError("فشل حفظ المنتج. تحقق من الاتصال بالخادم.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    const prev = products;
    setProducts((p) => p.filter((x) => x.id !== id));
    try {
      await deleteProduct(id);
    } catch {
      setProducts(prev);
      setError("فشل حذف المنتج.");
    }
  };

  const handleExport = () => {
    const url = exportUrl({
      year: Number(year),
      search: search.trim() || undefined,
    });
    window.open(url, "_blank");
  };

  const saveApiUrl = () => {
    setApiBase(apiUrl.trim());
    setApiUrlState(getApiBase());
    setShowSettings(false);
    refresh();
  };

  const handleGlobalKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      save();
    }
  };

  const onEnter = (e: KeyboardEvent, next: () => void) => {
    if (e.key === "Enter") {
      e.preventDefault();
      next();
    }
  };

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { maximumFractionDigits: 2 });

  return (
    <div
      dir="rtl"
      onKeyDown={handleGlobalKey}
      className="min-h-screen bg-background"
    >
      <div className="mx-auto max-w-6xl px-4 py-6 md:py-10 space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <NotebookPen className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground">
                دفتر قطع الغيار
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground">
                متصل بـ <span dir="ltr">{apiUrl}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Label className="text-sm text-muted-foreground">السنة</Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-28" dir="rtl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent dir="rtl">
                {YEARS.map((y) => (
                  <SelectItem key={y} value={y}>
                    <span dir="ltr">{y}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={refresh}
              aria-label="تحديث"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowSettings((s) => !s)}
              aria-label="إعدادات"
            >
              <Settings2 className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {showSettings && (
          <Card className="p-4">
            <Label className="text-sm">عنوان الـ API</Label>
            <div className="mt-2 flex gap-2">
              <Input
                dir="ltr"
                value={apiUrl}
                onChange={(e) => setApiUrlState(e.target.value)}
                placeholder="https://localhost:7151"
              />
              <Button onClick={saveApiUrl}>حفظ</Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              تنبيه: افتح <span dir="ltr">{apiUrl}/api/Products</span> في
              المتصفح وقبول شهادة SSL أولاً، وتأكد من تفعيل CORS في الخادم.
            </p>
          </Card>
        )}

        {error && (
          <Card className="p-3 border-destructive bg-destructive/5 text-destructive text-sm">
            {error}
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-accent text-accent-foreground flex items-center justify-center">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">عدد المنتجات</div>
              <div className="text-lg font-bold" dir="ltr">
                {fmt(totals.count)}
              </div>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-accent text-accent-foreground flex items-center justify-center">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">إجمالي القيمة</div>
              <div className="text-lg font-bold" dir="ltr">
                {fmt(totals.total)}
              </div>
            </div>
          </Card>
        </div>

        {/* Entry Form */}
        <Card className="p-4 md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">
              نموذج إدخال البيانات
            </h2>
            <span className="text-xs text-muted-foreground">
              اختصار: Ctrl + Enter للحفظ
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-1 space-y-1.5">
              <Label htmlFor="page">الصفحة</Label>
              <Input
                id="page"
                ref={pageRef}
                inputMode="numeric"
                dir="ltr"
                value={page}
                onChange={(e) => setPage(e.target.value.replace(/[^\d]/g, ""))}
                onKeyDown={(e) => onEnter(e, () => nameRef.current?.focus())}
                placeholder="0"
              />
            </div>

            <div className="md:col-span-3 space-y-1.5">
              <Label htmlFor="name">اسم المنتج</Label>
              <Input
                id="name"
                ref={nameRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => onEnter(e, () => typeRef.current?.focus())}
                placeholder="مثال: فلتر زيت"
                autoComplete="off"
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <Label>النوع</Label>
              <Select
                value={type}
                onValueChange={(v) => {
                  setType(v as (typeof TYPES)[number]);
                  qtyRef.current?.focus();
                }}
              >
                <SelectTrigger ref={typeRef} dir="rtl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="qty">الكمية</Label>
              <Input
                id="qty"
                ref={qtyRef}
                inputMode="numeric"
                dir="ltr"
                value={quantity}
                onChange={(e) =>
                  setQuantity(e.target.value.replace(/[^\d.]/g, ""))
                }
                onKeyDown={(e) => onEnter(e, () => priceRef.current?.focus())}
                placeholder="0"
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="price">السعر</Label>
              <Input
                id="price"
                ref={priceRef}
                inputMode="decimal"
                dir="ltr"
                value={price}
                onChange={(e) =>
                  setPrice(e.target.value.replace(/[^\d.]/g, ""))
                }
                onKeyDown={(e) => onEnter(e, save)}
                placeholder="0"
              />
            </div>

            <div className="md:col-span-1 space-y-1.5">
              <Label>العملة</Label>
              <Select
                value={currency}
                onValueChange={(v) =>
                  setCurrency(v as (typeof CURRENCIES)[number])
                }
              >
                <SelectTrigger dir="ltr">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir="ltr">
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-1 flex md:items-end">
              <Button onClick={save} disabled={saving} className="w-full gap-2">
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                حفظ
              </Button>
            </div>
          </div>
        </Card>

        {/* Search + Export */}
        <Card className="p-4 flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالاسم أو النوع..."
              className="pr-9"
            />
          </div>
          <Button onClick={handleExport} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            تصدير Excel
          </Button>
        </Card>

        {/* Table */}
        <Card className="overflow-hidden">
          <div className="px-4 md:px-6 py-3 border-b flex items-center justify-between">
            <h2 className="text-base font-semibold">
              منتجات سنة <span dir="ltr">{year}</span>
            </h2>
            <span className="text-xs text-muted-foreground" dir="ltr">
              {fmt(products.length)} / {fmt(totals.total)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الصفحة</TableHead>
                  <TableHead className="text-right">اسم المنتج</TableHead>
                  <TableHead className="text-right">النوع</TableHead>
                  <TableHead className="text-right">الكمية</TableHead>
                  <TableHead className="text-right">السعر</TableHead>
                  <TableHead className="text-right">العملة</TableHead>
                  <TableHead className="text-right">الإجمالي</TableHead>
                  <TableHead className="text-right w-20">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground py-10"
                    >
                      <Loader2 className="h-5 w-5 animate-spin inline" />
                    </TableCell>
                  </TableRow>
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground py-10"
                    >
                      لا توجد منتجات بعد. ابدأ بإضافة أول منتج.
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell dir="ltr">{fmt(p.page)}</TableCell>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.category}</TableCell>
                      <TableCell dir="ltr">{fmt(p.quantity)}</TableCell>
                      <TableCell dir="ltr">{fmt(p.price)}</TableCell>
                      <TableCell dir="ltr">{p.currency}</TableCell>
                      <TableCell dir="ltr" className="font-semibold">
                        {fmt(p.quantity * p.price)}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => remove(p.id)}
                          aria-label="حذف"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
