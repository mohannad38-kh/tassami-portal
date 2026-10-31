import { PublicLayout } from "@/components/layout/PublicLayout";
import { useLanguage } from "@/hooks/use-language";
import { Sparkles, CheckCircle2, Target } from "lucide-react";

export default function Initiative() {
  const { t } = useLanguage();

  const goals = [
    "تمكين الطلبة وصقل كفاءاتهم وقدراتهم.",
    "توجيه الطاقات الطلابية نحو العمل التطوعي البنّاء.",
    "مساندة فئات المجتمع الأولى بالرعاية وتعزيز التكافل.",
    "تحقيق أثر مجتمعي حقيقي وترك بصمة إيجابية واضحة."
  ];

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-12 md:px-8 max-w-4xl">
        <h1 className="mb-2 border-b pb-4 text-3xl font-bold text-primary flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-secondary" /> {t("التعريف بالمبادرة")}
        </h1>
        <p className="text-muted-foreground mb-8 text-lg">
          {t("نظرة شاملة حول رؤية وأهداف ورسالة مبادرة تسامي التطوعية.")}
        </p>
        
        <div className="space-y-8 bg-card rounded-3xl p-6 md:p-10 border border-border/50 shadow-sm">
          <div className="space-y-6 text-lg leading-relaxed text-muted-foreground">
            <p className="leading-8">
              {t("مبادرة تسامي مبادرة طلابية تابعة لعمادة شؤون الطلبة في جامعة جدارا، وموثقة على منصة «نحن» الوطنية للتطوع. تسعى المبادرة إلى تمكين الطلبة وتوجيه طاقاتهم نحو العمل التطوعي البنّاء وخدمة المجتمع.")}
            </p>
            <p className="leading-8">
              {t("نؤمن بأن العطاء لا يعرف حدوداً، وأن التسامي الحقيقي يبدأ حين نمد يد العون للآخرين. لذلك نعمل على توفير برامج تطوعية وورش عمل ميدانية تعزز المهارات الطلابية وقيم التكافل والمساندة.")}
            </p>
          </div>

          <div className="pt-6 border-t border-border/60">
            <h2 className="mb-6 text-2xl font-bold text-secondary flex items-center gap-2">
              <Target className="h-6 w-6" /> {t("ما نسعى إليه")}
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2">
              {goals.map((goal, index) => (
                <li key={index} className="flex items-start gap-3 bg-muted/30 p-4 rounded-xl border border-border/40">
                  <CheckCircle2 className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
                  <span className="text-foreground text-base leading-relaxed">{t(goal)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}