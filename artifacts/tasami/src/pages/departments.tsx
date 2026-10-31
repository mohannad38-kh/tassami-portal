import { PublicLayout } from "@/components/layout/PublicLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, LayoutGrid } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useDepartments } from "@/hooks/use-departments";

const departmentLeaders = [
  { department: "القسم الإعلامي", name: "سرى زكريا عديلات" },
  { department: "القسم الأكاديمي", name: "هبة جبريل البشاتوة" },
  { department: "قسم الورشات", name: "حسن محمود لبابنة" },
  { department: "قسم التصميم", name: "روبي هيثم الحسن" },
  { department: "قسم تكنولوجيا المعلومات", name: "مهند عماد خلوف" },
];

function normalizeDepartmentName(name: string): string {
  return name
    .trim()
    .replace(/^القسم\s*|^قسم\s*/, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/\s+/g, " ");
}

export default function Departments() {
  const { t, isEnglish } = useLanguage();
  const { data: rawDepartments, isLoading } = useDepartments();

  const departments = Array.isArray(rawDepartments) ? rawDepartments : ((rawDepartments as any)?.items || []);

  const knownDepartmentKeys = new Set(
    departments.map((department: any) =>
      normalizeDepartmentName(department.name || ""),
    ),
  );

  const listedDepartments = [
    ...departments.map((department: any) => {
      const leader = departmentLeaders.find(
        (item) =>
          normalizeDepartmentName(item.department) ===
          normalizeDepartmentName(department.name || ""),
      );
      return {
        ...department,
        headName: leader?.name ?? department.headName,
      };
    }),
    ...departmentLeaders
      .filter(
        (leader) =>
          !knownDepartmentKeys.has(normalizeDepartmentName(leader.department)),
      )
      .map((leader) => ({
        id: `tasami-${normalizeDepartmentName(leader.department)}`,
        name: leader.department,
        description: "قسم من أقسام مبادرة تسامي التطوعية.",
        memberCount: 0,
        headName: leader.name,
      })),
  ];

  return (
    <PublicLayout>
      <div className="container py-12 px-4 md:px-8 mx-auto max-w-6xl">
        <div className="flex items-center gap-3 mb-2 border-b pb-4">
          <LayoutGrid className="h-8 w-8 text-secondary" />
          <h1 className="text-3xl font-bold text-primary">{t("الأقسام")}</h1>
        </div>
        <p className="text-muted-foreground mb-10 mt-2 text-lg">
          {t("تعرف على الهيكل التنظيمي لمبادرة تسامي والأقسام الفاعلة فيها ورؤسائها.")}
        </p>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="border-border/50">
                <CardHeader>
                  <Skeleton className="h-6 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-28" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : listedDepartments.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 rounded-2xl border border-border/50">
            <LayoutGrid className="h-12 w-12 mx-auto mb-3 opacity-20 text-muted-foreground" />
            <h3 className="text-xl font-medium text-foreground">{t("لا توجد أقسام مسجلة حالياً")}</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listedDepartments.map((dept: any) => (
              <Card key={dept.id} className="hover:shadow-md transition-all border-primary/10 flex flex-col justify-between">
                <CardHeader>
                  <CardTitle className="text-xl text-primary">{t(dept.name)}</CardTitle>
                  <CardDescription className="text-base mt-2 line-clamp-3">
                    {dept.description ? t(dept.description) : t("لا يوجد وصف متاح لهذا القسم حالياً.")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  {typeof dept.memberCount === "number" && dept.memberCount > 0 && (
                    <div className="flex items-center text-muted-foreground text-sm mb-3">
                      <Users className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0 text-secondary" />
                      <span>{new Intl.NumberFormat("en", { useGrouping: false }).format(dept.memberCount)} {t("عضو مسجل")}</span>
                    </div>
                  )}
                  {dept.headName && (
                    <div className="text-sm border-t pt-3 flex items-center justify-between">
                      <span className="text-muted-foreground">{t("رئيس القسم:")}</span> 
                      <span className="font-bold text-foreground">{dept.headName}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}