import { PublicLayout } from "@/components/layout/PublicLayout";
import { useListGallery } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageIcon } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

export default function Gallery() {
  const { t } = useLanguage();
  const { data: rawGallery, isLoading } = useListGallery();

  // حماية صارمة لضمان أن البيانات دائماً مصفوفة لتجنب أي أخطاء وقت التشغيل (TypeError)
  const gallery = Array.isArray(rawGallery) ? rawGallery : ((rawGallery as any)?.items || []);

  return (
    <PublicLayout>
      <div className="container py-12 px-4 md:px-8 mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-2">
          <ImageIcon className="h-8 w-8" /> {t("معرض الصور")}
        </h1>
        <p className="text-muted-foreground mb-8 text-lg">{t("صور توثيقية لأنشطة وفعاليات مبادرة تسامي التطوعية.")}</p>
        
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="aspect-square rounded-xl border-border/50" />
            ))}
          </div>
        ) : gallery.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed border-border/60">
            <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-40" />
            <h3 className="text-xl font-medium text-foreground">{t("لا توجد صور حالياً")}</h3>
            <p className="text-muted-foreground mt-2 text-sm">{t("ترقبوا صور فعالياتنا وأنشطتنا قريباً.")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {gallery.map((item: any) => (
              <div key={item.id} className="group relative aspect-square rounded-xl overflow-hidden bg-muted shadow-sm border border-border/40">
                <img 
                  src={item.imageUrl} 
                  alt={item.title || t("صورة من الفعاليات")}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {(item.title || item.eventTitle) && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    {item.title && <h3 className="text-white font-medium text-lg leading-tight">{item.title}</h3>}
                    {item.eventTitle && <p className="text-white/80 text-xs mt-1">{item.eventTitle}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}