import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListTasks, useCreateTask, useUpdateTask, useListUsers } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Edit } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useLanguage } from "@/hooks/use-language";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

type TaskForm = { title: string; description: string; assignedTo: string; dueDate: string; priority: string; status: string; progress: string };
const emptyForm: TaskForm = { title: "", description: "", assignedTo: "", dueDate: "", priority: "medium", status: "pending", progress: "0" };

export default function AdminTasks() {
  const { t, isEnglish } = useLanguage();
  const { data: tasks, isLoading, refetch } = useListTasks();
  const { data: users } = useListUsers();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<TaskForm>(emptyForm);

  const openCreate = () => { setEditingId(null); setFormData(emptyForm); setIsOpen(true); };
  const openEdit = (task: NonNullable<typeof tasks>[number]) => {
    setEditingId(task.id);
    setFormData({ title: task.title, description: task.description ?? "", assignedTo: task.assignedTo ? String(task.assignedTo) : "", dueDate: task.dueDate ?? "", priority: task.priority ?? "medium", status: task.status, progress: String(task.progress ?? 0) });
    setIsOpen(true);
  };
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const title = formData.title.trim();
    const progress = Number(formData.progress);
    if (!title || !Number.isInteger(progress) || progress < 0 || progress > 100) {
      toast({ title: t("بيانات غير صحيحة"), description: t("تحقق من عنوان المهمة ونسبة الإنجاز (0 إلى 100)"), variant: "destructive" });
      return;
    }
    const assignedTo = formData.assignedTo ? Number(formData.assignedTo) : null;
    if (assignedTo !== null && (!Number.isSafeInteger(assignedTo) || assignedTo <= 0)) return;
    const common = { title, description: formData.description.trim(), assignedTo, dueDate: formData.dueDate || null, priority: formData.priority };
    const options = {
      onSuccess: () => { toast({ title: t("تم بنجاح"), description: editingId === null ? t("تم إنشاء المهمة") : t("تم تحديث المهمة") }); setIsOpen(false); setEditingId(null); setFormData(emptyForm); refetch(); },
      onError: () => toast({ title: t("تعذر الحفظ"), description: t("حدث خطأ أثناء حفظ المهمة"), variant: "destructive" as const }),
    };
    if (editingId === null) {
      const payload = { title, description: formData.description.trim(), ...(assignedTo !== null ? { assignedTo } : {}), ...(formData.dueDate ? { dueDate: formData.dueDate } : {}), priority: formData.priority };
      createTask.mutate({ data: payload }, options);
    } else {
      updateTask.mutate({ id: editingId, data: { ...common, status: formData.status, progress } }, options);
    }
  };
  const isSaving = createTask.isPending || updateTask.isPending;

  const getPriorityBadge = (priority: string | null | undefined) => {
    switch (priority) {
      case "high": return <Badge variant="destructive">{t("عالية")}</Badge>;
      case "medium": return <Badge variant="default" className="bg-orange-500">{t("متوسطة")}</Badge>;
      case "low": return <Badge variant="secondary">{t("منخفضة")}</Badge>;
      default: return <Badge variant="outline">{t("عادية")}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div><h1 className="text-2xl font-bold text-primary">{t("المهام")}</h1></div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2 rtl:ml-2" /> {t("إضافة مهمة")}</Button>
      </div>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId === null ? t("إضافة مهمة") : t("تعديل المهمة")}</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-2 max-h-[75vh] overflow-y-auto">
            <div className="space-y-2"><Label htmlFor="task-title">{t("عنوان المهمة")}</Label><Input id="task-title" required maxLength={200} value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="task-description">{t("الوصف")}</Label><Textarea id="task-description" rows={3} maxLength={5000} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="task-assignee">{t("المسند إليه")}</Label><select id="task-assignee" className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={formData.assignedTo} onChange={e => setFormData({ ...formData, assignedTo: e.target.value })}><option value="">{t("غير مسندة")}</option>{users?.filter(u => u.isActive).map(u => <option key={u.id} value={u.id}>{u.name} — {u.email}</option>)}</select></div>
            <div className="space-y-2"><Label htmlFor="task-due">{t("تاريخ التسليم")}</Label><Input id="task-due" type="date" value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="task-priority">{t("الأولوية")}</Label><select id="task-priority" className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}><option value="low">{t("منخفضة")}</option><option value="medium">{t("متوسطة")}</option><option value="high">{t("عالية")}</option></select></div>
            {editingId !== null && <><div className="space-y-2"><Label htmlFor="task-status">{t("الحالة")}</Label><select id="task-status" className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}><option value="pending">{t("قيد الانتظار")}</option><option value="in_progress">{t("قيد التنفيذ")}</option><option value="completed">{t("مكتملة")}</option><option value="cancelled">{t("ملغاة")}</option></select></div><div className="space-y-2"><Label htmlFor="task-progress">{t("نسبة الإنجاز")}</Label><Input id="task-progress" type="number" min="0" max="100" step="1" value={formData.progress} onChange={e => setFormData({ ...formData, progress: e.target.value })} /></div></>}
            <DialogFooter><Button type="button" variant="outline" onClick={() => setIsOpen(false)}>{t("إلغاء")}</Button><Button type="submit" disabled={isSaving}>{isSaving ? t("جاري الحفظ...") : t("حفظ")}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Card><CardContent className="p-0">
        {isLoading ? <div className="p-6 space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div> : tasks?.length === 0 ? <div className="text-center py-16 text-muted-foreground">{t("لا توجد مهام مسجلة")}</div> : (
          <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>{t("المهمة")}</TableHead><TableHead>{t("المسند إليه")}</TableHead><TableHead>{t("تاريخ التسليم")}</TableHead><TableHead>{t("الأولوية")}</TableHead><TableHead>{t("نسبة الإنجاز")}</TableHead><TableHead>{t("الحالة")}</TableHead><TableHead className="text-left"></TableHead></TableRow></TableHeader><TableBody>
            {tasks?.map(task => <TableRow key={task.id}><TableCell className="font-medium max-w-[200px] truncate">{task.title}</TableCell><TableCell>{task.assigneeName || t("غير مسندة")}</TableCell><TableCell>{task.dueDate ? format(new Date(task.dueDate), "dd MMM yyyy", { locale: isEnglish ? undefined : ar }) : "-"}</TableCell><TableCell>{getPriorityBadge(task.priority)}</TableCell><TableCell><div className="flex items-center gap-2"><div className="w-full bg-secondary/20 rounded-full h-2"><div className="bg-primary h-2 rounded-full" style={{ width: `${task.progress || 0}%` }} /></div><span className="text-xs">{new Intl.NumberFormat("en", { useGrouping: false }).format(task.progress || 0)}%</span></div></TableCell><TableCell><Badge variant="outline">{t(task.status)}</Badge></TableCell><TableCell className="text-left"><Button size="sm" variant="ghost" onClick={() => openEdit(task)} aria-label={t("تعديل المهمة")}><Edit className="h-4 w-4" /></Button></TableCell></TableRow>)}
          </TableBody></Table></div>
        )}
      </CardContent></Card>
    </AdminLayout>
  );
}
