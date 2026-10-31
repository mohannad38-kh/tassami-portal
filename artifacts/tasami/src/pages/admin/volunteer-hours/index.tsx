import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListVolunteerHours, useLogVolunteerHours, useListMembers, useListEvents } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useLanguage } from "@/hooks/use-language";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function AdminVolunteerHours() {
  const { t, isEnglish } = useLanguage(); const { toast } = useToast();
  const { data: hours, isLoading, refetch } = useListVolunteerHours();
  const { data: members } = useListMembers(); const { data: events } = useListEvents();
  const logHours = useLogVolunteerHours();
  const [open, setOpen] = useState(false); const [memberId, setMemberId] = useState(""); const [eventId, setEventId] = useState("");
  const [amount, setAmount] = useState("1"); const [activityDate, setActivityDate] = useState(new Date().toISOString().slice(0,10)); const [description, setDescription] = useState("");
  const save = (e: React.FormEvent) => { e.preventDefault(); const hoursValue = Number(amount); if (!memberId || !Number.isFinite(hoursValue) || hoursValue <= 0 || hoursValue > 24 || !activityDate) { toast({ title: t("بيانات غير صحيحة"), description: t("اختر العضو وأدخل عدد ساعات صحيحاً والتاريخ"), variant: "destructive" }); return; } const data = { memberId: Number(memberId), hours: hoursValue, activityDate, ...(eventId ? { eventId: Number(eventId) } : {}), ...(description.trim() ? { description: description.trim() } : {}) }; logHours.mutate({ data }, { onSuccess: () => { toast({ title: t("تم بنجاح"), description: t("تم تسجيل الساعات التطوعية") }); setOpen(false); setMemberId(""); setEventId(""); setAmount("1"); setDescription(""); refetch(); }, onError: () => toast({ title: t("تعذر التسجيل"), description: t("تحقق من البيانات وحاول مجدداً"), variant: "destructive" }) }); };
  return <AdminLayout>
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"><div><h1 className="text-2xl font-bold text-primary">{t("ساعات التطوع")}</h1><p className="text-muted-foreground text-sm mt-1">{t("سجل الساعات التطوعية لجميع الأعضاء")}</p></div><Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2 rtl:ml-2" /> {t("تسجيل ساعات تطوع")}</Button></div>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{t("تسجيل ساعات تطوعية")}</DialogTitle></DialogHeader><form onSubmit={save} className="space-y-4 pt-2"><div className="space-y-2"><Label htmlFor="vol-member">{t("العضو")}</Label><select id="vol-member" required className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={memberId} onChange={e => setMemberId(e.target.value)}><option value="">{t("اختر العضو")}</option>{members?.map(member => <option key={member.id} value={member.id}>{member.userName || member.userEmail || member.membershipNumber}</option>)}</select></div><div className="space-y-2"><Label htmlFor="vol-event">{t("الفعالية (اختياري)")}</Label><select id="vol-event" className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={eventId} onChange={e => setEventId(e.target.value)}><option value="">{t("بدون فعالية")}</option>{events?.map(event => <option key={event.id} value={event.id}>{event.title}</option>)}</select></div><div className="space-y-2"><Label htmlFor="vol-amount">{t("عدد الساعات")}</Label><Input id="vol-amount" type="number" min="0.25" max="24" step="0.25" required value={amount} onChange={e => setAmount(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="vol-date">{t("التاريخ")}</Label><Input id="vol-date" type="date" required value={activityDate} onChange={e => setActivityDate(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="vol-description">{t("الوصف")}</Label><Textarea id="vol-description" maxLength={1000} value={description} onChange={e => setDescription(e.target.value)} /></div><DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("إلغاء")}</Button><Button type="submit" disabled={logHours.isPending}>{logHours.isPending ? t("جاري الحفظ...") : t("حفظ")}</Button></DialogFooter></form></DialogContent></Dialog>
    <Card><CardContent className="p-0">{isLoading ? <div className="p-6 space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div> : hours?.length === 0 ? <div className="text-center py-16 text-muted-foreground">{t("لا توجد ساعات تطوعية مسجلة")}</div> : <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>{t("التاريخ")}</TableHead><TableHead>{t("العضو")}</TableHead><TableHead>{t("الفعالية")}</TableHead><TableHead>{t("الوصف")}</TableHead><TableHead className="text-left">{t("الساعات")}</TableHead></TableRow></TableHeader><TableBody>{hours?.map(hour => <TableRow key={hour.id}><TableCell>{format(new Date(hour.activityDate), "dd MMM yyyy", { locale: isEnglish ? undefined : ar })}</TableCell><TableCell className="font-medium">{hour.memberName}</TableCell><TableCell>{hour.eventTitle || "-"}</TableCell><TableCell className="max-w-[200px] truncate" title={hour.description || ""}>{hour.description || "-"}</TableCell><TableCell className="text-left font-bold text-primary">{new Intl.NumberFormat("en", { useGrouping: false }).format(hour.hours)}</TableCell></TableRow>)}</TableBody></Table></div>}</CardContent></Card>
  </AdminLayout>;
}