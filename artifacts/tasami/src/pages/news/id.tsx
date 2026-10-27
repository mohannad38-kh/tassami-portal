import { useParams, Link } from "wouter";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useGetNewsItem } from "@workspace/api-client-react";
import { getGetNewsItemQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronRight, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useLanguage } from "@/hooks/use-language";

export default function NewsDetail() {
  const { t, isEnglish } = useLanguage();
  const params = useParams();
  const id = params.id ? parseInt(params.id, 10) : 0;
  
  const { data: news, isLoading, isError } = useGetNewsItem(id, {
    query: {
      enabled: !!id,
      queryKey: getGetNewsItemQueryKey(id)
    }
  });

  return (
    <PublicLayout>
      <div className="container py-12 px-4 md:px-8 mx-auto max-w-4xl">
        <Button variant="ghost" asChild className="mb-6 -ml-4 hover:bg-transparent hover:text-primary">
          <Link href="/news" className="flex items-center text-muted-foreground">
            <ChevronRight className="h-4 w-4 ml-1" />
            {t("العودة للأخبار")}
          </Link>
        </Button>

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-[400px] w-full rounded-2xl" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        ) : isError || !news ? (
          <div className="text-center py-20 bg-muted/20 rounded-2xl">
            <h3 className="text-xl font-medium text-destructive mb-2">{t("تعذر تحميل الخبر")}</h3>
            <p className="text-muted-foreground">{t("قد يكون الخبر غير موجود أو تم حذفه.")}</p>
          </div>
        ) : (
          <article className="bg-card rounded-3xl p-6 md:p-10 shadow-sm border border-border/50">
            <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4 leading-tight">
              {news.title}
            </h1>
            
            <div className="flex items-center text-sm text-muted-foreground mb-8 pb-6 border-b">
              {news.publishedAt && (
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 rtl:ml-2 text-secondary" />
                  <span>{format(new Date(news.publishedAt), 'dd MMMM yyyy', { locale: isEnglish ? undefined : ar })}</span>
                </div>
              )}
              {news.authorName && (
                <>
                  <span className="mx-3 text-border">•</span>
                  <span>{t("بقلم:")} {news.authorName}</span>
                </>
              )}
            </div>

            {news.imageUrl && (
              <div className="mb-8 rounded-2xl overflow-hidden shadow-sm">
                <img src={news.imageUrl} alt={news.title} className="w-full object-cover max-h-[500px]" />
              </div>
            )}

            <div className="prose prose-lg dark:prose-invert max-w-none text-foreground leading-relaxed whitespace-pre-line">
              {news.body}
            </div>
          </article>
        )}
      </div>
    </PublicLayout>
  );
}
