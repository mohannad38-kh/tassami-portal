import { AdminLayout } from "@/components/layout/DashboardLayout";
import { useGetDashboardStats, useGetRecentActivity } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  Calendar, 
  GraduationCap, 
  LayoutGrid, 
  UserPlus, 
  Clock, 
  CheckSquare 
} from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

export default function AdminIndex() {
  const { t, isEnglish } = useLanguage();
  const { data: stats, isLoading: isLoadingStats } = useGetDashboardStats();
  const { data: activities, isLoading: isLoadingActivity } = useGetRecentActivity();

  const statCards = [
    { title: t("إجمالي الأعضاء"), value: stats?.totalMembers, icon: Users, color: "text-blue-600" },
    { title: t("ساعات التطوع"), value: stats?.totalVolunteerHours, icon: Clock, color: "text-green-600" },
    { title: t("طلبات معلقة"), value: stats?.pendingRequests, icon: UserPlus, color: "text-orange-600" },
    { title: t("إجمالي الفعاليات"), value: stats?.totalEvents, icon: Calendar, color: "text-primary" },
    { title: t("إجمالي الورش"), value: stats?.totalWorkshops, icon: GraduationCap, color: "text-secondary" },
    { title: t("الأقسام"), value: stats?.totalDepartments, icon: LayoutGrid, color: "text-purple-600" },
    { title: t("مهام نشطة"), value: stats?.activeTasks, icon: CheckSquare, color: "text-destructive" },
  ];

  const activitiesList = Array.isArray(activities) ? activities : [];

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary mb-2">{t("نظرة عامة")}</h1>
        <p className="text-muted-foreground">{t("ملخص لآخر الإحصائيات والأرقام في المبادرة.")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, idx) => (
          <Card key={idx} className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold">{new Intl.NumberFormat(isEnglish ? "en" : "ar-JO-u-nu-latn", { useGrouping: false }).format(stat.value || 0)}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="col-span-1 shadow-sm border-border/50">
        <CardHeader>
          <CardTitle>{t("أحدث النشاطات")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingActivity ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center space-x-4 space-x-reverse">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-3 w-[100px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : activitiesList.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">{t("لا يوجد نشاطات مسجلة حديثاً.")}</p>
          ) : (
            <div className="space-y-6">
              {activitiesList.map((activity) => (
                <div key={activity.id} className="flex items-start">
                  <div className="bg-primary/10 p-2 rounded-full mr-4 rtl:ml-4 rtl:mr-0 shrink-0">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{activity.description}</p>
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                      <span className="font-semibold ml-2">{activity.actorName || t("النظام")}</span>
                      <span>•</span>
                      <span className="mr-2">{new Date(activity.createdAt).toLocaleDateString(isEnglish ? "en" : "ar-JO-u-nu-latn", { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}