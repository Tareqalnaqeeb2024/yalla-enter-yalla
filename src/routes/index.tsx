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
  Edit2,
  ChevronRight,
  ChevronLeft,
  X,
} from "lucide-react";
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  exportUrl,
  getApiBase,
  setApiBase,
  getAllNames,
  type ApiProduct,
} from "@/lib/api";

export const Route = createFileRoute("/")({
  component: Index,
});

const TYPES = ["صيني", "فرنسي", "مصري", "تركي","كوجيفا","الفؤاد"] as const;
const CURRENCIES = ["دولار", "يورو", "جنية", "سعودي"] as const;

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 2007 + 1 }, (_, i) => String(currentYear - i));
const PAGES = Array.from({ length: 100 }, (_, i) => String(i + 1));

function Index() {
  // Filters & State
  const [year, setYear] = useState<string>(String(currentYear));
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Pagination State
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [apiUrl, setApiUrlState] = useState<string>(() => getApiBase());
  const [showSettings, setShowSettings] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [page, setPage] = useState("1");
  const [name, setName] = useState("");
  const [type, setType] = useState<(typeof TYPES)[number]>("مصري");
  const [currency, setCurrency] = useState<(typeof CURRENCIES)[number]>("جنية");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  // Dropdown state for name suggestions
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [allNames, setAllNames] = useState<string[]>([]);

  // Refs
  const nameRef = useRef<HTMLInputElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const saveBtnRef = useRef<HTMLButtonElement>(null);

  const totals = useMemo(() => {
    return { count: totalCount, total: products.reduce((s, p) => s + (p.quantity * p.price), 0) };
  }, [products, totalCount]);

  const existingNames = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.name)));
  }, [products]);

  const nameSuggestions = useMemo(() => {
    const term = name.trim().toLowerCase();
    if (!term) {
      setShowSuggestions(false);
      return [];
    }
    const suggestions = allNames
      .filter((existingName) => existingName.toLowerCase().includes(term))
      .slice(0, 6);
    setShowSuggestions(suggestions.length > 0);
    setSelectedSuggestionIndex(-1); // Reset selection when suggestions change
    return suggestions;
  }, [allNames, name]);

  const fetchAllNames = useCallback(async () => {
    try {
      const names = await getAllNames();
      setAllNames(names);
    } catch (e) {
      console.error("Failed to fetch all names:", e);
      setAllNames([]);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listProducts({
        year: Number(year),
        search: search.trim() || undefined,
        pageNumber,
        pageSize: 20,
      });
      // التعامل مع هيكلة البيانات الجديدة من الباك إند
      setProducts(response.items || []);
      setTotalCount(response.totalCount || 0);
      setTotalPages(Math.ceil((response.totalCount || 0) / 20));
    } catch (e) {
      setError("تعذّر الاتصال بالخادم. تأكد من تشغيل الـ API.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [year, search, pageNumber]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    fetchAllNames();
  }, [fetchAllNames]);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setQuantity("");
    setPrice("");
    setDate("");
    setNotes("");
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    nameRef.current?.focus();
  };

  const startEdit = (p: ApiProduct) => {
    setEditingId(p.id);
    setPage(String(p.page));
    setName(p.name);
    setType(p.category as any);
    setQuantity(String(p.quantity));
    setPrice(String(p.price));
    setCurrency(p.currency as any);
    setDate(p.date ? p.date.split("T")[0] : ""); // تنسيق التاريخ للـ input
    setNotes(p.notes || "");
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleKeyDown = (e: React.KeyboardEvent, nextRef?: React.RefObject<HTMLInputElement>, isSubmit = false) => {
  if (e.key === "Enter") {
    e.preventDefault(); // لمنع إرسال الفورم الافتراضي
    if (isSubmit) {
      save(); // إذا كان في حقل السعر، احفظ مباشرة
    } else if (nextRef) {
      nextRef.current?.focus(); // انقل التركيز للحقل التالي
    }
  }
};

  const save = async () => {
    if (!name.trim() || !quantity || !price) {
      nameRef.current?.focus();
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        id: editingId || 0,
        page: Number(page),
        name: name.trim(),
        category: type,
        quantity: Number(quantity),
        price: Number(price),
        currency,
        year: Number(year),
        date: date || null,
        notes: notes || null,
      };

      if (editingId) {
        await updateProduct(editingId, payload);
      } else {
        await createProduct(payload);
      }
      
      resetForm();
      await refresh();
      await fetchAllNames();
    } catch {
      setError("فشل حفظ البيانات. تحقق من الاتصال.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا البند؟")) return;
    try {
      await deleteProduct(id);
      await refresh();
      await fetchAllNames();
    } catch {
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

  const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });

  return (
    <div dir="rtl" className="min-h-screen bg-background pb-10" onKeyDown={(e) => e.ctrlKey && e.key === "Enter" && save()}>
      <div className="mx-auto max-w-6xl px-4 py-6 md:py-10 space-y-6">
        
        {/* Header */}
        <header className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <NotebookPen className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">دفتر قطع الغيار</h1>
              <p className="text-xs text-muted-foreground">متصل بـ <span dir="ltr">{apiUrl}</span></p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Select value={year} onValueChange={(v) => { setYear(v); setPageNumber(1); }}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>{YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={refresh} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="icon" onClick={() => setShowSettings(!showSettings)}><Settings2 className="h-4 w-4" /></Button>
          </div>
        </header>

        {showSettings && (
          <Card className="p-4 space-y-3">
            <Label>عنوان الـ API</Label>
            <div className="flex gap-2">
              <Input dir="ltr" value={apiUrl} onChange={(e) => setApiUrlState(e.target.value)} />
              <Button onClick={saveApiUrl}>حفظ</Button>
            </div>
          </Card>
        )}

        {error && <Card className="p-3 border-destructive bg-destructive/5 text-destructive text-sm">{error}</Card>}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 flex items-center gap-3">
            <Package className="h-5 w-5 text-primary" />
            <div>
              <div className="text-xs text-muted-foreground">إجمالي السجلات</div>
              <div className="text-lg font-bold">{fmt(totals.count)}</div>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <Calculator className="h-5 w-5 text-primary" />
            <div>
              <div className="text-xs text-muted-foreground">قيمة الصفحة الحالية</div>
              <div className="text-lg font-bold">{fmt(totals.total)}</div>
            </div>
          </Card>
        </div>

        {/* Form */}
      <Card className={`p-4 md:p-6 border-t-4 transition-all ${editingId ? "border-t-orange-500 bg-orange-50/10" : "border-t-primary"}`}>

  <div className="flex justify-between items-center mb-6">
    <h2 className="font-bold text-lg">
      {editingId ? "تعديل بيانات الصنف" : "إضافة صنف جديد للدفتر"}
    </h2>

    {editingId && (
      <Button variant="ghost" size="sm" onClick={resetForm} className="text-orange-600">
        <X className="h-4 w-4 ml-1" /> إلغاء التعديل
      </Button>
    )}
  </div>

  {/* 🔹 السطر الأول */}
  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">

    <div className="md:col-span-2 space-y-1.5">
      <Label>رقم الصفحة</Label>
      <Select value={page} onValueChange={setPage}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent className="max-h-40">
          {PAGES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>

    <div className="md:col-span-2 space-y-1.5">
      <Label>التاريخ</Label>
      <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
    </div>

    <div className="md:col-span-2 space-y-1.5">
      <Label>النوع</Label>
      <Select value={type} onValueChange={(v: any) => setType(v)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>

    <div className="md:col-span-2 space-y-1.5">
      <Label>العملة</Label>
      <Select value={currency} onValueChange={(v: any) => setCurrency(v)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>

    <div className="md:col-span-4 space-y-1.5">
      <Label>ملاحظات</Label>
      <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="..." />
    </div>

  </div>

  {/* 🔹 السطر الثاني */}
  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

    <div className="md:col-span-6 space-y-1.5 relative">
      <Label>اسم الصنف</Label>
      <Input
        ref={nameRef}
        value={name}
        autoComplete="off"
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (!showSuggestions || nameSuggestions.length === 0) {
            if (e.key === "Enter") {
              e.preventDefault();
              qtyRef.current?.focus();
            }
            return;
          }

          switch (e.key) {
            case "ArrowDown":
              e.preventDefault();
              setSelectedSuggestionIndex(prev => 
                prev < nameSuggestions.length - 1 ? prev + 1 : 0
              );
              break;
            case "ArrowUp":
              e.preventDefault();
              setSelectedSuggestionIndex(prev => 
                prev > 0 ? prev - 1 : nameSuggestions.length - 1
              );
              break;
            case "Enter":
              e.preventDefault();
              if (selectedSuggestionIndex >= 0) {
                setName(nameSuggestions[selectedSuggestionIndex]);
                setShowSuggestions(false);
                setSelectedSuggestionIndex(-1);
                qtyRef.current?.focus();
              } else {
                qtyRef.current?.focus();
              }
              break;
            case "Escape":
              setShowSuggestions(false);
              setSelectedSuggestionIndex(-1);
              break;
            default:
              // For other keys, let the input handle them normally
              break;
          }
        }}
        onFocus={() => {
          if (nameSuggestions.length > 0) {
            setShowSuggestions(true);
          }
        }}
        onBlur={() => {
          // Delay hiding to allow click on suggestions
          setTimeout(() => {
            setShowSuggestions(false);
            setSelectedSuggestionIndex(-1);
          }, 150);
        }}
      />
      {showSuggestions && nameSuggestions.length > 0 && (
        <div className="absolute inset-x-0 top-full z-20 mt-2 max-h-56 overflow-y-auto rounded-lg border border-border bg-popover text-popover-foreground shadow-lg">
          {nameSuggestions.map((suggestion, index) => (
            <button
              key={`${suggestion}-${index}`}
              type="button"
              onClick={() => {
                setName(suggestion);
                setShowSuggestions(false);
                setSelectedSuggestionIndex(-1);
                qtyRef.current?.focus();
              }}
              className={`w-full cursor-pointer border-b border-border px-3 py-2 text-right text-sm transition-colors ${
                index === selectedSuggestionIndex 
                  ? "bg-primary/20 text-primary" 
                  : "hover:bg-primary/10"
              }`}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>

    <div className="md:col-span-2 space-y-1.5">
      <Label>الكمية</Label>
     <Input
  ref={qtyRef}
  type="number"
  value={quantity}
  onChange={(e) => setQuantity(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      priceRef.current?.focus();
    }
  }}
/>
    </div>

    <div className="md:col-span-2 space-y-1.5">
      <Label>سعر الوحدة</Label>
    <Input
  ref={priceRef}
  type="number"
  value={price}
  onChange={(e) => setPrice(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      e.preventDefault();
       save();
    }
  }}
/>

    </div>

    <div className="md:col-span-2">
    <Button
  ref={saveBtnRef}
  onClick={save}
  disabled={saving}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      save();
    }
  }}
  className="w-full h-10 mt-auto"
>
  {saving ? (
    <Loader2 className="animate-spin h-4 w-4" />
  ) : editingId ? (
    <Edit2 className="h-4 w-4 ml-2" />
  ) : (
    <Save className="h-4 w-4 ml-2" />
  )}

  {editingId ? "تحديث" : "حفظ"}
</Button>
    </div>

  </div>

</Card>

        {/* Search & Table */}
        <Card className="p-4 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pr-9" placeholder="بحث سريع..." value={search} onChange={(e) => { setSearch(e.target.value); setPageNumber(1); }} />
          </div>
          <Button variant="outline" onClick={handleExport}><Download className="h-4 w-4 ml-2" /> Excel</Button>
        </Card>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">ص</TableHead>
                  <TableHead className="text-right">اسم الصنف</TableHead>
                  <TableHead className="text-right">الكمية</TableHead>
                  <TableHead className="text-right">السعر</TableHead>
                  <TableHead className="text-right">الإجمالي</TableHead>
                  <TableHead className="text-center w-24">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10"><Loader2 className="animate-spin inline h-6 w-6" /></TableCell></TableRow>
                ) : products.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">لا توجد بيانات متاحة.</TableCell></TableRow>
                ) : (
                  products.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.page}</TableCell>
                      <TableCell className="font-medium">
                        {p.name}
                        {p.notes && <p className="text-[10px] text-muted-foreground">{p.notes}</p>}
                      </TableCell>
                      <TableCell>{p.quantity}</TableCell>
                      <TableCell>{fmt(p.price)}</TableCell>
                      <TableCell className="font-bold text-primary">{fmt(p.quantity * p.price)}</TableCell>
                      <TableCell className="flex justify-center gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600" onClick={() => startEdit(p)}><Edit2 className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 border-t flex items-center justify-between bg-muted/20">
            <p className="text-xs text-muted-foreground">عرض سجلات سنة {year}</p>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setPageNumber(p => p - 1)} disabled={pageNumber === 1}><ChevronRight className="h-4 w-4" /></Button>
              <span className="text-sm font-medium">صفحة {pageNumber} من {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPageNumber(p => p + 1)} disabled={pageNumber === totalPages}><ChevronLeft className="h-4 w-4" /></Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}