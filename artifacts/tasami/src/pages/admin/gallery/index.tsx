import { AdminLayout } from "@/components/layout/DashboardLayout";
import { useListGallery } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

export default function AdminGallery() {
  const { t } = useLanguage();
  const { data: gallery, isLoading } = useListGallery();

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">{t("معرض الصور")}</h1>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2 rtl:ml-2" /> {t("إضافة صورة")}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="aspect-square rounded-xl w-full" />)}
        </div>
      ) : gallery?.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground bg-muted/20 border border-dashed rounded-xl">
          {t("لا توجد صور في المعرض")}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {gallery?.map((item) => (
            <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden group">
              <img src={item.imageUrl} alt={item.title || t("صورة")} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                <div className="text-white text-sm">
                  {item.title && <p className="font-medium line-clamp-1">{item.title}</p>}
                  {item.eventTitle && <p className="text-white/80 line-clamp-1">{item.eventTitle}</p>}
                </div>
                <div className="flex justify-end">
                  <Button size="icon" variant="destructive" className="h-8 w-8 bg-destructive/80 hover:bg-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
