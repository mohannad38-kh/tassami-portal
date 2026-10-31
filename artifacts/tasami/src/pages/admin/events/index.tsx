import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListEvents, useCreateEvent, useUpdateEvent } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Users, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useLanguage } from "@/hooks/use-language";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

type EventForm = { title: string; description: string; eventDate: string; location: string; capacity: string; status: string };
const blank: EventForm = { title: "", description: "", eventDate: "", location: "", capacity: "", status: "upcoming" };

export default function AdminEvents() {
  const { t, isEnglish } = useLanguage();
  const { data: events, isLoading, refetch } = useListEvents();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<EventForm>(blank);
  const startCreate = () => { setEditingId(null); setForm(blank); setOpen(true); };
  const startEdit = (event: NonNullable<typeof events>[number]) => {
    setEditingId(event.id);
    setForm({ title: event.title, description: event.description ?? "", eventDate: event.eventDate ? new Date(event.eventDate).toISOString().slice(0,16) : "", location: event.location ?? "", capacity: event.capacity ? String(event.capacity) : "", status: event.status });
    setOpen(true);
  };
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const title = form.title.trim();
    const capacity = form.capacity ? Number(form.capacity) : undefined;
    if (!title || !form.eventDate || (capacity !== undefined && (!Number.isSafeInteger(capacity) || capacity < 1))) {
      toast({ title: t("بيانات غير صحيحة"), description: t("أدخل عنواناً وتاريخاً صحيحين وسعة موجبة"), variant: "destructive" }); return;
    }
    const options = { onSuccess: () => { toast({ title: t("تم بنجاح"), description: t("تم حفظ الفعالية") }); setOpen(false); setEditingId(null); setForm(blank); refetch(); }, onError: () => toast({ title: t("تعذر الحفظ"), description: t("حدث خطأ أثناء حفظ الفعالية"), variant: "destructive" as const }) };
    const data = { title, description: form.description.trim(), eventDate: new Date(form.eventDate).toISOString(), location: form.location.trim(), ...(capacity !== undefined ? { capacity } : {}) };
    if (editingId === null) createEvent.mutate({ data }, options);
    else updateEvent.mutate({ id: editingId, data: { ...data, status: form.status } }, options);
  };
  const saving = createEvent.isPending || updateEvent.isPending;
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming": return <Badge variant="default" className="bg-secondary text-secondary-foreground">{t("قادمة")}</Badge>;
      case "ongoing": return <Badge variant="default" className="bg-green-600">{t("مستمرة")}</Badge>;
      case "completed": return <Badge variant="secondary">{t("مكتملة")}</Badge>;
      case "cancelled": return <Badge variant="destructive">{t("ملغاة")}</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };
  return <AdminLayout>
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"><h1 className="text-2xl font-bold text-primary">{t("إدارة الفعاليات")}</h1><Button onClick={startCreate}><Plus className="h-4 w-4 mr-2 rtl:ml-2" /> {t("إضافة فعالية")}</Button></div>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{editingId === null ? t("إضافة فعالية") : t("تعديل الفعالية")}</DialogTitle></DialogHeader>
      <form onSubmit={save} className="space-y-4 pt-2 max-h-[75vh] overflow-y-auto">
        <div className="space-y-2"><Label htmlFor="event-title">{t("عنوان الفعالية")}</Label><Input id="event-title" required maxLength={200} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
        <div className="space-y-2"><Label htmlFor="event-description">{t("الوصف")}</Label><Textarea id="event-description" maxLength={5000} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
        <div className="space-y-2"><Label htmlFor="event-date">{t("التاريخ والوقت")}</Label><Input id="event-date" type="datetime-local" required value={form.eventDate} onChange={e => setForm({ ...form, eventDate: e.target.value })} /></div>
        <div className="space-y-2"><Label htmlFor="event-location">{t("المكان")}</Label><Input id="event-location" maxLength={300} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
        <div className="space-y-2"><Label htmlFor="event-capacity">{t("السعة")}</Label><Input id="event-capacity" type="number" min="1" step="1" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} /></div>
        {editingId !== null && <div className="space-y-2"><Label htmlFor="event-status">{t("الحالة")}</Label><select id="event-status" className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="upcoming">{t("قادمة")}</option><option value="ongoing">{t("مستمرة")}</option><option value="completed">{t("مكتملة")}</option><option value="cancelled">{t("ملغاة")}</option></select></div>}
        <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("إلغاء")}</Button><Button type="submit" disabled={saving}>{saving ? t("جاري الحفظ...") : t("حفظ")}</Button></DialogFooter>
      </form>
    </DialogContent></Dialog>
    <Card><CardContent className="p-0">{isLoading ? <div className="p-6 space-y-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div> : events?.length === 0 ? <div className="text-center py-16 text-muted-foreground">{t("لا توجد فعاليات مسجلة")}</div> : <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>{t("عنوان الفعالية")}</TableHead><TableHead>{t("التاريخ")}</TableHead><TableHead>{t("المسجلين")}</TableHead><TableHead>{t("الحالة")}</TableHead><TableHead className="text-left">{t("إجراءات")}</TableHead></TableRow></TableHeader><TableBody>{events?.map(event => <TableRow key={event.id}><TableCell className="font-medium max-w-[200px] truncate">{event.title}</TableCell><TableCell><div className="flex items-center text-sm"><CalendarIcon className="h-3 w-3 mr-1 rtl:ml-1 text-muted-foreground" />{format(new Date(event.eventDate), "dd MMM yyyy", { locale: isEnglish ? undefined : ar })}</div></TableCell><TableCell><div className="flex items-center text-sm"><Users className="h-3 w-3 mr-1 rtl:ml-1 text-muted-foreground" />{new Intl.NumberFormat("en", { useGrouping: false }).format(event.registeredCount || 0)} {event.capacity ? `/ ${new Intl.NumberFormat("en", { useGrouping: false }).format(event.capacity)}` : ""}</div></TableCell><TableCell>{getStatusBadge(event.status)}</TableCell><TableCell className="text-left"><Button size="sm" variant="ghost" onClick={() => startEdit(event)} aria-label={t("تعديل الفعالية")}><Edit className="h-4 w-4" /></Button></TableCell></TableRow>)}</TableBody></Table></div>}</CardContent></Card>
  </AdminLayout>;
}
