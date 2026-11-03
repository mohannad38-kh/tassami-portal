import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListMeetings, useCreateMeeting, useUpdateMeeting, useDeleteMeeting } from "@workspace/api-client-react";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useLanguage } from "@/hooks/use-language";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

type MeetingForm = { title: string; meetingDate: string; location: string; agenda: string; status: string };

const emptyForm: MeetingForm = { title: "", meetingDate: "", location: "", agenda: "", status: "scheduled" };

export default function AdminMeetings() {
  const { t, isEnglish } = useLanguage();
  const { data: rawMeetings, isLoading, refetch } = useListMeetings();
  const createMeeting = useCreateMeeting();
  const updateMeeting = useUpdateMeeting();
  const deleteMeeting = useDeleteMeeting();
  const { toast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<MeetingForm>(emptyForm);

  // حماية صارمة لضمان أن البيانات دائماً مصفوفة لتجنب أي أخطاء وقت التشغيل
  const meetings = Array.isArray(rawMeetings) 
    ? rawMeetings 
    : ((rawMeetings as any)?.items || []);

  const openCreate = () => { 
    setEditingId(null); 
    setFormData(emptyForm); 
    setIsOpen(true); 
  };

  const openEdit = (meeting: any) => {
    const parsedDate = meeting.meetingDate ? new Date(meeting.meetingDate) : new Date();
    setEditingId(meeting.id);
    setFormData({
      title: meeting.title || "",
      meetingDate: Number.isNaN(parsedDate.getTime()) ? "" : new Date(parsedDate.getTime() - parsedDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16),
      location: meeting.location ?? "",
      agenda: meeting.agenda ?? "",
      status: meeting.status || "scheduled",
    });
    setIsOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.meetingDate || !formData.title.trim()) {
      toast({ title: t("بيانات غير مكتملة"), description: t("يرجى إدخال عنوان الاجتماع وتحديد التاريخ"), variant: "destructive" });
      return;
    }

    const payload = {
      title: formData.title.trim(),
      meetingDate: new Date(formData.meetingDate).toISOString(),
      location: formData.location.trim(),
      agenda: formData.agenda.trim(),
      ...(editingId !== null ? { status: formData.status } : {}),
    };

    const options = {
      onSuccess: () => {
        toast({ title: t("تم بنجاح"), description: editingId === null ? t("تم إنشاء الاجتماع") : t("تم تحديث الاجتماع") });
        setIsOpen(false);
        setFormData(emptyForm);
        setEditingId(null);
        void refetch();
      },
      onError: () => toast({ title: t("تعذر الحفظ"), description: t("حدث خطأ أثناء حفظ الاجتماع"), variant: "destructive" as const }),
    };

    if (editingId === null) {
      createMeeting.mutate({ data: { title: payload.title, meetingDate: payload.meetingDate, location: payload.location, agenda: payload.agenda } }, options);
    } else {
      updateMeeting.mutate({ id: editingId, data: payload }, options);
    }
  };

  const isSaving = createMeeting.isPending || updateMeeting.isPending;

  const removeMeeting = (meeting: any) => deleteMeeting.mutate({ id: meeting.id }, {
    onSuccess: () => {
      toast({ title: t("تم الحذف"), description: t("تم حذف الاجتماع") });
      void refetch();
    },
    onError: (error: unknown) => toast({
      title: t("تعذر الحذف"),
      description: error instanceof Error ? error.message : t("حدث خطأ أثناء حذف الاجتماع"),
      variant: "destructive",
    }),
  });

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Calendar className="h-6 w-6" /> {t("الاجتماعات")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{t("إدارة اجتماعات لجان ومجلس المبادرة وجداول أعمالها")}</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> {t("إضافة اجتماع")}
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId === null ? t("إضافة اجتماع جديد") : t("تعديل الاجتماع")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="meeting-title">{t("عنوان الاجتماع")}</Label>
              <Input id="meeting-title" maxLength={200} required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder={t("أدخل عنوان الاجتماع...")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meeting-date">{t("التاريخ والوقت")}</Label>
              <Input id="meeting-date" type="datetime-local" required value={formData.meetingDate} onChange={(e) => setFormData({ ...formData, meetingDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meeting-location">{t("المكان")}</Label>
              <Input id="meeting-location" maxLength={300} value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder={t("مكان الاجتماع أو الرابط الإلكتروني")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meeting-agenda">{t("جدول الأعمال")}</Label>
              <Textarea id="meeting-agenda" rows={4} maxLength={5000} value={formData.agenda} onChange={(e) => setFormData({ ...formData, agenda: e.target.value })} placeholder={t("بنود ونقاط جدول الأعمال...")} />
            </div>
            {editingId !== null && (
              <div className="space-y-2">
                <Label htmlFor="meeting-status">{t("الحالة")}</Label>
                <select id="meeting-status" className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                  <option value="scheduled">{t("مجدول")}</option>
                  <option value="completed">{t("مكتمل")}</option>
                  <option value="cancelled">{t("ملغي")}</option>
                </select>
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>{t("إلغاء")}</Button>
              <Button type="submit" disabled={isSaving}>{isSaving ? t("جاري الحفظ...") : t("حفظ")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="shadow-sm border-border/50">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : meetings.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-20" />
              {t("لا توجد اجتماعات مسجلة")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("عنوان الاجتماع")}</TableHead>
                    <TableHead>{t("التاريخ")}</TableHead>
                    <TableHead>{t("المكان")}</TableHead>
                    <TableHead>{t("الحالة")}</TableHead>
                    <TableHead className="text-left">{t("إجراءات")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {meetings.map((meeting: any) => (
                    <TableRow key={meeting.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium max-w-[200px] truncate">{meeting.title}</TableCell>
                      <TableCell>
                        {meeting.meetingDate ? format(new Date(meeting.meetingDate), "dd MMM yyyy", { locale: isEnglish ? undefined : ar }) : '-'}
                      </TableCell>
                      <TableCell>{meeting.location || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{t(meeting.status)}</Badge>
                      </TableCell>
                      <TableCell className="text-left">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(meeting)} aria-label={t("تعديل الاجتماع")}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <ConfirmDeleteButton
                          ariaLabel={t("حذف الاجتماع")}
                          confirmMessage={t("هل أنت متأكد من حذف هذا الاجتماع؟")}
                          disabled={deleteMeeting.isPending}
                          onConfirm={() => removeMeeting(meeting)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}