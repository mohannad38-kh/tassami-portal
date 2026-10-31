import { PublicLayout } from "@/components/layout/PublicLayout";
import { useListNews } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useLanguage } from "@/hooks/use-language";
import { Newspaper } from "lucide-react";

export default function News() {
  const { t, isEnglish } = useLanguage();
  const { data: rawNewsItems, isLoading } = useListNews();

  // حماية صارمة لضمان أن البيانات دائماً مصفوفة لتجنب أي أخطاء وقت التشغيل (TypeError)
  const newsItems = Array.isArray(rawNewsItems)
    ? rawNewsItems
    : ((rawNewsItems as any)?.items || []);

  return (
    <PublicLayout>
      <div className="container py-12 px-4 md:px-8 mx-auto">
        <h1 className="text-3xl font-bold text-primary mb-8 border-b pb-4 flex items-center gap-2">
          <Newspaper className="h-8 w-8" /> {t("الأخبار والإعلانات")}
        </h1>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="flex overflow-hidden border-border/50">
                <Skeleton className="w-1/3 h-full min-h-[150px]" />
                <div className="w-2/3">
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-5/6" />
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        ) : newsItems.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 rounded-2xl border border-border/50">
            <Newspaper className="h-12 w-12 mx-auto mb-3 opacity-20 text-muted-foreground" />
            <h3 className="text-xl font-medium text-foreground">{t("لا توجد أخبار حالياً")}</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {newsItems.map((item: any) => (
              <Link key={item.id} href={`/news/${item.id}`}>
                <Card className="flex flex-col sm:flex-row overflow-hidden hover:shadow-md transition-all cursor-pointer h-full border-primary/10">
                  {item.imageUrl ? (
                    <div className="sm:w-1/3 h-48 sm:h-auto shrink-0">
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="sm:w-1/3 h-48 sm:h-auto bg-muted flex items-center justify-center shrink-0">
                      <span className="text-muted-foreground text-sm">{t("صورة الخبر")}</span>
                    </div>
                  )}
                  <div className="flex flex-col flex-1 p-5">
                    <div className="text-xs text-secondary font-medium mb-2">
                      {item.publishedAt ? format(new Date(item.publishedAt), 'dd MMMM yyyy', { locale: isEnglish ? undefined : ar }) : ''}
                    </div>
                    <h3 className="text-lg font-bold text-primary mb-3 line-clamp-2">{item.title}</h3>
                    <p className="text-muted-foreground text-sm line-clamp-3 mt-auto">{item.body}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}