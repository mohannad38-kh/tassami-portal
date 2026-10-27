import { AdminLayout } from "@/components/layout/AdminLayout";
import { useState } from "react";
import { useListDepartments, useListJoinRequests, useUpdateJoinRequest } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Check, RefreshCw, X } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

export default function AdminJoinRequests() {
  const { t, isEnglish } = useLanguage();
  const [filter, setFilter] = useState("pending");
  const { data: requests, isLoading, refetch } = useListJoinRequests({
    status: filter === "all" ? undefined : filter,
  });
  const { data: departments } = useListDepartments();
  const updateRequest = useUpdateJoinRequest();
  const { toast } = useToast();

  const handleUpdateStatus = (id: number, status: string) => {
    updateRequest.mutate(
      { id, data: { status } },
      {
        onSuccess: (result) => {
          if (status === "approved" && !result.emailSent) {
            toast({
              title: t("تم قبول الطلب، لكن لم يُرسل البريد"),
              description:
                result.emailMessage ||
                t("تحقق من إعدادات البريد على الخادم، ثم أعد إرسال رابط القبول."),
              variant: "destructive",
            });
          } else {
            toast({
              title: status === "approved" ? t("تم قبول الطلب وإرسال رسالة الانتساب") : t("تم رفض الطلب"),
              description:
                status === "approved"
                  ? `${t("أُرسلت رسالة القبول ورابط نموذج الانتساب إلى")} ${result.email}.`
                  : t("تم تحديث حالة طلب الانضمام بنجاح."),
            });
          }
          refetch();
        }
      }
    );
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary">{t("طلبات الانضمام")}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t("طلبات نموذج الموقع تظهر هنا للمراجعة؛ وعند القبول يُنشأ حساب للمتقدم ويُرسل رابط إنشاء كلمة المرور ونموذج الانتساب.")}
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap gap-2">
            {[
              { value: "pending", label: t("بانتظار المراجعة") },
              { value: "approved", label: t("مقبولة") },
              { value: "rejected", label: t("مرفوضة") },
              { value: "all", label: t("الكل") },
            ].map((item) => (
              <Button
                key={item.value}
                size="sm"
                variant={filter === item.value ? "default" : "outline"}
                onClick={() => setFilter(item.value)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : requests?.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              {t("لا توجد طلبات في هذا القسم حالياً")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("تاريخ الطلب")}</TableHead>
                    <TableHead>{t("الاسم")}</TableHead>
                    <TableHead>{t("القسم")}</TableHead>
                    <TableHead>{t("الحالة")}</TableHead>
                    <TableHead>{t("التواصل")}</TableHead>
                    <TableHead>{t("الرسالة")}</TableHead>
                    <TableHead className="text-left">{t("الإجراء")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests?.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(req.createdAt), 'dd MMM yyyy', { locale: isEnglish ? undefined : ar })}
                      </TableCell>
                      <TableCell className="font-medium">{req.name}</TableCell>
                      <TableCell>
                        {t(departments?.find((department) => department.id === req.departmentId)?.name ?? "غير محدد")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={req.status === "approved" ? "default" : req.status === "rejected" ? "destructive" : "secondary"}>
                          {req.status === "approved" ? t("مقبول") : req.status === "rejected" ? t("مرفوض") : t("قيد المراجعة")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div dir="ltr" className="text-right">{req.email}</div>
                          {req.phone && <div dir="ltr" className="text-right text-muted-foreground">{req.phone}</div>}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={req.message || ""}>
                        {req.message || "-"}
                      </TableCell>
                      <TableCell className="text-left">
                        <div className="flex items-center justify-end gap-2">
                          {req.status === "pending" && <Button
                            size="sm" 
                            variant="outline" 
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleUpdateStatus(req.id, 'approved')}
                            disabled={updateRequest.isPending}
                          >
                            <Check className="h-4 w-4 mr-1 rtl:ml-1" /> {t("قبول")}
                          </Button>}
                          {req.status === "approved" && <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus(req.id, "approved")}
                            disabled={updateRequest.isPending}
                          >
                            <RefreshCw className="h-4 w-4 mr-1 rtl:ml-1" />
                            {t("إعادة إرسال الرابط")}
                          </Button>}
                          {req.status === "pending" && <Button
                            size="sm" 
                            variant="outline" 
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleUpdateStatus(req.id, 'rejected')}
                            disabled={updateRequest.isPending}
                          >
                            <X className="h-4 w-4 mr-1 rtl:ml-1" /> {t("رفض")}
                          </Button>}
                        </div>
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
