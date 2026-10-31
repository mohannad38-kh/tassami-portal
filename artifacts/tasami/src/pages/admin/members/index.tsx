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
import { Search, Eye, MoreHorizontal, UserCheck } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";

export default function AdminMembers() {
  const { t } = useLanguage(); 
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: rawMembers, isLoading, refetch } = useListMembers();
  const updateMember = useUpdateMember();

  // حماية صارمة لضمان أن البيانات دائماً مصفوفة لتجنب أي أخطاء وقت التشغيل
  const members = Array.isArray(rawMembers) 
    ? rawMembers 
    : ((rawMembers as any)?.items || []);

  const handleStatusChange = (id: number, newStatus: string) => {
    updateMember.mutate({ id, data: { status: newStatus } }, {
      onSuccess: () => { 
        toast({ 
          title: t("تم تحديث العضوية"), 
          description: newStatus === "active" ? t("تم تفعيل العضوية بنجاح") : t("تم إيقاف العضوية") 
        }); 
        void refetch(); 
      },
      onError: () => toast({ 
        title: t("تعذر تحديث العضوية"), 
        description: t("تحقق من صلاحياتك وحاول مرة أخرى"), 
        variant: "destructive" 
      })
    });
  };

  const filteredMembers = members.filter((m: any) =>
    (m.userName ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.membershipNumber ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <UserCheck className="h-6 w-6" /> {t("إدارة الأعضاء")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{t("عرض وإدارة قائمة المتطوعين في المبادرة")}</p>
        </div>
      </div>

      <Card className="shadow-sm border-border/50">
        <CardHeader className="pb-3 border-b mb-4">
          <div className="relative max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground rtl:right-auto rtl:left-3" />
            <Input 
              placeholder={t("بحث بالاسم أو رقم العضوية...")} 
              className="pl-3 pr-9 rtl:pr-3 rtl:pl-9" 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div className="rounded-md border-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("رقم العضوية")}</TableHead>
                    <TableHead>{t("الاسم")}</TableHead>
                    <TableHead>{t("القسم")}</TableHead>
                    <TableHead>{t("الساعات")}</TableHead>
                    <TableHead>{t("الحالة")}</TableHead>
                    <TableHead className="w-[100px] text-end"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member: any) => (
                    <TableRow key={member.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-mono">{member.membershipNumber || "-"}</TableCell>
                      <TableCell className="font-medium">{member.userName}</TableCell>
                      <TableCell>{member.departmentName ? t(member.departmentName) : "-"}</TableCell>
                      <TableCell>{new Intl.NumberFormat("en", { useGrouping: false }).format(member.totalVolunteerHours || 0)}</TableCell>
                      <TableCell>
                        <Badge variant={member.status === "active" ? "default" : member.status === "pending" ? "secondary" : "destructive"}>
                          {member.status === "active" ? t("نشط") : member.status === "pending" ? t("معلق") : t("مرفوض")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0" disabled={updateMember.isPending} aria-label={t("خيارات")}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/members/${member.id}`} className="cursor-pointer flex items-center">
                                <Eye className="h-4 w-4 ml-2 rtl:ml-0 rtl:mr-2" />{t("التفاصيل")}
                              </Link>
                            </DropdownMenuItem>
                            {member.status !== "active" && (
                              <DropdownMenuItem disabled={updateMember.isPending} onClick={() => handleStatusChange(member.id, "active")} className="text-green-600 cursor-pointer">
                                {t("تفعيل العضوية")}
                              </DropdownMenuItem>
                            )}
                            {member.status !== "rejected" && (
                              <DropdownMenuItem disabled={updateMember.isPending} onClick={() => handleStatusChange(member.id, "rejected")} className="text-destructive cursor-pointer">
                                {t("إيقاف العضوية")}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredMembers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                        {t("لا يوجد أعضاء مطابقين لبحثك")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}