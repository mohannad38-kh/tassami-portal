import { PublicLayout } from "@/components/layout/PublicLayout";
import { useLanguage } from "@/hooks/use-language";

export default function Initiative() {
  const { t } = useLanguage();

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-12 md:px-8">
        <h1 className="mb-8 border-b pb-4 text-3xl font-bold text-primary">
          {t("التعريف بالمبادرة")}
        </h1>
        <div className="max-w-4xl space-y-8 text-lg leading-8 text-muted-foreground">
          <p>
            {t("مبادرة تسامي مبادرة طلابية تابعة لعمادة شؤون الطلبة في جامعة جدارا، وموثقة على منصة «نحن» الوطنية للتطوع. تسعى المبادرة إلى تمكين الطلبة وتوجيه طاقاتهم نحو العمل التطوعي البنّاء وخدمة المجتمع.")}
          </p>
          <p>
            {t("نؤمن بأن العطاء لا يعرف حدوداً، وأن التسامي الحقيقي يبدأ حين نمد يد العون للآخرين. لذلك نعمل على توفير برامج تطوعية وورش عمل ميدانية تعزز المهارات الطلابية وقيم التكافل والمساندة.")}
          </p>
          <h2 className="mt-8 text-2xl font-bold text-secondary">{t("ما نسعى إليه")}</h2>
          <ul className="list-inside list-disc space-y-2 pr-6">
            <li>{t("تمكين الطلبة وصقل كفاءاتهم وقدراتهم.")}</li>
            <li>{t("توجيه الطاقات الطلابية نحو العمل التطوعي البنّاء.")}</li>
            <li>{t("مساندة فئات المجتمع الأولى بالرعاية وتعزيز التكافل.")}</li>
            <li>{t("تحقيق أثر مجتمعي حقيقي وترك بصمة إيجابية واضحة.")}</li>
          </ul>
        </div>
      </div>
    </PublicLayout>
  );
}
