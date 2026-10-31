import { useEffect, useState } from "react";
import { Link } from "wouter";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Star, Users, Heart, Target, Lightbulb, Sparkles, ArrowRight, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

const SPECIALIZED_DEPARTMENT_COUNT = 5;

const FEATURES = [
  { icon: Target, label: "أثر مستدام", desc: "نهدف إلى أثر حقيقي مستمر" },
  { icon: Heart, label: "العمل التطوعي", desc: "نعزز ثقافة العطاء" },
  { icon: Users, label: "تمكين الشباب", desc: "نطور مهارات الشباب" },
  { icon: Lightbulb, label: "الابتكار", desc: "نشجع التفكير الإبداعي" },
  { icon: Star, label: "التميز", desc: "نسعى للتميز دائماً" },
];

const UPCOMING_EVENTS = [
  { title: "ملتقى الشباب المبدع", place: "سيتم الإعلان عنها لاحقاً" },
  { title: "يوم التطوع البيئي", place: "سيتم الإعلان عنها لاحقاً" },
  { title: "ورشة لتعلم اساسيات البرمجة والروبوتات", place: "سيتم الإعلان عنها لاحقاً" },
];

export default function Home() {
  const { t, isEnglish } = useLanguage();
  const [registeredVolunteers, setRegisteredVolunteers] = useState<number | null>(null);
  const [volunteerCountError, setVolunteerCountError] = useState(false);

  useEffect(() => {
    let active = true;
    const statsUrl = "/api/public/stats";

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

  const displayVolunteerCount =
    volunteerCountError || registeredVolunteers === null
      ? "3"
      : new Intl.NumberFormat("en", { useGrouping: false }).format(registeredVolunteers);

  const statsList = [
    { number: displayVolunteerCount, label: t("متطوع مسجل") },
    { number: "+4", label: t("فعالية منجزة") },
    { number: "+8", label: t("ساعة تطوعية") },
    { number: String(SPECIALIZED_DEPARTMENT_COUNT), label: t("أقسام متخصصة") },
  ];

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section
        className="relative flex min-h-[500px] items-center overflow-hidden text-center py-20"
        style={{ background: "linear-gradient(115deg, #602531 0%, #7a3342 55%, #602531 100%)" }}
      >
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white/90 backdrop-blur-sm text-sm mb-6 border border-white/15">
            <Sparkles className="h-4 w-4 text-[#d5b976]" />
            <span>{t("منصة العمل التطوعي في جامعة جدارا")}</span>
          </div>
          <h1 className="mb-6 text-4xl font-extrabold text-white md:text-6xl tracking-tight leading-tight">
            {isEnglish ? (
              <>
                Tasami <span style={{ color: "#d5b976" }}>Volunteer</span> Initiative
              </>
            ) : (
              <>
                مبادرة <span style={{ color: "#d5b976" }}>تسامي</span> التطوعية
              </>
            )}
          </h1>
          <p className="mx-auto mb-10 max-w-3xl text-lg leading-relaxed text-white/90 md:text-2xl font-light">
            {t("نسمو بالعمل التطوعي لنصنع أثراً مستداماً ومجتمعاً متكافلاً.")}
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="px-8 text-lg font-bold h-12 shadow-lg hover:opacity-95 transition-all"
              style={{ background: "#d5b976", color: "#382a20" }}
              asChild
            >
              <Link href="/join" className="flex items-center gap-2">
                {t("انضم إلينا")}
                {isEnglish ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/40 px-8 text-lg font-bold text-white hover:bg-white/10 hover:text-white h-12 backdrop-blur-sm"
              asChild
            >
              <Link href="/about">{t("اكتشف المزيد")}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-muted/40 py-12 border-y border-border/40">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 gap-6 text-center sm:grid-cols-2 lg:grid-cols-4">
            {statsList.map((stat, index) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-border/60 bg-card px-6 py-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div
                  className="mb-1 text-4xl font-bold font-mono"
                  style={{ color: index % 2 === 0 ? "#702632" : "#a27a37" }}
                >
                  {stat.number}
                </div>
                <div className="text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primary mb-3">{t("قيمنا وأهدافنا")}</h2>
            <p className="text-muted-foreground text-lg">{t("الركائز الأساسية التي تنطلق منها مبادرة تسامي")}</p>
          </div>
          <div className="grid grid-cols-2 gap-6 text-center md:grid-cols-5">
            {FEATURES.map((feature, i) => (
              <div
                key={i}
                className="rounded-2xl border p-6 transition-all hover:shadow-lg bg-card group"
                style={{ borderColor: "rgba(112,38,50,0.14)" }}
              >
                <div
                  className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl group-hover:scale-110 transition-transform"
                  style={{ background: "rgba(112,38,50,0.08)" }}
                >
                  <feature.icon className="h-7 w-7" style={{ color: "#702632" }} />
                </div>
                <div className="mb-2 font-bold text-lg" style={{ color: "#702632" }}>
                  {t(feature.label)}
                </div>
                <div className="text-xs text-muted-foreground leading-relaxed">{t(feature.desc)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="bg-muted/40 py-20 border-t border-border/40">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl">
          <div className="mb-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-primary">{t("الفعاليات القادمة")}</h2>
              <p className="text-muted-foreground mt-1">{t("ترقبوا أحدث الفعاليات والأنشطة القادمة لمبادرة تسامي")}</p>
            </div>
            <Button variant="outline" className="border-primary text-primary hover:bg-primary/5" asChild>
              <Link href="/events">{t("عرض الكل")}</Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {UPCOMING_EVENTS.map((event, i) => (
              <div key={i} className="overflow-hidden rounded-2xl bg-card border border-border/60 shadow-sm transition-all hover:shadow-md flex flex-col">
                <div className="flex items-center gap-3 bg-primary p-4 text-white">
                  <div className="text-sm font-semibold tracking-wide">{t("فعالية قادمة")}</div>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="mb-3 text-lg font-bold text-primary leading-snug">{t(event.title)}</h3>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-secondary shrink-0" />
                        <span>{t("موعد يحدد قريباً")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-secondary shrink-0" />
                        <span>{t(event.place)}</span>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full font-bold mt-2" variant="secondary" asChild>
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