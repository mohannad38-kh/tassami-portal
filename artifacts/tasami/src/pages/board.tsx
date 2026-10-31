import { PublicLayout } from "@/components/layout/PublicLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Users } from "lucide-react";
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
      <div className="container py-12 px-4 md:px-8 mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold text-primary mb-2 border-b pb-4 flex items-center gap-2">
          <Users className="h-8 w-8" /> {t("المؤسسون والإدارة")}
        </h1>
        <p className="text-muted-foreground mb-10 mt-2 text-lg">
          {t("مؤسسو مبادرة تسامي وأعضاء إدارتها القائمون على تطويرها ونجاحها.")}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {founders.map((member) => (
            <Card
              key={member.id}
              className="text-center overflow-hidden border-primary/10 hover:shadow-lg transition-all duration-300 group"
            >
              <div className="h-28 bg-primary/5 flex justify-center items-end pb-4 border-b relative">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/10 to-transparent opacity-50"></div>
                <div className="h-24 w-24 rounded-full bg-background border-4 border-card shadow-md flex items-center justify-center text-primary/40 group-hover:text-primary transition-colors translate-y-10 z-10">
                  <User className="h-12 w-12" />
                </div>
              </div>
              <CardHeader className="pt-12 pb-2">
                <CardTitle className="text-lg font-bold text-primary">
                  {member.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-6">
                <span className="inline-block bg-secondary/10 text-secondary-foreground px-3 py-1 rounded-full text-xs font-semibold">
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