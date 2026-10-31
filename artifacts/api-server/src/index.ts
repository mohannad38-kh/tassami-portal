import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import app from "./app";

// دالة إنشاء أو تحديث حساب الـ Super Admin بالقوة عند كل إقلاع للسيرفر
async function ensureSuperAdmin() {
  try {
    const adminEmail = "mohannadkhaloof38@gmail.com";
    const hashedPassword = await bcrypt.hash("121Aqra6$", 10);
    
    // التحقق مما إذا كان المستخدم موجوداً مسبقاً
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, adminEmail));
    
    if (existing.length === 0) {
      // إدراج الحساب إذا لم يكن موجوداً
      await db.insert(usersTable).values({
        name: "مهند الخلوف",
        email: adminEmail,
        passwordHash: hashedPassword,
        role: "super_admin",
      });
      console.log("Super Admin account created successfully!");
    } else {
      // تحديث كلمة المرور والصلاحيات بالقوة للتأكد من مطابقتها ودخولك بدون مشاكل
      await db.update(usersTable)
        .set({
          passwordHash: hashedPassword,
          role: "super_admin",
        })
        .where(eq(usersTable.email, adminEmail));
      console.log("Super Admin account updated & verified successfully!");
    }
  } catch (err) {
    console.error("Failed to seed/update super admin:", err);
  }
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Server listening on port ${PORT}`);
  await ensureSuperAdmin();
});