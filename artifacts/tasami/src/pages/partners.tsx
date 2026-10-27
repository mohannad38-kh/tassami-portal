import { PublicLayout } from "@/components/layout/PublicLayout";
import { useListPartners } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { HandshakeIcon } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

export default function Partners() {
  const { t } = useLanguage();
  const { data: partners, isLoading } = useListPartners();

  return (
    <PublicLayout>
      <div className="container py-12 px-4 md:px-8 mx-auto">
        <div className="flex items-center gap-3 mb-2 border-b pb-4">
          <HandshakeIcon className="h-8 w-8 text-secondary" />
          <h1 className="text-3xl font-bold text-primary">{t("شركاء النجاح")}</h1>
        </div>
        <p className="text-muted-foreground mb-8 mt-4 text-lg max-w-2xl">
          {t("نعتز بشراكاتنا الاستراتيجية مع مختلف الجهات التي تساهم في دعم رسالتنا وتحقيق أهداف المبادرة.")}
        </p>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : partners?.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed">
            <h3 className="text-xl font-medium text-foreground">{t("لم يتم إضافة شركاء بعد")}</h3>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {partners?.map((partner) => (
              <Card key={partner.id} className="overflow-hidden border-border/50 hover:border-primary/30 transition-colors">
                <CardContent className="p-6 h-32 flex flex-col items-center justify-center">
                  {partner.logoUrl ? (
                    <img 
                      src={partner.logoUrl} 
                      alt={partner.name} 
                      className="max-h-full max-w-full object-contain grayscale hover:grayscale-0 transition-all duration-300"
                    />
                  ) : (
                    <div className="text-center">
                      <span className="font-bold text-lg text-primary">{partner.name}</span>
                      {partner.partnerType && <p className="text-xs text-muted-foreground mt-1">{partner.partnerType}</p>}
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
