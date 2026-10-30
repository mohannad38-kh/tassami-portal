import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListVolunteerHours } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useLanguage } from "@/hooks/use-language";

export default function AdminVolunteerHours() {
  const { t, isEnglish } = useLanguage();
  const { data: hours, isLoading } = useListVolunteerHours();

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary">{t("ساعات التطوع")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("سجل الساعات التطوعية لجميع الأعضاء")}</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : hours?.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              {t("لا توجد ساعات تطوعية مسجلة")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("التاريخ")}</TableHead>
                    <TableHead>{t("العضو")}</TableHead>
                    <TableHead>{t("الفعالية")}</TableHead>
                    <TableHead>{t("الوصف")}</TableHead>
                    <TableHead className="text-left">{t("الساعات")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hours?.map((hour) => (
                    <TableRow key={hour.id}>
                      <TableCell>
                        {format(new Date(hour.activityDate), 'dd MMM yyyy', { locale: isEnglish ? undefined : ar })}
                      </TableCell>
                      <TableCell className="font-medium">{hour.memberName}</TableCell>
                      <TableCell>{hour.eventTitle || "-"}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={hour.description || ''}>
                        {hour.description || "-"}
                      </TableCell>
                      <TableCell className="text-left font-bold text-primary">{new Intl.NumberFormat("en", { useGrouping: false }).format(hour.hours)}</TableCell>
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
