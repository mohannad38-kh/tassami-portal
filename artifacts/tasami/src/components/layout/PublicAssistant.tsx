import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "wouter";
import { Bot, MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/hooks/use-language";

type AssistantAction = {
  label: string;
  href: string;
};

type AssistantMessage = {
  role: "assistant" | "user";
  content: string;
  actions?: AssistantAction[];
};

type LocalAnswer = {
  keywords: string[];
  ar: string;
  en: string;
  links: string[];
};

const JOIN_FORM_URL = "https://forms.gle/aykLb9rbAdK5mgYD9";

const SITE_LINKS = [
  { href: "/", ar: "الرئيسية", en: "Home" },
  { href: "/about", ar: "من نحن", en: "About Tasami" },
  { href: "/initiative", ar: "المبادرة", en: "The initiative" },
  { href: "/departments", ar: "الأقسام", en: "Departments" },
  { href: "/events", ar: "الفعاليات", en: "Events" },
  { href: "/workshops", ar: "الورشات", en: "Workshops" },
  { href: "/news", ar: "الأخبار", en: "News" },
  { href: "/board", ar: "المؤسسون والإدارة", en: "Founders and board" },
  { href: "/gallery", ar: "معرض الصور", en: "Gallery" },
  { href: "/partners", ar: "شركاء النجاح", en: "Partners" },
  { href: "/contact", ar: "تواصل معنا", en: "Contact" },
  { href: "/join", ar: "نموذج التسجيل المسبق", en: "Pre-registration form" },
  { href: "/login", ar: "تسجيل الدخول", en: "Sign in" },
  { href: "/forgot-password", ar: "استعادة كلمة المرور", en: "Reset password" },
  { href: "/portal", ar: "بوابة الأعضاء", en: "Member portal" },
  {
    href: "/portal/volunteer-hours",
    ar: "الساعات التطوعية",
    en: "Volunteer hours",
  },
  {
    href: "/portal/certificates",
    ar: "شهاداتي",
    en: "My certificates",
  },
  {
    href: "/certificate/verify",
    ar: "التحقق من شهادة",
    en: "Verify a certificate",
  },
] as const;

const LOCAL_ANSWERS: LocalAnswer[] = [
  {
    keywords: [
      "ما هي مبادرة تسامي",
      "ما هي تسامي",
      "شو هي تسامي",
      "عن تسامي",
      "من نحن",
      "about",
      "what is tasami",
      "who are you",
    ],
    ar: "تسامي مبادرة طلابية تطوعية تابعة لعمادة شؤون الطلبة في جامعة جدارا، وموثقة على منصة «نحن» الوطنية للتطوع. تهدف إلى تمكين الطلبة وتوجيه طاقاتهم لخدمة المجتمع.",
    en: "Tasami is a student volunteer initiative affiliated with the Deanship of Student Affairs at Jadara University and documented on the national Nahno volunteering platform. It empowers students and directs their efforts toward serving the community.",
    links: ["/about", "/initiative"],
  },
  {
    keywords: ["قيم", "رؤية", "رسالة", "أهداف", "اهداف", "vision", "mission", "goals", "values"],
    ar: "تركز تسامي على تمكين الطلبة، والتطوع البنّاء، والتكافل، والعمل بإخلاص، وتحقيق أثر مجتمعي مستدام.",
    en: "Tasami focuses on empowering students, constructive volunteering, solidarity, sincere service, and creating a lasting positive community impact.",
    links: ["/initiative", "/about"],
  },
  {
    keywords: [
      "انضم",
      "انضمام",
      "متطوع",
      "تطوع",
      "نموذج التسجيل",
      "التسجيل المسبق",
      "حساب جديد",
      "join",
      "volunteer",
      "register",
      "sign up",
    ],
    ar: `للانضمام، عبّئ أولاً نموذج التسجيل المسبق: ${JOIN_FORM_URL}، ثم ارجع لصفحة الانضمام وقدّم طلب حساب الموقع. يبقى الطلب بانتظار موافقة الإدارة قبل تفعيل الدخول.`,
    en: `To join, first complete the pre-registration form: ${JOIN_FORM_URL}. Then return to the join page and submit a website account request. The account stays pending until the administration approves it.`,
    links: ["/join"],
  },
  {
    keywords: [
      "تسجيل الدخول",
      "دخول",
      "login",
      "sign in",
      "account",
      "حسابي",
      "كلمة المرور",
      "password",
    ],
    ar: "إذا كان لديك حساب، سجّل الدخول بالبريد وكلمة المرور. حسابات المتطوعين الجديدة تبقى بانتظار موافقة الإدارة قبل السماح بالدخول.",
    en: "If you already have an account, sign in with your email and password. New volunteer accounts remain pending until approved by the administration.",
    links: ["/login", "/join"],
  },
  {
    keywords: [
      "نسيت كلمة المرور",
      "استعادة كلمة المرور",
      "تغيير كلمة المرور",
      "forgot password",
      "reset password",
      "change password",
    ],
    ar: "لاستعادة كلمة المرور، افتح صفحة «نسيت كلمة المرور» واتبع التعليمات المرسلة إلى بريدك الإلكتروني.",
    en: "To reset your password, open the forgot-password page and follow the instructions sent to your email.",
    links: ["/forgot-password"],
  },
  {
    keywords: [
      "قسم",
      "أقسام",
      "اقسام",
      "تخصص",
      "department",
      "departments",
      "team",
      "media",
      "design",
      "technology",
      "academic",
    ],
    ar: "تضم أقسام تسامي: الإعلامي، الأكاديمي، الورشات، التصميم، وتكنولوجيا المعلومات. تقدر تعرف تفاصيلها ورؤساءها في صفحة الأقسام.",
    en: "Tasami's departments are Media, Academic, Workshops, Design, and Information Technology. Visit the departments page for details and department heads.",
    links: ["/departments", "/join"],
  },
  {
    keywords: [
      "فعالية",
      "فعاليات",
      "نشاط",
      "أنشطة",
      "ورشة",
      "ورشات",
      "events",
      "activities",
      "workshop",
      "workshops",
    ],
    ar: "تجد مواعيد وتفاصيل الفعاليات والورشات المنشورة في صفحات الفعاليات والورشات. إذا لم تجد ما تبحث عنه، تابع الأخبار أو تواصل مع فريق تسامي.",
    en: "Published event and workshop dates and details are listed on the events and workshops pages. Check the news page or contact Tasami if you cannot find what you need.",
    links: ["/events", "/workshops", "/news"],
  },
  {
    keywords: ["خبر", "أخبار", "اخر الاخبار", "آخر الأخبار", "news", "announcement"],
    ar: "تظهر آخر أخبار وإعلانات تسامي في صفحة الأخبار.",
    en: "Tasami's latest news and announcements are available on the news page.",
    links: ["/news"],
  },
  {
    keywords: [
      "مؤسس",
      "المؤسسون",
      "مجلس الإدارة",
      "رئيس المبادرة",
      "board",
      "founder",
      "founders",
      "president",
    ],
    ar: "تعرض صفحة المؤسسين والإدارة أسماء مؤسسي مبادرة تسامي وأعضاء إدارتها.",
    en: "The founders and board page lists the founders of Tasami and its administration members.",
    links: ["/board"],
  },
  {
    keywords: [
      "تواصل",
      "اتصال",
      "هاتف",
      "واتساب",
      "بريد",
      "ايميل",
      "إيميل",
      "انستغرام",
      "instagram",
      "contact",
      "email",
      "phone",
      "whatsapp",
      "address",
      "العنوان",
    ],
    ar: "للتواصل: info@tasami.org، أو واتساب على ‎+962 7 8138 6264. موقع المبادرة في إربد، الأردن، وساعات العمل من الأحد إلى الخميس، 9 صباحاً–5 مساءً. إنستغرام: @tasami.jo.",
    en: "Contact Tasami at info@tasami.org or on WhatsApp at +962 7 8138 6264. The initiative is in Irbid, Jordan, and working hours are Sunday–Thursday, 9 AM–5 PM. Instagram: @tasami.jo.",
    links: ["/contact"],
  },
  {
    keywords: [
      "ساعات تطوعية",
      "ساعاتي",
      "رصيد ساعات",
      "volunteer hours",
      "service hours",
    ],
    ar: "تقدر تشوف ساعاتك التطوعية من بوابة الأعضاء بعد تسجيل الدخول.",
    en: "You can view your volunteer hours in the member portal after signing in.",
    links: ["/login", "/portal/volunteer-hours"],
  },
  {
    keywords: [
      "شهادة",
      "شهادتي",
      "شهادات",
      "تحقق من شهادة",
      "certificate",
      "certificates",
      "verify certificate",
    ],
    ar: "لشهاداتك، سجّل الدخول وافتح صفحة شهاداتي. للتحقق من شهادة، استخدم صفحة التحقق ورمز الشهادة.",
    en: "Sign in and open My Certificates to see your certificates. To verify a certificate, use the verification page and its code.",
    links: ["/login", "/portal/certificates", "/certificate/verify"],
  },
  {
    keywords: ["شريك", "شركاء", "شركاء النجاح", "partner", "partners"],
    ar: "تقدر تتعرف على شركاء النجاح في صفحة الشركاء.",
    en: "You can explore Tasami's partners on the partners page.",
    links: ["/partners"],
  },
  {
    keywords: ["صور", "معرض", "gallery", "photos", "pictures"],
    ar: "تجد صور أنشطة وفعاليات تسامي في معرض الصور.",
    en: "Photos from Tasami's activities and events are available in the gallery.",
    links: ["/gallery"],
  },
];

const QUICK_QUESTIONS = [
  { ar: "كيف أنضم لتسامي؟", en: "How do I join Tasami?" },
  { ar: "ما هي أقسام تسامي؟", en: "What are Tasami's departments?" },
  { ar: "كيف أتواصل معكم؟", en: "How can I contact Tasami?" },
];

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[.,!?؟،؛:()[\]{}"'`]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getLocalAnswer(question: string, isEnglish: boolean): AssistantMessage {
  const normalizedQuestion = normalizeText(question);
  const match = LOCAL_ANSWERS.map((answer) => ({
    answer,
    score: answer.keywords.reduce((score, keyword) => {
      const normalizedKeyword = normalizeText(keyword);
      return normalizedQuestion.includes(normalizedKeyword)
        ? score + (normalizedKeyword.includes(" ") ? 2 : 1)
        : score;
    }, 0),
  }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)[0]?.answer;

  if (match) {
    return {
      role: "assistant",
      content: isEnglish ? match.en : match.ar,
      actions: match.links.flatMap((href) => {
        const link = SITE_LINKS.find((item) => item.href === href);
        return link ? [{ href, label: isEnglish ? link.en : link.ar }] : [];
      }),
    };
  }

  return {
    role: "assistant",
    content: isEnglish
      ? "I don't have that detail in my local Tasami FAQ yet. Try the relevant site page or contact the Tasami team."
      : "ما عندي هذه المعلومة ضمن الأسئلة المحلية حالياً. جرّب الصفحة المناسبة أو تواصل مع فريق تسامي.",
    actions: [
      { href: "/about", label: isEnglish ? "About Tasami" : "عن تسامي" },
      { href: "/contact", label: isEnglish ? "Contact Tasami" : "تواصل مع تسامي" },
    ],
  };
}

function ActionLink({ action }: { action: AssistantAction }) {
  return (
    <Link
      href={action.href}
      className="inline-flex min-h-9 items-center justify-center rounded-md border border-primary/20 bg-background px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/5"
    >
      {action.label}
    </Link>
  );
}

export function PublicAssistant() {
  const { isEnglish, direction } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const sendQuestion = (value: string) => {
    const trimmedQuestion = value.trim();
    if (!trimmedQuestion) return;

    setMessages((current) => [
      ...current,
      { role: "user", content: trimmedQuestion },
      getLocalAnswer(trimmedQuestion, isEnglish),
    ]);
    setQuestion("");
    setIsOpen(true);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendQuestion(question);
  };

  return (
    <div
      className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-3 rtl:right-auto rtl:left-4"
      dir={direction}
    >
      {isOpen && (
        <section
          className="flex max-h-[min(70vh,34rem)] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl sm:w-96"
          aria-label={isEnglish ? "Tasami assistant" : "مساعد تسامي"}
        >
          <header className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                <Bot className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-bold">
                  {isEnglish ? "Tasami Assistant" : "مساعد تسامي"}
                </p>
                <p className="text-xs text-primary-foreground/75">
                  {isEnglish ? "Local website guide" : "مساعد محلي لمعلومات الموقع"}
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
              aria-label={isEnglish ? "Close assistant" : "إغلاق المساعد"}
              onClick={() => setIsOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </header>

          <div
            className="flex-1 space-y-3 overflow-y-auto p-4"
            aria-live="polite"
          >
            <p className="rounded-lg border border-secondary/30 bg-secondary/10 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
              {isEnglish
                ? "Answers use local Tasami website information. Your questions are not sent to an external AI service."
                : "الإجابات من معلومات موقع تسامي المحلية، وأسئلتك لا تُرسل إلى خدمة ذكاء اصطناعي خارجية."}
            </p>
            {messages.length === 0 && (
              <>
                <div className="flex justify-end">
                  <p className="max-w-[90%] rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2.5 text-sm leading-relaxed text-foreground">
                    {isEnglish
                      ? "Hi! Ask me about joining Tasami, its departments, events, or services."
                      : "أهلاً! اسألني عن الانضمام لتسامي أو أقسامها أو فعالياتها وخدماتها."}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {QUICK_QUESTIONS.map((item) => {
                    const label = isEnglish ? item.en : item.ar;
                    return (
                      <button
                        key={item.ar}
                        type="button"
                        onClick={() => sendQuestion(label)}
                        className="rounded-full border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex ${message.role === "user" ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "rounded-br-sm bg-primary text-primary-foreground"
                      : "rounded-bl-sm bg-muted text-foreground"
                  }`}
                >
                  <p>{message.content}</p>
                  {message.actions && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.actions.map((action) => (
                        <ActionLink
                          key={`${action.href}-${action.label}`}
                          action={action}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t p-3"
          >
            <Input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder={
                isEnglish ? "Ask about the Tasami site..." : "اسأل عن موقع تسامي..."
              }
              aria-label={isEnglish ? "Your question" : "سؤالك"}
              maxLength={500}
            />
            <Button
              type="submit"
              size="icon"
              aria-label={isEnglish ? "Send question" : "إرسال السؤال"}
              disabled={!question.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </section>
      )}

      <Button
        type="button"
        size="lg"
        className="h-14 w-14 rounded-full shadow-lg"
        aria-label={
          isOpen
            ? isEnglish
              ? "Close assistant"
              : "إغلاق المساعد"
            : isEnglish
              ? "Open assistant"
              : "اسأل مساعد تسامي"
        }
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
}
