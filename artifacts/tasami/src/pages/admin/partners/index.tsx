import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListPartners, useCreatePartner, useUpdatePartner } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Link as LinkIcon } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function AdminPartners() {
  const { t } = useLanguage(); const { toast } = useToast();
  const { data: partners, isLoading, refetch } = useListPartners();
  const createPartner = useCreatePartner(); const updatePartner = useUpdatePartner();
  const [open, setOpen] = useState(false); const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState(""); const [partnerType, setPartnerType] = useState(""); const [website, setWebsite] = useState(""); const [logoUrl, setLogoUrl] = useState("");
  const start = (partner?: NonNullable<typeof partners>[number]) => { setEditingId(partner?.id ?? null); setName(partner?.name ?? ""); setPartnerType(partner?.partnerType ?? ""); setWebsite(partner?.website ?? ""); setLogoUrl(partner?.logoUrl ?? ""); setOpen(true); };
  const save = (e: React.FormEvent) => { e.preventDefault(); if (!name.trim()) return; const data = { name: name.trim(), ...(partnerType.trim() ? { partnerType: partnerType.trim() } : {}), ...(website.trim() ? { website: website.trim() } : {}), ...(logoUrl.trim() ? { logoUrl: logoUrl.trim() } : {}) }; const options = { onSuccess: () => { toast({ title: t("تم بنجاح"), description: t("تم حفظ بيانات الشريك") }); setOpen(false); refetch(); }, onError: () => toast({ title: t("تعذر الحفظ"), description: t("تحقق من البيانات وحاول مجدداً"), variant: "destructive" as const }) }; if (editingId === null) createPartner.mutate({ data }, options); else updatePartner.mutate({ id: editingId, data }, options); };
  const saving = createPartner.isPending || updatePartner.isPending;
  return <AdminLayout>
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"><h1 className="text-2xl font-bold text-primary">{t("الشركاء")}</h1><Button onClick={() => start()}><Plus className="h-4 w-4 mr-2 rtl:ml-2" /> {t("إضافة شريك")}</Button></div>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{editingId === null ? t("إضافة شريك") : t("تعديل الشريك")}</DialogTitle></DialogHeader><form onSubmit={save} className="space-y-4 pt-2"><div className="space-y-2"><Label htmlFor="partner-name">{t("اسم الشريك")}</Label><Input id="partner-name" required maxLength={160} value={name} onChange={e => setName(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="partner-type">{t("نوع الشراكة")}</Label><Input id="partner-type" maxLength={100} value={partnerType} onChange={e => setPartnerType(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="partner-site">{t("رابط الموقع")}</Label><Input id="partner-site" type="url" value={website} onChange={e => setWebsite(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="partner-logo">{t("رابط الشعار")}</Label><Input id="partner-logo" type="url" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} /></div><DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("إلغاء")}</Button><Button type="submit" disabled={saving}>{saving ? t("جاري الحفظ...") : t("حفظ")}</Button></DialogFooter></form></DialogContent></Dialog>
    <Card><CardContent className="p-0">{isLoading ? <div className="p-6 space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div> : partners?.length === 0 ? <div className="text-center py-16 text-muted-foreground">{t("لا يوجد شركاء مسجلين")}</div> : <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>{t("الاسم")}</TableHead><TableHead>{t("النوع")}</TableHead><TableHead>{t("الموقع")}</TableHead><TableHead className="text-left"></TableHead></TableRow></TableHeader><TableBody>{partners?.map(partner => <TableRow key={partner.id}><TableCell className="font-medium flex items-center gap-3">{partner.logoUrl ? <img src={partner.logoUrl} alt={partner.name} className="h-8 w-8 object-contain" /> : <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center text-xs">{t("شريك")}</div>}{partner.name}</TableCell><TableCell>{partner.partnerType || "-"}</TableCell><TableCell>{partner.website ? <a href={partner.website} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1"><LinkIcon className="h-3 w-3" /> {t("زيارة الموقع")}</a> : "-"}</TableCell><TableCell className="text-left"><Button size="sm" variant="ghost" onClick={() => start(partner)} aria-label={t("تعديل الشريك")}><Edit className="h-4 w-4" /></Button></TableCell></TableRow>)}</TableBody></Table></div>}</CardContent></Card>
  </AdminLayout>;
}