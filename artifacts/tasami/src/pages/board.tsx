import { PublicLayout } from "@/components/layout/PublicLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

export default function Board() {
  const { t } = useLanguage();
  const founders = [
    { id: 1, name: "ألين محمود البشتاوي", role: "مؤسس ورئيس المبادرة" },
    { id: 2, name: "شروق أمين أبو عكاز", role: "مؤسس ونائب رئيس المبادرة" },
    { id: 3, name: "نبأ سهيل شرادقة", role: "أمين السر" },
    { id: 4, name: "مهند عماد خلوف", role: "الأمين العام" },
  ];

  return (
    <PublicLayout>
      <div className="container py-12 px-4 md:px-8 mx-auto">
        <h1 className="text-3xl font-bold text-primary mb-2 border-b pb-4">
          {t("المؤسسون والإدارة")}
        </h1>
        <p className="text-muted-foreground mb-8 mt-4 text-lg">
          {t("مؤسسو مبادرة تسامي وأعضاء إدارتها.")}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {founders.map((member) => (
            <Card
              key={member.id}
              className="text-center overflow-hidden border-primary/10 hover:shadow-md transition-shadow"
            >
              <div className="h-32 bg-primary/5 flex justify-center items-end pb-4 border-b">
                <div className="h-24 w-24 rounded-full bg-white border-4 border-white shadow-sm flex items-center justify-center text-primary/30 translate-y-10">
                  <User className="h-12 w-12" />
                </div>
              </div>
              <CardHeader className="pt-14 pb-2">
                <CardTitle className="text-xl text-primary">
                  {member.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className="inline-block bg-secondary/10 text-secondary-foreground px-3 py-1 rounded-full text-sm font-medium">
                  {t(member.role)}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}
