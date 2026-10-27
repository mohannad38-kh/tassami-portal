import { db, usersTable, departmentsTable, membersTable, eventsTable, workshopsTable, newsTable, announcementsTable, partnersTable, tasksTable, meetingsTable, activityLogTable } from "@workspace/db";
import bcryptjs from "bcryptjs";

async function seed() {
  console.log("Seeding database...");

  // Create departments
  const deptData = [
    { name: "قسم التطوع المجتمعي", description: "يُعنى بتنظيم الأنشطة التطوعية المجتمعية وتقديم الدعم للفئات المستهدفة" },
    { name: "قسم التدريب والتطوير", description: "يُنظّم الدورات التدريبية وورش العمل لرفع كفاءات الأعضاء" },
    { name: "قسم الإعلام والتواصل", description: "يتولى التغطية الإعلامية وإدارة حسابات التواصل الاجتماعي" },
    { name: "قسم العلاقات العامة", description: "يُدير الشراكات الاستراتيجية ويمثل المبادرة في المحافل الرسمية" },
    { name: "قسم الأحداث والفعاليات", description: "يُخطّط وينفّذ الفعاليات والمناسبات الكبرى للمبادرة" },
    { name: "قسم التقنية والمعلوماتية", description: "يدعم البنية التقنية ويطور الحلول الرقمية للمبادرة" },
    { name: "قسم الشؤون المالية", description: "يُشرف على الميزانيات والتقارير المالية للمبادرة" },
    { name: "قسم الإبداع والفنون", description: "يُنتج المحتوى الإبداعي والبصري للمبادرة" },
    { name: "قسم البحث والتطوير", description: "يُجري الدراسات ويُطوّر منهجيات عمل المبادرة" },
  ];

  const departments = await db.insert(departmentsTable).values(deptData).returning().onConflictDoNothing();
  console.log(`Created ${departments.length} departments`);

  // Create users
  const passwordHash = await bcryptjs.hash("admin123", 10);
  const usersData = [
    { name: "أحمد محمد الأمين", email: "admin@tasami.org", passwordHash, role: "super_admin", phone: "0501234567" },
    { name: "فاطمة علي السالم", email: "president@tasami.org", passwordHash, role: "president", phone: "0509876543" },
    { name: "عمر خالد النجم", email: "vp@tasami.org", passwordHash, role: "vice_president", phone: "0505556666" },
    { name: "نورة سعد القحطاني", email: "secretary@tasami.org", passwordHash, role: "secretary", phone: "0507778888" },
    { name: "عبدالله يوسف البكر", email: "head1@tasami.org", passwordHash, role: "dept_head", phone: "0503334444", departmentId: 1 },
    { name: "منيرة أحمد الزهراني", email: "member1@tasami.org", passwordHash, role: "member", phone: "0502223333", departmentId: 1 },
    { name: "تركي فيصل العمري", email: "member2@tasami.org", passwordHash, role: "member", phone: "0501112222", departmentId: 2 },
    { name: "ريم عبدالعزيز الدوسري", email: "member3@tasami.org", passwordHash, role: "member", phone: "0508889999", departmentId: 3 },
  ];

  const users = await db.insert(usersTable).values(usersData).returning().onConflictDoNothing();
  console.log(`Created ${users.length} users`);

  if (users.length === 0) {
    console.log("Users already exist, skipping remaining seed...");
    return;
  }

  // Find member users
  const memberUsers = users.filter((u) => ["member", "dept_head"].includes(u.role));

  // Create members
  for (const user of memberUsers) {
    const membershipNumber = `TSM-${new Date().getFullYear()}-${String(user.id).padStart(4, "0")}`;
    await db.insert(membersTable).values({
      userId: user.id,
      membershipNumber,
      status: "active",
      departmentId: user.departmentId ?? null,
      qrCode: `TSM-QR-${membershipNumber}`,
    }).onConflictDoNothing();
  }

  // Create events
  const eventsData = [
    {
      title: "يوم التطوع الوطني",
      description: "يوم تطوعي شامل بمشاركة جميع أعضاء المبادرة في خدمة المجتمع المحلي وتنظيف المرافق العامة",
      eventDate: new Date("2026-07-15"),
      location: "الرياض - حديقة الملك عبدالله",
      capacity: 200,
      status: "upcoming",
    },
    {
      title: "ملتقى القيادات الشبابية",
      description: "ملتقى سنوي يجمع قادة الشباب المتطوعين لتبادل الخبرات ووضع خطط المرحلة القادمة",
      eventDate: new Date("2026-08-20"),
      location: "فندق ماريوت الرياض",
      capacity: 150,
      status: "upcoming",
    },
    {
      title: "مبادرة تشجير المدارس",
      description: "زراعة 500 شجرة في مدارس الحي لتعزيز الوعي البيئي وتجميل البيئة المدرسية",
      eventDate: new Date("2026-06-05"),
      location: "مدارس حي النخيل - الرياض",
      capacity: 80,
      status: "completed",
    },
    {
      title: "كرنفال العلوم للأطفال",
      description: "فعالية ترفيهية تعليمية للأطفال تشمل تجارب علمية وأنشطة إبداعية بإشراف المتطوعين",
      eventDate: new Date("2026-09-10"),
      location: "مركز الملك عبدالعزيز الثقافي",
      capacity: 300,
      status: "upcoming",
    },
  ];
  await db.insert(eventsTable).values(eventsData).onConflictDoNothing();

  // Create workshops
  const workshopsData = [
    {
      title: "مهارات القيادة والتأثير",
      description: "ورشة تطوير مهارات القيادة الفعّالة والتأثير الإيجابي في الفريق",
      workshopDate: new Date("2026-07-25"),
      location: "قاعة الأمير سلطان - الرياض",
      capacity: 40,
      status: "upcoming",
    },
    {
      title: "إدارة المشاريع التطوعية",
      description: "تأهيل المتطوعين لإدارة المشاريع بكفاءة باستخدام أفضل الأساليب العالمية",
      workshopDate: new Date("2026-08-05"),
      location: "مركز التدريب - غرفة تجارة الرياض",
      capacity: 30,
      status: "upcoming",
    },
    {
      title: "التصوير والإنتاج الإعلامي",
      description: "تدريب عملي على التصوير الاحترافي وإنتاج المحتوى الرقمي للمبادرات التطوعية",
      workshopDate: new Date("2026-06-20"),
      location: "استوديو الإبداع - حي العليا",
      capacity: 25,
      status: "completed",
    },
  ];
  await db.insert(workshopsTable).values(workshopsData).onConflictDoNothing();

  // Create news
  const newsData = [
    {
      title: "تسامي تحصل على جائزة أفضل مبادرة تطوعية 2026",
      body: "في احتفالية مبهجة أُقيمت في قاعة الأمير سلمان بالرياض، تسلّمت مبادرة تسامي جائزة أفضل مبادرة تطوعية على مستوى المملكة لعام 2026، وذلك تقديراً للجهود المتميزة التي أثمرت عن مئات الساعات التطوعية وآلاف الأعضاء المخلصين.",
      authorId: users[0]?.id,
      publishedAt: new Date("2026-06-10"),
    },
    {
      title: "انطلاق برنامج تسامي لتمكين الشباب الصيفي",
      body: "يُطلق قسم التدريب والتطوير في مبادرة تسامي برنامج التمكين الشبابي الصيفي، الذي يستهدف تأهيل 200 شاب وفتاة خلال شهرَي يوليو وأغسطس من خلال ورش عمل متخصصة ودورات مكثفة في مهارات القيادة والريادة.",
      authorId: users[1]?.id,
      publishedAt: new Date("2026-06-15"),
    },
    {
      title: "شراكة استراتيجية مع جامعة الملك سعود",
      body: "أبرمت مبادرة تسامي اتفاقية شراكة استراتيجية مع جامعة الملك سعود تُتيح لأعضاء المبادرة الاستفادة من مرافق الجامعة وبرامجها التدريبية، كما تفتح المجال أمام طلاب الجامعة للانضمام إلى برامج تطوع تسامي والحصول على ساعات معتمدة.",
      authorId: users[0]?.id,
      publishedAt: new Date("2026-06-20"),
    },
  ];
  await db.insert(newsTable).values(newsData).onConflictDoNothing();

  // Create announcements
  await db.insert(announcementsTable).values([
    {
      title: "تحديث: موعد اجتماع مجلس الإدارة",
      body: "يُعلم جميع أعضاء مجلس الإدارة بأن الاجتماع الفصلي القادم سيُعقد يوم الأربعاء الموافق 2026/7/8 في الساعة العاشرة صباحاً بمقر المبادرة الرئيسي. الحضور إلزامي لجميع رؤساء الأقسام.",
      targetRole: "secretary",
      authorId: users[0]?.id,
    },
    {
      title: "نموذج التسجيل للفعاليات الصيفية متاح الآن",
      body: "أصبح نموذج التسجيل في فعاليات وبرامج تسامي الصيفية متاحاً عبر البوابة الإلكترونية. يُرجى من جميع الأعضاء الراغبين في المشاركة تسجيل بياناتهم قبل تاريخ 2026/7/1.",
      targetRole: "member",
      authorId: users[3]?.id,
    },
  ]).onConflictDoNothing();

  // Create partners
  await db.insert(partnersTable).values([
    { name: "جامعة الملك سعود", partnerType: "أكاديمي", website: "https://ksu.edu.sa" },
    { name: "وزارة الموارد البشرية", partnerType: "حكومي", website: "https://hrsd.gov.sa" },
    { name: "مؤسسة الملك عبدالعزيز للحوار", partnerType: "مجتمعي", website: "https://kacnd.org" },
    { name: "شركة أرامكو السعودية", partnerType: "قطاع خاص", website: "https://aramco.com" },
    { name: "هيئة الهلال الأحمر السعودي", partnerType: "إنساني", website: "https://srca.org.sa" },
    { name: "نادي الهلال الاجتماعي", partnerType: "رياضي مجتمعي", website: "https://alhilal.com" },
  ]).onConflictDoNothing();

  // Create tasks
  await db.insert(tasksTable).values([
    {
      title: "إعداد تقرير الربع الثالث",
      description: "إعداد التقرير التفصيلي لنشاطات المبادرة خلال الربع الثالث من العام 2026",
      assignedTo: users[3]?.id,
      createdBy: users[0]?.id,
      dueDate: "2026-07-31",
      status: "in_progress",
      progress: 60,
      priority: "high",
    },
    {
      title: "تحديث قاعدة بيانات الأعضاء",
      description: "مراجعة وتحديث بيانات الأعضاء والتحقق من صحة معلومات التواصل",
      assignedTo: users[4]?.id,
      createdBy: users[0]?.id,
      dueDate: "2026-07-15",
      status: "pending",
      progress: 0,
      priority: "medium",
    },
    {
      title: "التحضير لفعالية يوم التطوع الوطني",
      description: "تنسيق اللوجستيات والتواصل مع الجهات المضيفة والإشراف على التسجيلات",
      assignedTo: users[4]?.id,
      createdBy: users[3]?.id,
      dueDate: "2026-07-10",
      status: "in_progress",
      progress: 45,
      priority: "high",
    },
    {
      title: "إنتاج مقاطع فيديو للتوعية",
      description: "إنتاج 3 مقاطع فيديو قصيرة للترويج لأنشطة المبادرة على منصات التواصل الاجتماعي",
      assignedTo: users[7]?.id,
      createdBy: users[3]?.id,
      dueDate: "2026-08-01",
      status: "pending",
      progress: 0,
      priority: "low",
    },
  ]).onConflictDoNothing();

  // Create meetings
  await db.insert(meetingsTable).values([
    {
      title: "اجتماع مجلس الإدارة الفصلي",
      meetingDate: new Date("2026-07-08T10:00:00Z"),
      location: "مقر تسامي الرئيسي - الرياض",
      agenda: "مراجعة الإنجازات، مناقشة خطة الربع القادم، الموافقة على الميزانية",
      status: "scheduled",
    },
    {
      title: "اجتماع رؤساء الأقسام",
      meetingDate: new Date("2026-06-25T14:00:00Z"),
      location: "قاعة الاجتماعات - مقر تسامي",
      agenda: "متابعة تنفيذ مشاريع الأقسام، رفع تقارير التقدم",
      minutes: "استعرض كل رئيس قسم تقرير التقدم المحرز، وتم الاتفاق على جدول زمني للمراجعة الأسبوعية",
      decisions: "اعتماد الجدول الزمني المقترح، توزيع المهام على الأقسام",
      status: "completed",
    },
  ]).onConflictDoNothing();

  // Create activity log
  await db.insert(activityLogTable).values([
    { type: "member_joined", description: "انضم عبدالله يوسف البكر إلى قسم التطوع المجتمعي", actorName: "النظام" },
    { type: "event_created", description: "تم إنشاء فعالية: يوم التطوع الوطني", actorName: "أحمد محمد الأمين" },
    { type: "news_published", description: "نُشر خبر: تسامي تحصل على جائزة أفضل مبادرة تطوعية 2026", actorName: "أحمد محمد الأمين" },
    { type: "workshop_created", description: "تم إنشاء ورشة: مهارات القيادة والتأثير", actorName: "نورة سعد القحطاني" },
    { type: "member_approved", description: "تمت الموافقة على عضوية منيرة أحمد الزهراني", actorName: "نورة سعد القحطاني" },
    { type: "partnership_signed", description: "تم إبرام شراكة استراتيجية مع جامعة الملك سعود", actorName: "فاطمة علي السالم" },
  ]).onConflictDoNothing();

  console.log("Seeding complete!");
}

seed().catch(console.error).finally(() => process.exit(0));
