import { PortalLayout } from "@/components/layout/PortalLayout";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useGetVolunteerSummary, useListEvents, useListTasks, getListTasksQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Calendar, CheckSquare, Award, LayoutDashboard } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

export default function PortalIndex() {
  const { user } = useAuth();
  const { t, isEnglish } = useLanguage();

  const { data: rawSummaries, isLoading: isLoadingSummary } = useGetVolunteerSummary();
  const { data: rawEvents, isLoading: isLoadingEvents } = useListEvents({ status: "upcoming" });
  const { data: rawTasks, isLoading: isLoadingTasks } = useListTasks(
    { assignedTo: user?.id, status: "pending" },
    { query: { enabled: !!user?.id, queryKey: getListTasksQueryKey({ assignedTo: user?.id, status: "pending" }) } }
  );

  // حماية صارمة لضمان أن البيانات دائماً مصفوفة لتجنب أي أخطاء وقت التشغيل (TypeError)
  const summaries = Array.isArray(rawSummaries) ? rawSummaries : ((rawSummaries as any)?.items || []);
  const events = Array.isArray(rawEvents) ? rawEvents : ((rawEvents as any)?.items || []);
  const tasks = Array.isArray(rawTasks) ? rawTasks : ((rawTasks as any)?.items || []);

  const totalHours = summaries.reduce((sum: number, s: any) => sum + (s.totalHours || 0), 0);
  const totalEvents = summaries.reduce((sum: number, s: any) => sum + (s.eventCount || 0), 0);

  return (
    <PortalLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary mb-2 flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6" /> {t("أهلاً بك،")} {user?.name || t("المتطوع")}
        </h1>
        <p className="text-muted-foreground">{t("تابع إنجازاتك وساعاتك ومهامك التطوعية من لوحة التحكم الخاصة بك.")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="shadow-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("إجمالي ساعات التطوع")}</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold font-mono">
                {new Intl.NumberFormat("en", { useGrouping: false }).format(totalHours)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("الفعاليات المشارك بها")}</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold font-mono">
                {new Intl.NumberFormat("en", { useGrouping: false }).format(totalEvents)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("المهام قيد التنفيذ")}</CardTitle>
            <CheckSquare className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoadingTasks ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold font-mono">
                {new Intl.NumberFormat("en", { useGrouping: false }).format(tasks.length)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("الشهادات")}</CardTitle>
            <Award className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-muted-foreground font-mono">-</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle>{t("الفعاليات القادمة")}</CardTitle>
            <CardDescription>{t("أبرز الفعاليات المتاحة للتسجيل قريباً")}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingEvents ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : events.length === 0 ? (
              <p className="text-muted-foreground text-center py-6">{t("لا توجد فعاليات قادمة حالياً.")}</p>
            ) : (
              <div className="space-y-4">
                {events.slice(0, 3).map((event: any) => (
                  <div key={event.id} className="flex justify-between items-center p-3 border rounded-xl hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("تاريخ:")} {event.eventDate ? new Date(event.eventDate).toLocaleDateString(isEnglish ? "en" : "ar-JO-u-nu-latn") : "-"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle>{t("المهام المطلوبة")}</CardTitle>
            <CardDescription>{t("المهام المسندة إليك لإنجازها")}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingTasks ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : tasks.length === 0 ? (
              <p className="text-muted-foreground text-center py-6">{t("ليس لديك مهام قيد التنفيذ.")}</p>
            ) : (
              <div className="space-y-4">
                {tasks.map((task: any) => (
                  <div key={task.id} className="flex justify-between items-center p-3 border rounded-xl hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("تاريخ التسليم:")} {task.dueDate ? new Date(task.dueDate).toLocaleDateString(isEnglish ? "en" : "ar-JO-u-nu-latn") : t("غير محدد")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}