import { useEffect, useState } from "react";
import { Link } from "wouter";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Star, Users, Heart, Target, Lightbulb } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

const specializedDepartmentCount = 5;

export default function Home() {
  const { t, isEnglish } = useLanguage();
  const [registeredVolunteers, setRegisteredVolunteers] = useState<number | null>(null);
  const [volunteerCountError, setVolunteerCountError] = useState(false);

  useEffect(() => {
    let active = true;
    const statsUrl = import.meta.env.DEV
      ? "/local-api/public/stats"
      : "/api/public/stats";

    const loadStats = async () => {
      try {
        const response = await fetch(statsUrl);
        if (!response.ok) {
          throw new Error(`Could not load public stats: ${response.status}`);
        }
        const data: unknown = await response.json();
        if (
          typeof data !== "object" ||
          data === null ||
          !("registeredVolunteers" in data) ||
          typeof data.registeredVolunteers !== "number" ||
          !Number.isSafeInteger(data.registeredVolunteers) ||
          data.registeredVolunteers < 0
        ) {
          throw new Error("The public stats response is invalid");
        }
        if (active) {
          setRegisteredVolunteers(data.registeredVolunteers);
          setVolunteerCountError(false);
        }
      } catch (error) {
        console.error("Failed to load registered volunteer count:", error);
        if (active) setVolunteerCountError(true);
      }
    };

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void loadStats();
    };

    void loadStats();
    const intervalId = window.setInterval(loadStats, 30_000);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

  return (
    <PublicLayout>
      <section className="relative flex min-h-[460px] items-center overflow-hidden text-center" style={{ background: "linear-gradient(115deg, #602531 0%, #7a3342 55%, #602531 100%)" }}>
        <div className="container mx-auto px-4 py-16 md:px-8">
          <h1 className="mb-4 text-4xl font-bold text-white md:text-6xl">
            {isEnglish ? (
              <>Tasami <span style={{ color: "#d5b976" }}>Volunteer</span> Initiative</>
            ) : (
              <>مبادرة <span style={{ color: "#d5b976" }}>تسامي</span> التطوعية</>
            )}
          </h1>
          <p className="mx-auto mb-10 max-w-3xl text-lg leading-relaxed text-white/90 md:text-2xl">
            {t("نسمو بالعمل التطوعي لنصنع أثراً مستداماً ومجتمعاً متكافلاً.")}
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="px-8 text-lg font-bold"
              style={{ background: "#d5b976", color: "#382a20" }}
              asChild
            >
              <Link href="/join">{t("انضم إلينا")}</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/50 px-8 text-lg font-bold text-white hover:bg-white/10 hover:text-white"
              asChild
            >
              <Link href="/about">{t("اكتشف المزيد")}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-muted/40 py-12">
        <div className="container px-4 md:px-8 mx-auto">
          <div className="grid grid-cols-1 gap-5 text-center sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                number: volunteerCountError
                  ? "تعذر التحميل"
                  : registeredVolunteers === null
                    ? "..."
                    : new Intl.NumberFormat("en", { useGrouping: false }).format(registeredVolunteers),
                label: t("متطوع مسجل"),
              },
              { number: "+4", label: t("فعالية منجزة") },
              { number: "+8", label: t("ساعة تطوعية") },
              { number: String(specializedDepartmentCount), label: t("أقسام متخصصة") },
            ].map((stat, index) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-border/60 bg-card px-5 py-6 shadow-sm"
              >
                <div
                  className="mb-1 text-4xl font-bold"
                  style={{ color: index % 2 === 0 ? "#702632" : "#a27a37" }}
                >
                  {stat.number}
                </div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container px-4 md:px-8 mx-auto">
          <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-5">
            {[
              { icon: Target, label: t("أثر مستدام"), desc: t("نهدف إلى أثر حقيقي مستمر") },
              { icon: Heart, label: t("العمل التطوعي"), desc: t("نعزز ثقافة العطاء") },
              { icon: Users, label: t("تمكين الشباب"), desc: t("نطور مهارات الشباب") },
              { icon: Lightbulb, label: t("الابتكار"), desc: t("نشجع التفكير الإبداعي") },
              { icon: Star, label: t("التميز"), desc: t("نسعى للتميز دائماً") },
            ].map((stat, i) => (
              <div
                key={i}
                className="rounded-2xl border p-5 transition-shadow hover:shadow-md"
                style={{ borderColor: "rgba(112,38,50,0.14)" }}
              >
                <div
                  className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ background: "rgba(112,38,50,0.08)" }}
                >
                  <stat.icon className="h-6 w-6" style={{ color: "#702632" }} />
                </div>
                <div className="mb-1 font-bold" style={{ color: "#702632" }}>
                  {stat.label}
                </div>
                <div className="text-sm text-gray-500">{stat.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="bg-muted/40 py-20">
        <div className="container px-4 md:px-8 mx-auto">
          <div className="flex items-center justify-between mb-10">
            <Button variant="outline" className="border-primary text-primary" asChild>
              <Link href="/events">{t("عرض الكل")}</Link>
            </Button>
            <h2 className="text-3xl font-bold text-primary">{t("الفعاليات القادمة")}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'ورشة لتعلم اساسيات البرمجة والروبوتات', date: '15 شعبان', time: '10:00 صباحاً', place: 'سيتم الإعلان عنها لاحقاً' },
              { title: 'يوم التطوع البيئي', date: '22 شعبان', time: '04:00 مساءً', place: 'سيتم الإعلان عنها لاحقاً' },
              { title: 'ملتقى الشباب المبدع', date: '05 رمضان', time: '09:00 مساءً', place: 'سيتم الإعلان عنها لاحقاً' },
            ].map((event, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 bg-primary p-4">
                  <div className="text-3xl font-bold text-secondary">{event.date.split(' ')[0]}</div>
                  <div className="text-white">{t(event.date.split(' ')[1])}</div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-lg mb-3 text-primary">{t(event.title)}</h3>
                  <div className="flex items-center gap-2 text-gray-500 mb-2 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>{event.time.replace("صباحاً", t("صباحاً")).replace("مساءً", t("مساءً"))}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500 mb-4 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>{t(event.place)}</span>
                  </div>
                  <Button className="w-full font-bold" variant="secondary" asChild>
                    <Link href="/events">{t("عرض التفاصيل")}</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
// update Mon Jun 29 10:46:38 PM UTC 2026
