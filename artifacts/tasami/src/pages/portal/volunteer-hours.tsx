import { PortalLayout } from "@/components/layout/PortalLayout";
import { useAuth } from "@/hooks/use-auth";
import { useListVolunteerHours, useGetVolunteerSummary, getListVolunteerHoursQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useLanguage } from "@/hooks/use-language";

export default function PortalVolunteerHours() {
  const { user } = useAuth();
  const { t, isEnglish } = useLanguage();
  const memberId = user?.id || 0;

  const { data: hours, isLoading: isLoadingHours } = useListVolunteerHours(
    { memberId },
    { query: { enabled: !!memberId, queryKey: getListVolunteerHoursQueryKey({ memberId }) } }
  );

  const { data: summaries, isLoading: isLoadingSummary } = useGetVolunteerSummary();

  const totalHours = summaries?.reduce((sum, s) => sum + (s.totalHours || 0), 0) ?? 0;
  const totalEvents = summaries?.reduce((sum, s) => sum + (s.eventCount || 0), 0) ?? 0;

  return (
    <PortalLayout>
      <h1 className="text-2xl font-bold text-primary mb-6">{t("ساعات التطوع")}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="bg-primary text-primary-foreground border-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium text-primary-foreground/80">{t("إجمالي الساعات")}</CardTitle>
            <Clock className="h-5 w-5 opacity-80" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Skeleton className="h-10 w-24 bg-primary-foreground/20" />
            ) : (
              <div className="text-4xl font-bold">{new Intl.NumberFormat("en", { useGrouping: false }).format(totalHours)} <span className="text-xl font-normal opacity-80">{t("ساعة")}</span></div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-secondary text-secondary-foreground border-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium text-secondary-foreground/80">{t("الفعاليات المشارك بها")}</CardTitle>
            <CalendarIcon className="h-5 w-5 opacity-80" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Skeleton className="h-10 w-24 bg-secondary-foreground/20" />
            ) : (
              <div className="text-4xl font-bold">{new Intl.NumberFormat("en", { useGrouping: false }).format(totalEvents)} <span className="text-xl font-normal opacity-80">{t("فعالية")}</span></div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("سجل الساعات التطوعية")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingHours ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : hours?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {t("لا يوجد سجل ساعات تطوعية حتى الآن.")}
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("التاريخ")}</TableHead>
                    <TableHead>{t("الفعالية / النشاط")}</TableHead>
                    <TableHead>{t("الوصف")}</TableHead>
                    <TableHead className="text-left">{t("الساعات")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hours?.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        {format(new Date(record.activityDate), 'dd MMMM yyyy', { locale: isEnglish ? undefined : ar })}
                      </TableCell>
                      <TableCell className="font-medium">{record.eventTitle || "-"}</TableCell>
                      <TableCell className="text-muted-foreground">{record.description || "-"}</TableCell>
                      <TableCell className="text-left font-bold text-primary">{new Intl.NumberFormat("en", { useGrouping: false }).format(record.hours)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </PortalLayout>
  );
}
