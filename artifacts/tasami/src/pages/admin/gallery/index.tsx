import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListGallery, useCreateGalleryItem, useDeleteGalleryItem, useListEvents } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function AdminGallery() {
  const { t } = useLanguage(); const { toast } = useToast();
  const { data: gallery, isLoading, refetch } = useListGallery();
  const { data: events } = useListEvents();
  const createItem = useCreateGalleryItem(); const deleteItem = useDeleteGalleryItem();
  const [open, setOpen] = useState(false); const [title, setTitle] = useState(""); const [imageUrl, setImageUrl] = useState(""); const [eventId, setEventId] = useState("");
  const save = (e: React.FormEvent) => { e.preventDefault(); if (!imageUrl.trim()) return; const data = { imageUrl: imageUrl.trim(), ...(title.trim() ? { title: title.trim() } : {}), ...(eventId ? { eventId: Number(eventId) } : {}) }; createItem.mutate({ data }, { onSuccess: () => { toast({ title: t("تم بنجاح"), description: t("تمت إضافة الصورة للمعرض") }); setOpen(false); setTitle(""); setImageUrl(""); setEventId(""); refetch(); }, onError: () => toast({ title: t("تعذر الحفظ"), description: t("تحقق من رابط الصورة وحاول مجدداً"), variant: "destructive" }) }); };
  const remove = (id: number) => { if (!window.confirm(t("هل أنت متأكد من حذف الصورة؟"))) return; deleteItem.mutate({ id }, { onSuccess: () => { toast({ title: t("تم الحذف") }); refetch(); }, onError: () => toast({ title: t("تعذر الحذف"), variant: "destructive" }) }); };
  return <AdminLayout>
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"><h1 className="text-2xl font-bold text-primary">{t("معرض الصور")}</h1><Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2 rtl:ml-2" /> {t("إضافة صورة")}</Button></div>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{t("إضافة صورة للمعرض")}</DialogTitle></DialogHeader><form onSubmit={save} className="space-y-4 pt-2"><div className="space-y-2"><Label htmlFor="gallery-title">{t("عنوان الصورة")}</Label><Input id="gallery-title" maxLength={160} value={title} onChange={e => setTitle(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="gallery-url">{t("رابط الصورة")}</Label><Input id="gallery-url" type="url" required value={imageUrl} onChange={e => setImageUrl(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="gallery-event">{t("الفعالية المرتبطة (اختياري)")}</Label><select id="gallery-event" className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={eventId} onChange={e => setEventId(e.target.value)}><option value="">{t("بدون فعالية")}</option>{events?.map(event => <option key={event.id} value={event.id}>{event.title}</option>)}</select></div><DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("إلغاء")}</Button><Button type="submit" disabled={createItem.isPending}>{createItem.isPending ? t("جاري الحفظ...") : t("حفظ")}</Button></DialogFooter></form></DialogContent></Dialog>
    {isLoading ? <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">{[1,2,3,4,5,6].map(i => <Skeleton key={i} className="aspect-square rounded-xl w-full" />)}</div> : gallery?.length === 0 ? <div className="text-center py-16 text-muted-foreground bg-muted/20 border border-dashed rounded-xl">{t("لا توجد صور في المعرض")}</div> : <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">{gallery?.map(item => <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden group"><img src={item.imageUrl} alt={item.title || t("صورة")} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3"><div className="text-white text-sm">{item.title && <p className="font-medium line-clamp-1">{item.title}</p>}{item.eventTitle && <p className="text-white/80 line-clamp-1">{item.eventTitle}</p>}</div><div className="flex justify-end"><Button size="icon" variant="destructive" disabled={deleteItem.isPending} onClick={() => remove(item.id)} className="h-8 w-8 bg-destructive/80 hover:bg-destructive" aria-label={t("حذف الصورة")}><Trash2 className="h-4 w-4" /></Button></div></div></div>)}</div>}
  </AdminLayout>;
}