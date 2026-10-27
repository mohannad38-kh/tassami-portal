import { PublicLayout } from "@/components/layout/PublicLayout";
import { useListEvents } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarIcon, MapPinIcon, UsersIcon } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useLanguage } from "@/hooks/use-language";

export default function Events() {
  const { t, isEnglish } = useLanguage();
  const { data: events, isLoading } = useListEvents();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming":
        return <Badge variant="default" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">{t("قادمة")}</Badge>;
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
        <h1 className="text-3xl font-bold text-primary mb-2">{t("الفعاليات")}</h1>
        <p className="text-muted-foreground mb-8">{t("شارك معنا في صناعة الأثر عبر فعالياتنا المتنوعة.")}</p>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
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
        ) : events?.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed">
            <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-medium text-foreground">{t("لا توجد فعاليات حالياً")}</h3>
            <p className="text-muted-foreground mt-2">{t("ترقبوا فعالياتنا القادمة قريباً.")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events?.map((event) => (
              <Card key={event.id} className="overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                {event.imageUrl ? (
                  <div className="h-48 overflow-hidden">
                    <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="h-48 bg-primary/5 flex items-center justify-center border-b">
                    <CalendarIcon className="h-16 w-16 text-primary/20" />
                  </div>
                )}
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <CardTitle className="text-xl leading-tight line-clamp-2">{event.title}</CardTitle>
                    {getStatusBadge(event.status)}
                  </div>
                  <CardDescription className="line-clamp-2">{event.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto pb-4">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-2 rtl:ml-2 text-primary" />
                      <span>{format(new Date(event.eventDate), 'dd MMMM yyyy - hh:mm a', { locale: isEnglish ? undefined : ar })}</span>
                    </div>
                    {event.location && (
                      <div className="flex items-center">
                        <MapPinIcon className="h-4 w-4 mr-2 rtl:ml-2 text-primary" />
                        <span className="line-clamp-1">{event.location}</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <UsersIcon className="h-4 w-4 mr-2 rtl:ml-2 text-primary" />
                      <span>{new Intl.NumberFormat(isEnglish ? "en" : "ar", { useGrouping: false }).format(event.registeredCount || 0)} {event.capacity ? `/ ${new Intl.NumberFormat(isEnglish ? "en" : "ar", { useGrouping: false }).format(event.capacity)}` : ''} {t("مسجل")}</span>
                    </div>
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
