import { AdminLayout } from "@/components/layout/DashboardLayout";
import { useListWorkshops } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Users, Calendar as CalendarIcon, GraduationCap } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useLanguage } from "@/hooks/use-language";

export default function AdminWorkshops() {
  const { t, isEnglish } = useLanguage();
  const { data: workshops, isLoading } = useListWorkshops();

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">{t("إدارة الورش والدورات")}</h1>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2 rtl:ml-2" /> {t("إضافة ورشة")}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : workshops?.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              {t("لا توجد ورش مسجلة")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("عنوان الورشة")}</TableHead>
                    <TableHead>{t("المدرب")}</TableHead>
                    <TableHead>{t("التاريخ")}</TableHead>
                    <TableHead>{t("المسجلين")}</TableHead>
                    <TableHead>{t("الحالة")}</TableHead>
                    <TableHead className="text-left"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workshops?.map((ws) => (
                    <TableRow key={ws.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">{ws.title}</TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <GraduationCap className="h-3 w-3 mr-1 rtl:ml-1 text-muted-foreground" />
                          {ws.trainerName || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <CalendarIcon className="h-3 w-3 mr-1 rtl:ml-1 text-muted-foreground" />
                          {format(new Date(ws.workshopDate), 'dd MMM yyyy', { locale: isEnglish ? undefined : ar })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <Users className="h-3 w-3 mr-1 rtl:ml-1 text-muted-foreground" />
                          {new Intl.NumberFormat("en", { useGrouping: false }).format(ws.registeredCount || 0)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{t(ws.status)}</Badge>
                      </TableCell>
                      <TableCell className="text-left">
                        <Button size="sm" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
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
