import { PublicLayout } from "@/components/layout/PublicLayout";
import { useListWorkshops } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarIcon, MapPinIcon, UsersIcon, GraduationCap } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useLanguage } from "@/hooks/use-language";

export default function Workshops() {
  const { t, isEnglish } = useLanguage();
  const { data: workshops, isLoading } = useListWorkshops();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming":
        return <Badge variant="default" className="bg-secondary text-secondary-foreground">{t("متاحة للتسجيل")}</Badge>;
      case "ongoing":
        return <Badge variant="default" className="bg-green-600">{t("مستمرة")}</Badge>;
      case "completed":
        return <Badge variant="secondary">{t("مكتملة")}</Badge>;
      case "cancelled":
        return <Badge variant="destructive">{t("ملغاة")}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <PublicLayout>
      <div className="container py-12 px-4 md:px-8 mx-auto">
        <h1 className="text-3xl font-bold text-primary mb-2">{t("الورش والدورات التدريبية")}</h1>
        <p className="text-muted-foreground mb-8">{t("طور مهاراتك من خلال برامجنا التدريبية المتخصصة.")}</p>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-5/6" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : workshops?.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed">
            <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-medium text-foreground">{t("لا توجد ورش حالياً")}</h3>
            <p className="text-muted-foreground mt-2">{t("ترقبوا برامجنا التدريبية القادمة.")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workshops?.map((workshop) => (
              <Card key={workshop.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3 border-b mb-3 bg-muted/30">
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <CardTitle className="text-xl leading-tight text-primary">{workshop.title}</CardTitle>
                    {getStatusBadge(workshop.status)}
                  </div>
                  <CardDescription className="line-clamp-2">{workshop.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {workshop.trainerName && (
                    <div className="flex items-center text-sm">
                      <GraduationCap className="h-4 w-4 mr-2 rtl:ml-2 text-secondary" />
                      <span className="font-medium">{t("المدرب:")} </span>
                      <span className="mr-1 rtl:ml-1">{workshop.trainerName}</span>
                    </div>
                  )}
                  <div className="flex items-center text-sm text-muted-foreground">
                    <CalendarIcon className="h-4 w-4 mr-2 rtl:ml-2 text-primary" />
                    <span>{format(new Date(workshop.workshopDate), 'dd MMMM yyyy - hh:mm a', { locale: isEnglish ? undefined : ar })}</span>
                  </div>
                  {workshop.location && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPinIcon className="h-4 w-4 mr-2 rtl:ml-2 text-primary" />
                      <span className="line-clamp-1">{workshop.location}</span>
                    </div>
                  )}
                  <div className="flex items-center text-sm text-muted-foreground">
                    <UsersIcon className="h-4 w-4 mr-2 rtl:ml-2 text-primary" />
                    <span>{new Intl.NumberFormat(isEnglish ? "en" : "ar", { useGrouping: false }).format(workshop.registeredCount || 0)} {workshop.capacity ? `/ ${new Intl.NumberFormat(isEnglish ? "en" : "ar", { useGrouping: false }).format(workshop.capacity)}` : ''} {t("متدرب")}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
