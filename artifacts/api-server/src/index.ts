import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import app from "./app";

// دالة إنشاء حساب الـ Super Admin تلقائياً
async function ensureSuperAdmin() {
  try {
    const adminEmail = "mohannadkhaloof38@gmail.com";
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, adminEmail));
    
    if (existing.length === 0) {
      // كلمة المرور التي ستستخدمها لتسجيل الدخول
      const hashedPassword = await bcrypt.hash("121Aqra6$", 10);
      
      await db.insert(usersTable).values({
        name: "مهند الخلوف",
        email: adminEmail,
        passwordHash: hashedPassword,
        role: "super_admin",
        status: "approved",
      });
      console.log("Super Admin account created successfully!");
    }
  } catch (err) {
    console.error("Failed to seed super admin:", err);
  }
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Server listening on port ${PORT}`);
  await ensureSuperAdmin();
});