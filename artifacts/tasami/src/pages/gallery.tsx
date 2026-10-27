import { PublicLayout } from "@/components/layout/PublicLayout";
import { useListGallery } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageIcon } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

export default function Gallery() {
  const { t } = useLanguage();
  const { data: gallery, isLoading } = useListGallery();

  return (
    <PublicLayout>
      <div className="container py-12 px-4 md:px-8 mx-auto">
        <h1 className="text-3xl font-bold text-primary mb-8 border-b pb-4">{t("معرض الصور")}</h1>
        
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        ) : gallery?.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed">
            <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-medium text-foreground">{t("لا توجد صور حالياً")}</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {gallery?.map((item) => (
              <div key={item.id} className="group relative aspect-square rounded-xl overflow-hidden bg-muted shadow-sm">
                <img 
                  src={item.imageUrl} 
                  alt={item.title || t("صورة من الفعاليات")}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                {(item.title || item.eventTitle) && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    {item.title && <h3 className="text-white font-medium text-lg">{item.title}</h3>}
                    {item.eventTitle && <p className="text-white/80 text-sm">{item.eventTitle}</p>}
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
