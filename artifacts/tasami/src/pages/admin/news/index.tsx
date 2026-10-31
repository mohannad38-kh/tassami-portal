import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListNews, useListAnnouncements, useCreateNews, useUpdateNews, useCreateAnnouncement, useUpdateAnnouncement } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

export default function AdminNews() {
  const { t, isEnglish } = useLanguage();
  const { data: news, isLoading: isLoadingNews, refetch: refetchNews } = useListNews();
  const { data: announcements, isLoading: isLoadingAnnouncements, refetch: refetchAnnouncements } = useListAnnouncements();
  const createNews = useCreateNews(); const updateNews = useUpdateNews();
  const createAnnouncement = useCreateAnnouncement(); const updateAnnouncement = useUpdateAnnouncement();
  const { toast } = useToast();
  const [kind, setKind] = useState<"news" | "announcement">("news");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(""); const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState(""); const [targetRole, setTargetRole] = useState("");
  const startCreate = (nextKind: "news" | "announcement") => { setKind(nextKind); setEditingId(null); setTitle(""); setBody(""); setImageUrl(""); setTargetRole(""); setOpen(true); };
  const startNewsEdit = (item: NonNullable<typeof news>[number]) => { setKind("news"); setEditingId(item.id); setTitle(item.title); setBody(item.body); setImageUrl(item.imageUrl ?? ""); setTargetRole(""); setOpen(true); };
  const startAnnouncementEdit = (item: NonNullable<typeof announcements>[number]) => { setKind("announcement"); setEditingId(item.id); setTitle(item.title); setBody(item.body); setImageUrl(""); setTargetRole(item.targetRole ?? ""); setOpen(true); };
  const save = (e: React.FormEvent) => {
    e.preventDefault(); if (!title.trim() || !body.trim()) { toast({ title: t("بيانات غير صحيحة"), description: t("أدخل العنوان والمحتوى"), variant: "destructive" }); return; }
    const options = { onSuccess: () => { toast({ title: t("تم بنجاح"), description: t("تم حفظ المحتوى") }); setOpen(false); if (kind === "news") refetchNews(); else refetchAnnouncements(); }, onError: () => toast({ title: t("تعذر الحفظ"), description: t("حدث خطأ أثناء الحفظ"), variant: "destructive" as const }) };
    if (kind === "news") { const data = { title: title.trim(), body: body.trim(), ...(imageUrl.trim() ? { imageUrl: imageUrl.trim() } : {}) }; if (editingId === null) createNews.mutate({ data }, options); else updateNews.mutate({ id: editingId, data }, options); }
    else { const data = { title: title.trim(), body: body.trim(), ...(targetRole ? { targetRole } : {}) }; if (editingId === null) createAnnouncement.mutate({ data }, options); else updateAnnouncement.mutate({ id: editingId, data }, options); }
  };
  const saving = createNews.isPending || updateNews.isPending || createAnnouncement.isPending || updateAnnouncement.isPending;
  return <AdminLayout>
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"><h1 className="text-2xl font-bold text-primary">{t("الأخبار والإعلانات")}</h1><Button onClick={() => startCreate(kind)}><Plus className="h-4 w-4 mr-2 rtl:ml-2" /> {t("إضافة خبر / إعلان")}</Button></div>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{editingId === null ? t(kind === "news" ? "إضافة خبر" : "إضافة إعلان") : t("تعديل المحتوى")}</DialogTitle></DialogHeader>
      <form onSubmit={save} className="space-y-4 pt-2 max-h-[75vh] overflow-y-auto">
        <div className="space-y-2"><Label htmlFor="content-kind">{t("نوع المحتوى")}</Label><select id="content-kind" disabled={editingId !== null} className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={kind} onChange={e => { setKind(e.target.value as "news" | "announcement"); setImageUrl(""); setTargetRole(""); }}><option value="news">{t("خبر")}</option><option value="announcement">{t("إعلان داخلي")}</option></select></div>
        <div className="space-y-2"><Label htmlFor="content-title">{t("العنوان")}</Label><Input id="content-title" required maxLength={200} value={title} onChange={e => setTitle(e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="content-body">{t("المحتوى")}</Label><Textarea id="content-body" required rows={6} maxLength={20000} value={body} onChange={e => setBody(e.target.value)} /></div>
        {kind === "news" ? <div className="space-y-2"><Label htmlFor="content-image">{t("رابط الصورة")}</Label><Input id="content-image" type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} /></div> : <div className="space-y-2"><Label htmlFor="content-role">{t("الفئة المستهدفة")}</Label><select id="content-role" className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={targetRole} onChange={e => setTargetRole(e.target.value)}><option value="">{t("الجميع")}</option><option value="member">{t("الأعضاء")}</option><option value="secretary">{t("السكرتارية")}</option><option value="admin">{t("الإدارة")}</option></select></div>}
        <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("إلغاء")}</Button><Button type="submit" disabled={saving}>{saving ? t("جاري الحفظ...") : t("حفظ")}</Button></DialogFooter>
      </form>
    </DialogContent></Dialog>
    <Tabs defaultValue="news" className="w-full" onValueChange={v => setKind(v === "news" ? "news" : "announcement")}><TabsList className="mb-4"><TabsTrigger value="news">{t("الأخبار المنشورة")}</TabsTrigger><TabsTrigger value="announcements">{t("الإعلانات الداخلية")}</TabsTrigger></TabsList>
      <TabsContent value="news"><Card><CardContent className="p-0">{isLoadingNews ? <div className="p-6 space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div> : news?.length === 0 ? <div className="text-center py-16 text-muted-foreground">{t("لا توجد أخبار منشورة")}</div> : <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>{t("عنوان")}</TableHead><TableHead>{t("تاريخ النشر")}</TableHead><TableHead>{t("الكاتب")}</TableHead><TableHead className="text-left"></TableHead></TableRow></TableHeader><TableBody>{news?.map(item => <TableRow key={item.id}><TableCell className="font-medium max-w-[300px] truncate">{item.title}</TableCell><TableCell>{item.publishedAt ? format(new Date(item.publishedAt), "dd MMM yyyy", { locale: isEnglish ? undefined : ar }) : "-"}</TableCell><TableCell>{item.authorName || "-"}</TableCell><TableCell className="text-left"><Button size="sm" variant="ghost" onClick={() => startNewsEdit(item)} aria-label={t("تعديل الخبر")}><Edit className="h-4 w-4" /></Button></TableCell></TableRow>)}</TableBody></Table></div>}</CardContent></Card></TabsContent>
      <TabsContent value="announcements"><Card><CardContent className="p-0">{isLoadingAnnouncements ? <div className="p-6 space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div> : announcements?.length === 0 ? <div className="text-center py-16 text-muted-foreground">{t("لا توجد إعلانات داخلية")}</div> : <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>{t("عنوان")}</TableHead><TableHead>{t("تاريخ الإنشاء")}</TableHead><TableHead>{t("الفئة المستهدفة")}</TableHead><TableHead className="text-left"></TableHead></TableRow></TableHeader><TableBody>{announcements?.map(item => <TableRow key={item.id}><TableCell className="font-medium max-w-[300px] truncate">{item.title}</TableCell><TableCell>{format(new Date(item.createdAt), "dd MMM yyyy", { locale: isEnglish ? undefined : ar })}</TableCell><TableCell>{item.targetRole || t("الجميع")}</TableCell><TableCell className="text-left"><Button size="sm" variant="ghost" onClick={() => startAnnouncementEdit(item)} aria-label={t("تعديل الإعلان")}><Edit className="h-4 w-4" /></Button></TableCell></TableRow>)}</TableBody></Table></div>}</CardContent></Card></TabsContent>
    </Tabs>
  </AdminLayout>;
}
