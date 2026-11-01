import { useEffect, useState } from "react";
import { Link } from "wouter";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import {
  Clock,
  MapPin,
  Star,
  Users,
  Heart,
  Target,
  Lightbulb,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Calendar,
} from "lucide-react";
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
  {
    title: "ملتقى الشباب المبدع",
    place: "سيتم الإعلان عنها لاحقاً",
    tag: "ملتقى",
  },
  {
    title: "يوم التطوع البيئي",
    place: "سيتم الإعلان عنها لاحقاً",
    tag: "تطوع",
  },
  {
    title: "ورشة أساسيات البرمجة والروبوتات",
    place: "سيتم الإعلان عنها لاحقاً",
    tag: "ورشة",
  },
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
        if (!response.ok) throw new Error(`Could not load public stats: ${response.status}`);
        const data: unknown = await response.json();
        if (
          typeof data !== "object" ||
          data === null ||
          !("registeredVolunteers" in data) ||
          typeof (data as any).registeredVolunteers !== "number" ||
          !Number.isSafeInteger((data as any).registeredVolunteers) ||
          (data as any).registeredVolunteers < 0
        ) {
          throw new Error("The public stats response is invalid");
        }
        if (active) {
          setRegisteredVolunteers((data as any).registeredVolunteers);
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
      {/* ===== Hero Section ===== */}
      <section className="relative overflow-hidden text-center">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, #4a1c24 0%, #702632 40%, #8b3a45 70%, #602531 100%)",
          }}
        />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#d5b976] blur-3xl" />
          <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        </div>

        <div className="container relative z-10 mx-auto px-4 py-24 md:px-8 md:py-32">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm text-white/90 backdrop-blur-sm mb-8 shadow-sm">
            <Sparkles className="h-4 w-4 text-[#d5b976]" />
            <span>{t("منصة العمل التطوعي في جامعة جدارا")}</span>
          </div>

          <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-white md:text-6xl lg:text-7xl">
            {isEnglish ? (
              <>
                Tasami <span className="text-[#d5b976]">Volunteer</span> Initiative
              </>
            ) : (
              <>
                مبادرة <span className="text-[#d5b976]">تسامي</span> التطوعية
              </>
            )}
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg font-light leading-relaxed text-white/90 md:text-xl">
            {t("نسمو بالعمل التطوعي لنصنع أثراً مستداماً ومجتمعاً متكافلاً.")}
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="h-12 px-8 text-base font-bold shadow-lg transition-all hover:scale-[1.02] hover:opacity-95"
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
              className="h-12 border-white/40 bg-transparent px-8 text-base font-bold text-white backdrop-blur-sm hover:bg-white/10 hover:text-white"
              asChild
            >
              <Link href="/about">{t("اكتشف المزيد")}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ===== Stats Section ===== */}
      <section className="relative z-25 -mt-10 px-4 md:px-8">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-2 gap-4 rounded-2xl border border-border/50 bg-card p-4 shadow-xl md:grid-cols-4 md:p-6">
            {statsList.map((stat, index) => (
              <div
                key={stat.label}
                className="flex flex-col items-center justify-center rounded-xl px-3 py-5 text-center transition-colors hover:bg-muted/40"
              >
                <div
                  className="mb-1 text-3xl font-bold font-mono md:text-4xl"
                  style={{ color: index % 2 === 0 ? "#702632" : "#a27a37" }}
                >
                  {stat.number}
                </div>
                <div className="text-sm font-medium text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Values / Features Section ===== */}
      <section className="bg-background py-20">
        <div className="container mx-auto max-w-6xl px-4 md:px-8">
          <div className="mb-14 text-center">
            <h2 className="mb-3 text-3xl font-bold text-primary md:text-4xl">
              {t("قيمنا وأهدافنا")}
            </h2>
            <p className="mx-auto max-w-xl text-muted-foreground text-lg">
              {t("الركائز الأساسية التي تنطلق منها مبادرة تسامي")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-5 md:grid-cols-5">
            {FEATURES.map((feature, i) => (
              <div
                key={i}
                className="group rounded-2xl border border-[#702632]/10 bg-card p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#702632]/25 hover:shadow-lg"
              >
                <div
                  className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110"
                  style={{ background: "rgba(112,38,50,0.09)" }}
                >
                  <feature.icon className="h-7 w-7" style={{ color: "#702632" }} />
                </div>
                <div className="mb-2 text-base font-bold" style={{ color: "#702632" }}>
                  {t(feature.label)}
                </div>
                <div className="text-xs leading-relaxed text-muted-foreground">
                  {t(feature.desc)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Upcoming Events Section ===== */}
      <section className="border-t border-border/40 bg-muted/30 py-20">
        <div className="container mx-auto max-w-6xl px-4 md:px-8">
          <div className="mb-12 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-3xl font-bold text-primary md:text-4xl">
                {t("الفعاليات القادمة")}
              </h2>
              <p className="mt-2 text-muted-foreground">
                {t("ترقبوا أحدث الفعاليات والأنشطة القادمة لمبادرة تسامي")}
              </p>
            </div>
            <Button
              variant="outline"
              className="border-primary text-primary hover:bg-primary/5"
              asChild
            >
              <Link href="/events">{t("عرض الكل")}</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {UPCOMING_EVENTS.map((event, i) => (
              <div
                key={i}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-center justify-between bg-primary px-5 py-3.5 text-white">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Calendar className="h-4 w-4 opacity-80" />
                    {t("فعالية قادمة")}
                  </div>
                  <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs">
                    {t(event.tag)}
                  </span>
                </div>

                <div className="flex flex-1 flex-col justify-between space-y-4 p-6">
                  <div>
                    <h3 className="mb-4 text-lg font-bold leading-snug text-primary">
                      {t(event.title)}
                    </h3>
                    <div className="space-y-2.5 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 shrink-0 text-secondary" />
                        <span>{t("موعد يحدد قريباً")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 shrink-0 text-secondary" />
                        <span>{t(event.place)}</span>
                      </div>
                    </div>
                  </div>

                  <Button className="mt-2 w-full font-bold" variant="secondary" asChild>
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