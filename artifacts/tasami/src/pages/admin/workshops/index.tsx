import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListWorkshops, useCreateWorkshop, useUpdateWorkshop, useListUsers } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Users, Calendar as CalendarIcon, GraduationCap } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useLanguage } from "@/hooks/use-language";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

type WorkshopForm = { title: string; description: string; trainerId: string; workshopDate: string; location: string; capacity: string; status: string };
const blank: WorkshopForm = { title: "", description: "", trainerId: "", workshopDate: "", location: "", capacity: "", status: "upcoming" };

export default function AdminWorkshops() {
  const { t, isEnglish } = useLanguage();
  const { data: workshops, isLoading, refetch } = useListWorkshops();
  const { data: users } = useListUsers();
  const createWorkshop = useCreateWorkshop();
  const updateWorkshop = useUpdateWorkshop();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<WorkshopForm>(blank);
  const startCreate = () => { setEditingId(null); setForm(blank); setOpen(true); };
  const startEdit = (ws: NonNullable<typeof workshops>[number]) => {
    setEditingId(ws.id);
    setForm({ title: ws.title, description: ws.description ?? "", trainerId: ws.trainerId ? String(ws.trainerId) : "", workshopDate: ws.workshopDate ? new Date(ws.workshopDate).toISOString().slice(0,16) : "", location: ws.location ?? "", capacity: ws.capacity ? String(ws.capacity) : "", status: ws.status });
    setOpen(true);
  };
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const title = form.title.trim();
    const capacity = form.capacity ? Number(form.capacity) : undefined;
    const trainerId = form.trainerId ? Number(form.trainerId) : null;
    if (!title || !form.workshopDate || (capacity !== undefined && (!Number.isSafeInteger(capacity) || capacity < 1)) || (trainerId !== null && (!Number.isSafeInteger(trainerId) || trainerId <= 0))) {
      toast({ title: t("بيانات غير صحيحة"), description: t("تحقق من العنوان والتاريخ والمدرب والسعة"), variant: "destructive" }); return;
    }
    const options = { onSuccess: () => { toast({ title: t("تم بنجاح"), description: t("تم حفظ الورشة") }); setOpen(false); setEditingId(null); setForm(blank); refetch(); }, onError: () => toast({ title: t("تعذر الحفظ"), description: t("حدث خطأ أثناء حفظ الورشة"), variant: "destructive" as const }) };
    const common = { title, description: form.description.trim(), workshopDate: new Date(form.workshopDate).toISOString(), location: form.location.trim(), ...(capacity !== undefined ? { capacity } : {}) };
    if (editingId === null) createWorkshop.mutate({ data: { ...common, ...(trainerId !== null ? { trainerId } : {}) } }, options);
    else updateWorkshop.mutate({ id: editingId, data: { ...common, trainerId, status: form.status } }, options);
  };
  const saving = createWorkshop.isPending || updateWorkshop.isPending;
  return <AdminLayout>
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"><h1 className="text-2xl font-bold text-primary">{t("إدارة الورش والدورات")}</h1><Button onClick={startCreate}><Plus className="h-4 w-4 mr-2 rtl:ml-2" /> {t("إضافة ورشة")}</Button></div>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{editingId === null ? t("إضافة ورشة") : t("تعديل الورشة")}</DialogTitle></DialogHeader>
      <form onSubmit={save} className="space-y-4 pt-2 max-h-[75vh] overflow-y-auto">
        <div className="space-y-2"><Label htmlFor="workshop-title">{t("عنوان الورشة")}</Label><Input id="workshop-title" required maxLength={200} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
        <div className="space-y-2"><Label htmlFor="workshop-description">{t("الوصف")}</Label><Textarea id="workshop-description" maxLength={5000} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
        <div className="space-y-2"><Label htmlFor="workshop-trainer">{t("المدرب")}</Label><select id="workshop-trainer" className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={form.trainerId} onChange={e => setForm({ ...form, trainerId: e.target.value })}><option value="">{t("بدون مدرب محدد")}</option>{users?.filter(u => u.isActive).map(u => <option key={u.id} value={u.id}>{u.name} — {u.email}</option>)}</select></div>
        <div className="space-y-2"><Label htmlFor="workshop-date">{t("التاريخ والوقت")}</Label><Input id="workshop-date" type="datetime-local" required value={form.workshopDate} onChange={e => setForm({ ...form, workshopDate: e.target.value })} /></div>
        <div className="space-y-2"><Label htmlFor="workshop-location">{t("المكان")}</Label><Input id="workshop-location" maxLength={300} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
        <div className="space-y-2"><Label htmlFor="workshop-capacity">{t("السعة")}</Label><Input id="workshop-capacity" type="number" min="1" step="1" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} /></div>
        {editingId !== null && <div className="space-y-2"><Label htmlFor="workshop-status">{t("الحالة")}</Label><select id="workshop-status" className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="upcoming">{t("قادمة")}</option><option value="ongoing">{t("مستمرة")}</option><option value="completed">{t("مكتملة")}</option><option value="cancelled">{t("ملغاة")}</option></select></div>}
        <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("إلغاء")}</Button><Button type="submit" disabled={saving}>{saving ? t("جاري الحفظ...") : t("حفظ")}</Button></DialogFooter>
      </form>
    </DialogContent></Dialog>
    <Card><CardContent className="p-0">{isLoading ? <div className="p-6 space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div> : workshops?.length === 0 ? <div className="text-center py-16 text-muted-foreground">{t("لا توجد ورش مسجلة")}</div> : <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>{t("عنوان الورشة")}</TableHead><TableHead>{t("المدرب")}</TableHead><TableHead>{t("التاريخ")}</TableHead><TableHead>{t("المسجلين")}</TableHead><TableHead>{t("الحالة")}</TableHead><TableHead className="text-left"></TableHead></TableRow></TableHeader><TableBody>{workshops?.map(ws => <TableRow key={ws.id}><TableCell className="font-medium max-w-[200px] truncate">{ws.title}</TableCell><TableCell><div className="flex items-center text-sm"><GraduationCap className="h-3 w-3 mr-1 rtl:ml-1 text-muted-foreground" />{ws.trainerName || "-"}</div></TableCell><TableCell><div className="flex items-center text-sm"><CalendarIcon className="h-3 w-3 mr-1 rtl:ml-1 text-muted-foreground" />{format(new Date(ws.workshopDate), "dd MMM yyyy", { locale: isEnglish ? undefined : ar })}</div></TableCell><TableCell><div className="flex items-center text-sm"><Users className="h-3 w-3 mr-1 rtl:ml-1 text-muted-foreground" />{new Intl.NumberFormat("en", { useGrouping: false }).format(ws.registeredCount || 0)}</div></TableCell><TableCell><Badge variant="outline">{t(ws.status)}</Badge></TableCell><TableCell className="text-left"><Button size="sm" variant="ghost" onClick={() => startEdit(ws)} aria-label={t("تعديل الورشة")}><Edit className="h-4 w-4" /></Button></TableCell></TableRow>)}</TableBody></Table></div>}</CardContent></Card>
  </AdminLayout>;
}
