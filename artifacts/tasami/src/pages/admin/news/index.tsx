import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListNews, useListAnnouncements } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus, Edit } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useLanguage } from "@/hooks/use-language";

export default function AdminNews() {
  const { t, isEnglish } = useLanguage();
  const { data: news, isLoading: isLoadingNews } = useListNews();
  const { data: announcements, isLoading: isLoadingAnnouncements } = useListAnnouncements();

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">{t("الأخبار والإعلانات")}</h1>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2 rtl:ml-2" /> {t("إضافة خبر / إعلان")}
        </Button>
      </div>

      <Tabs defaultValue="news" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="news">{t("الأخبار المنشورة")}</TabsTrigger>
          <TabsTrigger value="announcements">{t("الإعلانات الداخلية")}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="news">
          <Card>
            <CardContent className="p-0">
              {isLoadingNews ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : news?.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  {t("لا توجد أخبار منشورة")}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("عنوان")}</TableHead>
                        <TableHead>{t("تاريخ النشر")}</TableHead>
                        <TableHead>{t("الكاتب")}</TableHead>
                        <TableHead className="text-left"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {news?.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium max-w-[300px] truncate">{item.title}</TableCell>
                          <TableCell>
                            {item.publishedAt ? format(new Date(item.publishedAt), 'dd MMM yyyy', { locale: isEnglish ? undefined : ar }) : "-"}
                          </TableCell>
                          <TableCell>{item.authorName || "-"}</TableCell>
                          <TableCell className="text-left">
                            <Button size="sm" variant="ghost">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="announcements">
          <Card>
            <CardContent className="p-0">
              {isLoadingAnnouncements ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : announcements?.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  {t("لا توجد إعلانات داخلية")}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("عنوان")}</TableHead>
                        <TableHead>{t("تاريخ الإنشاء")}</TableHead>
                        <TableHead>{t("الفئة المستهدفة")}</TableHead>
                        <TableHead className="text-left"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {announcements?.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium max-w-[300px] truncate">{item.title}</TableCell>
                          <TableCell>
                            {format(new Date(item.createdAt), 'dd MMM yyyy', { locale: isEnglish ? undefined : ar })}
                          </TableCell>
                          <TableCell>{item.targetRole || t("الجميع")}</TableCell>
                          <TableCell className="text-left">
                            <Button size="sm" variant="ghost">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
