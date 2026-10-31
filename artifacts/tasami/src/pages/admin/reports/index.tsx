import { AdminLayout } from "@/components/layout/AdminLayout";
import { useGetReports } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { useLanguage } from "@/hooks/use-language";
import { BarChart3 } from "lucide-react";

export default function AdminReports() {
  const { t } = useLanguage();
  const { data: reports, isLoading } = useGetReports();

  const COLORS = ["#702632", "#b18b49", "#9a5964", "#c7a86a", "#82515a", "#d9c7a2"];

  // استخراج البيانات مع حماية صارمة ضد أي أخطاء أو قيم فارغة
  const membersByDepartment = Array.isArray(reports?.membersByDepartment) 
    ? reports.membersByDepartment 
    : [];

  const eventsByMonth = Array.isArray(reports?.eventsByMonth) 
    ? reports.eventsByMonth 
    : [];

  const volunteerHoursByMember = Array.isArray(reports?.volunteerHoursByMember) 
    ? reports.volunteerHoursByMember 
    : [];

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
          <BarChart3 className="h-6 w-6" /> {t("التقارير والإحصائيات")}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">{t("تحليل إحصائي شامل لأداء الأقسام، الفعاليات، ونشاط المتطوعين")}</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-xl md:col-span-2" />
        </div>
      ) : reports ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <Card className="col-span-1 shadow-sm border-border/50">
            <CardHeader>
              <CardTitle>{t("الأعضاء حسب الأقسام")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                {membersByDepartment.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    {t("لا توجد بيانات كافية")}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={membersByDepartment.map((item: any) => ({
                          ...item,
                          departmentName: t(item.departmentName),
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#702632"
                        dataKey="count"
                        nameKey="departmentName"
                        label={({ name, percent }) => `${String(name)} ${(Number(percent || 0) * 100).toFixed(0)}%`}
                      >
                        {membersByDepartment.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} ${t("عضو")}`, t("العدد")]} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1 shadow-sm border-border/50">
            <CardHeader>
              <CardTitle>{t("الفعاليات حسب الأشهر")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                {eventsByMonth.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    {t("لا توجد بيانات كافية")}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={eventsByMonth}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" />
                      <YAxis allowDecimals={false} />
                      <Tooltip formatter={(value) => [`${value} ${t("فعالية")}`, t("العدد")]} />
                      <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1 md:col-span-2 shadow-sm border-border/50">
            <CardHeader>
              <CardTitle>{t("أكثر المتطوعين تفاعلاً")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                {volunteerHoursByMember.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    {t("لا توجد بيانات كافية")}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={volunteerHoursByMember.slice(0, 10)} // Top 10
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" />
                      <YAxis dataKey="memberName" type="category" width={100} />
                      <Tooltip formatter={(value) => [`${value} ${t("ساعة")}`, t("الساعات التطوعية")]} />
                      <Bar dataKey="totalHours" fill="var(--color-secondary)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

        </div>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          {t("لا تتوفر بيانات للتقارير حالياً")}
        </div>
      )}
    </AdminLayout>
  );
}