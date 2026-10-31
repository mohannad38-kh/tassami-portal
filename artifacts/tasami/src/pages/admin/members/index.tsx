import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListMembers, useUpdateMember } from "@workspace/api-client-react";
import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Eye, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";

export default function AdminMembers() {
  const { t } = useLanguage(); const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const { data: members, isLoading, refetch } = useListMembers();
  const updateMember = useUpdateMember();
  const handleStatusChange = (id: number, newStatus: string) => {
    updateMember.mutate({ id, data: { status: newStatus } }, {
      onSuccess: () => { toast({ title: t("تم تحديث العضوية"), description: newStatus === "active" ? t("تم تفعيل العضوية بنجاح") : t("تم إيقاف العضوية") }); void refetch(); },
      onError: () => toast({ title: t("تعذر تحديث العضوية"), description: t("تحقق من صلاحياتك وحاول مرة أخرى"), variant: "destructive" })
    });
  };
  const filteredMembers = members?.filter(m =>
    (m.userName ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.membershipNumber ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  );
  return <AdminLayout>
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"><div><h1 className="text-2xl font-bold text-primary">{t("إدارة الأعضاء")}</h1><p className="text-muted-foreground text-sm mt-1">{t("عرض وإدارة قائمة المتطوعين في المبادرة")}</p></div></div>
    <Card><CardHeader className="pb-3 border-b mb-4"><div className="relative max-w-sm"><Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder={t("بحث بالاسم أو رقم العضوية...")} className="pl-3 pr-9" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} /></div></CardHeader>
      <CardContent>{isLoading?<div className="space-y-4">{[1,2,3,4,5].map(i=><Skeleton key={i} className="h-12 w-full"/>)}</div>:<div className="rounded-md border overflow-x-auto"><Table><TableHeader><TableRow><TableHead>{t("رقم العضوية")}</TableHead><TableHead>{t("الاسم")}</TableHead><TableHead>{t("القسم")}</TableHead><TableHead>{t("الساعات")}</TableHead><TableHead>{t("الحالة")}</TableHead><TableHead className="w-[100px]"></TableHead></TableRow></TableHeader><TableBody>{filteredMembers?.map(member=><TableRow key={member.id}><TableCell className="font-mono">{member.membershipNumber}</TableCell><TableCell className="font-medium">{member.userName}</TableCell><TableCell>{member.departmentName?t(member.departmentName):"-"}</TableCell><TableCell>{new Intl.NumberFormat("en",{useGrouping:false}).format(member.totalVolunteerHours||0)}</TableCell><TableCell><Badge variant={member.status==="active"?"default":member.status==="pending"?"secondary":"destructive"}>{member.status==="active"?t("نشط"):member.status==="pending"?t("معلق"):t("مرفوض")}</Badge></TableCell><TableCell><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0" disabled={updateMember.isPending}><MoreHorizontal className="h-4 w-4"/></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem asChild><Link href={`/admin/members/${member.id}`} className="cursor-pointer flex items-center"><Eye className="h-4 w-4 ml-2"/>{t("التفاصيل")}</Link></DropdownMenuItem>{member.status!=="active"&&<DropdownMenuItem disabled={updateMember.isPending} onClick={()=>handleStatusChange(member.id,"active")} className="text-green-600">{t("تفعيل العضوية")}</DropdownMenuItem>}{member.status!=="rejected"&&<DropdownMenuItem disabled={updateMember.isPending} onClick={()=>handleStatusChange(member.id,"rejected")} className="text-destructive">{t("إيقاف العضوية")}</DropdownMenuItem>}</DropdownMenuContent></DropdownMenu></TableCell></TableRow>)}{filteredMembers?.length===0&&<TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{t("لا يوجد أعضاء مطابقين لبحثك")}</TableCell></TableRow>}</TableBody></Table></div>}</CardContent>
    </Card>
  </AdminLayout>;
}