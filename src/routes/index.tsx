import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, useMemo, useEffect, type KeyboardEvent } from "react";
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
import { Trash2, Save, Package, Calculator, NotebookPen } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

type ProductType = "صيني" | "فرنسي" | "مصري" | "تركي";

interface Product {
  id: string;
  name: string;
  type: ProductType;
  quantity: number;
  price: number;
}

type ProductsByYear = Record<string, Product[]>;

const TYPES: ProductType[] = ["صيني", "فرنسي", "مصري", "تركي"];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 11 }, (_, i) => String(currentYear - i));

function Index() {
  const [year, setYear] = useState<string>(String(currentYear));
  const [data, setData] = useState<ProductsByYear>({});

  const [name, setName] = useState("");
  const [type, setType] = useState<ProductType>("صيني");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");

  const nameRef = useRef<HTMLInputElement>(null);
  const typeRef = useRef<HTMLButtonElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);

  const products = data[year] ?? [];

  const totals = useMemo(() => {
    const count = products.length;
    const total = products.reduce((s, p) => s + p.quantity * p.price, 0);
    return { count, total };
  }, [products]);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const resetForm = () => {
    setName("");
    setType("صيني");
    setQuantity("");
    setPrice("");
    nameRef.current?.focus();
  };

  const save = () => {
    const trimmed = name.trim();
    const q = Number(quantity);
    const p = Number(price);
    if (!trimmed || !Number.isFinite(q) || !Number.isFinite(p) || q <= 0 || p < 0) {
      nameRef.current?.focus();
      return;
    }
    const product: Product = {
      id: crypto.randomUUID(),
      name: trimmed,
      type,
      quantity: q,
      price: p,
    };
    setData((prev) => ({
      ...prev,
      [year]: [product, ...(prev[year] ?? [])],
    }));
    resetForm();
  };

  const remove = (id: string) => {
    setData((prev) => ({
      ...prev,
      [year]: (prev[year] ?? []).filter((p) => p.id !== id),
    }));
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
                أداة إدخال سريعة بلوحة المفاتيح
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">السنة</Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-32" dir="rtl">
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
          </div>
        </header>

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
            <div className="md:col-span-4 space-y-1.5">
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

            <div className="md:col-span-3 space-y-1.5">
              <Label>النوع</Label>
              <Select
                value={type}
                onValueChange={(v) => {
                  setType(v as ProductType);
                  qtyRef.current?.focus();
                }}
              >
                <SelectTrigger
                  ref={typeRef}
                  dir="rtl"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      // allow native open/close; then move on next Enter
                    }
                  }}
                >
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

            <div className="md:col-span-1 flex md:items-end">
              <Button onClick={save} className="w-full gap-2">
                <Save className="h-4 w-4" />
                حفظ
              </Button>
            </div>
          </div>
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
                  <TableHead className="text-right">اسم المنتج</TableHead>
                  <TableHead className="text-right">النوع</TableHead>
                  <TableHead className="text-right">الكمية</TableHead>
                  <TableHead className="text-right">السعر</TableHead>
                  <TableHead className="text-right">الإجمالي</TableHead>
                  <TableHead className="text-right w-16">حذف</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-10"
                    >
                      لا توجد منتجات بعد. ابدأ بإضافة أول منتج.
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.type}</TableCell>
                      <TableCell dir="ltr">{fmt(p.quantity)}</TableCell>
                      <TableCell dir="ltr">{fmt(p.price)}</TableCell>
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
