import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Edit2, X } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

type SectionType = 
  | "events" 
  | "news" 
  | "workshops" 
  | "partners" 
  | "members" 
  | "join_requests" 
  | "volunteer_hours" 
  | "tasks"
  | "projects"; // تم إضافة قسم المشاريع هنا

interface Item {
  id: number;
  title?: string;
  name?: string;
  email?: string;
  place?: string;
  content?: string;
  description?: string;
  hours?: number;
  status?: string;
  memberId?: number;
}

export default function ComprehensiveAdminManager() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<SectionType>("events");
  
  const [items, setItems] = useState<Item[]>([]);
  const [inputField1, setInputField1] = useState(""); 
  const [inputField2, setInputField2] = useState(""); 
  const [inputField3, setInputField3] = useState(""); 
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // جلب البيانات مع التأكد من حمايتها ومعالجة استجابة الخادم
  const fetchData = async () => {
    try {
      const res = await fetch(`/api/${activeTab}`);
      if (res.ok) {
        const data = await res.json();
        // ضمان أن البيانات المرتجعة عبارة عن مصفوفة لتجنب انهيار التطبيق
        setItems(Array.isArray(data) ? data : (data.items || []));
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error(`Failed to load ${activeTab}`, error);
      setItems([]);
    }
  };

  useEffect(() => {
    void fetchData();
    setInputField1("");
    setInputField2("");
    setInputField3("");
    setEditingId(null);
  }, [activeTab]);

  // حفظ البيانات (إضافة أو تعديل)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputField1.trim()) return;

    setLoading(true);
    const endpoint = editingId ? `/api/${activeTab}/${editingId}` : `/api/${activeTab}`;
    const method = editingId ? "PUT" : "POST";

    let bodyData: any = {};
    if (activeTab === "events") {
      bodyData = { title: inputField1, place: inputField2 || "قريباً" };
    } else if (activeTab === "news") {
      bodyData = { title: inputField1, content: inputField2 };
    } else if (activeTab === "workshops") {
      bodyData = { title: inputField1, description: inputField2 };
    } else if (activeTab === "partners") {
      bodyData = { name: inputField1, description: inputField2 };
    } else if (activeTab === "members") {
      bodyData = { name: inputField1, email: inputField2 };
    } else if (activeTab === "tasks") {
      bodyData = { title: inputField1, description: inputField2, status: inputField3 || "pending" };
    } else if (activeTab === "projects") {
      bodyData = { title: inputField1, description: inputField2, status: inputField3 || "active" };
    } else if (activeTab === "volunteer_hours") {
      bodyData = { memberId: Number(inputField1), hours: Number(inputField2) };
    } else {
      bodyData = { title: inputField1, description: inputField2 };
    }

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      if (res.ok) {
        setInputField1("");
        setInputField2("");
        setInputField3("");
        setEditingId(null);
        void fetchData();
      }
    } catch (error) {
      console.error("Operation failed", error);
    } finally {
      setLoading(false);
    }
  };

  // تعبئة الحقول للتعديل
  const handleEdit = (item: Item) => {
    setEditingId(item.id);
    setInputField1(item.title || item.name || String(item.memberId || ""));
    setInputField2(item.place || item.content || item.description || String(item.hours || ""));
    setInputField3(item.email || item.status || "");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setInputField1("");
    setInputField2("");
    setInputField3("");
  };

  // حذف عنصر
  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من الحذف؟")) return;
    try {
      const res = await fetch(`/api/${activeTab}/${id}`, { method: "DELETE" });
      if (res.ok) {
        void fetchData();
      }
    } catch (error) {
      console.error("Failed to delete", error);
    }
  };

  const tabTitles: Record<SectionType, string> = {
    events: "الفعاليات",
    news: "الأخبار",
    workshops: "الورش التدريبية",
    partners: "الشركاء",
    members: "الأعضاء",
    join_requests: "طلبات الانضمام",
    volunteer_hours: "ساعات التطوع",
    tasks: "المهام",
    projects: "المشاريع", // تمت إضافة العنوان العربي للقسم الجديد
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary mb-2">لوحة التحكم الشاملة والموحدة</h1>
        <p className="text-muted-foreground">التحكم الكامل والآمن في كافة بيانات وجداول الموقع من مكان واحد.</p>
      </div>

      {/* أزرار التنقل بين الأقسام */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(Object.keys(tabTitles) as SectionType[]).map((tab) => (
          <Button 
            key={tab}
            variant={activeTab === tab ? "default" : "outline"} 
            onClick={() => setActiveTab(tab)}
            className="text-sm"
          >
            {tabTitles[tab]}
          </Button>
        ))}
      </div>

      {/* نموذج الإضافة والتعديل الديناميكي */}
      <Card className="mb-8 shadow-sm border-border/50">
        <CardHeader>
          <CardTitle>
            {editingId ? `تعديل عناصر ${tabTitles[activeTab]}` : `إضافة جديد إلى ${tabTitles[activeTab]}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder={activeTab === "partners" || activeTab === "members" ? "الاسم" : "العنوان الأساسي"}
              value={inputField1}
              onChange={(e) => setInputField1(e.target.value)}
              required
            />
            <Input
              placeholder={activeTab === "volunteer_hours" ? "عدد الساعات" : "الوصف أو التفاصيل"}
              value={inputField2}
              onChange={(e) => setInputField2(e.target.value)}
            />
            {(activeTab === "tasks" || activeTab === "projects") && (
              <Input
                placeholder="الحالة (pending/active/completed)"
                value={inputField3}
                onChange={(e) => setInputField3(e.target.value)}
              />
            )}
            <div className="flex gap-2">
              <Button type="submit" disabled={loading} className="gap-2">
                {editingId ? <Edit2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editingId ? "حفظ التعديل" : "إضافة"}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={handleCancelEdit}>
                  <X className="h-4 w-4" /> إلغاء
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* عرض البيانات الحالية مع الحماية ضد القيم غير المصفوفة */}
      <Card className="shadow-sm border-border/50">
        <CardHeader>
          <CardTitle>سجلات {tabTitles[activeTab]}</CardTitle>
        </CardHeader>
        <CardContent>
          {!Array.isArray(items) || items.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">لا توجد بيانات مسجلة في هذا القسم حالياً.</p>
          ) : (
            <div className="space-y-4">
              {items.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-xl bg-card">
                  <div>
                    <h3 className="font-bold text-lg text-primary">{item.title || item.name || `عنصر #${item.id}`}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.place || item.content || item.description || item.email || `قيمة البيانات: ${item.hours || 'غير متوفر'}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => handleEdit(item)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}