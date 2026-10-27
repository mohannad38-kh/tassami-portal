import { PublicLayout } from "@/components/layout/PublicLayout";
import { useLanguage } from "@/hooks/use-language";

const values = [
  {
    title: "الإخلاص",
    description: "العمل بصدق وتفانٍ لخدمة المجتمع.",
  },
  {
    title: "المبادرة",
    description: "السبق إلى تقديم البرامج والمبادرات النافعة.",
  },
  {
    title: "التكافل",
    description: "تعزيز التعاون ومساندة فئات المجتمع.",
  },
  {
    title: "الأثر المستدام",
    description: "بناء مبادرات تترك بصمة إيجابية واضحة.",
  },
];

export default function About() {
  const { t } = useLanguage();

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-12 md:px-8">
        <h1 className="mb-8 border-b pb-4 text-3xl font-bold text-primary">{t("من نحن")}</h1>

        <section className="mb-10 rounded-2xl border border-primary/10 bg-card p-6 shadow-sm md:p-8">
          <h2 className="mb-4 text-2xl font-semibold text-primary">{t("مبادرة تسامي")}</h2>
          <p className="text-lg leading-8 text-muted-foreground">
            {t("تسامي هي مبادرة طلابية تابعة لعمادة شؤون الطلبة في جامعة جدارا، وموثقة على منصة «نحن» الوطنية للتطوع. تأسست لتكون منصة فاعلة تسعى إلى تمكين الطلبة وتوجيه طاقاتهم نحو العمل التطوعي البنّاء؛ إيماناً بأن العطاء لا يعرف حدوداً، وأن التسامي الحقيقي يبدأ حين نمد يد العون للآخرين.")}
          </p>
        </section>

        <section className="mb-10 grid gap-6 md:grid-cols-2">
          <article className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm md:p-8">
            <h2 className="mb-4 text-2xl font-semibold text-secondary">{t("رؤيتنا")}</h2>
            <p className="leading-8 text-muted-foreground">
              {t("نطمح بأن نكون منارة للعطاء، تلهم الطلبة على تجاوز حدود القاعات الدراسية نحو خدمة المجتمع، ونسج علاقة حقيقية بين الجامعة والإنسان.")}
            </p>
          </article>

          <article className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm md:p-8">
            <h2 className="mb-4 text-2xl font-semibold text-secondary">{t("رسالتنا")}</h2>
            <p className="leading-8 text-muted-foreground">
              {t("تمكين الكفاءات الطلابية وصقل قدراتهم من خلال برامج العمل التطوعي وورش العمل الميدانية، وتجسيد قيم التكافل والمساندة لفئات المجتمع الأولى بالرعاية؛ لتحقيق أثر مجتمعي حقيقي وترك بصمة إيجابية واضحة.")}
            </p>
          </article>
        </section>

        <section className="rounded-2xl border border-border/60 bg-muted/30 p-6 md:p-8">
          <h2 className="mb-6 text-2xl font-semibold text-primary">{t("قيمنا")}</h2>
          <ul className="grid gap-5 sm:grid-cols-2">
            {values.map((value) => (
              <li key={value.title} className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary/20 text-secondary"
                >
                  ✓
                </span>
                <div>
                  <h3 className="font-medium">{t(value.title)}</h3>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {t(value.description)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </PublicLayout>
  );
}
