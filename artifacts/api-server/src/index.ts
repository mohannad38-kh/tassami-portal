import { db, usersTable } from "./lib/db"; // حسب مسار الـ db لديك
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

async function ensureSuperAdmin() {
  try {
    const adminEmail = "mohannadkhaloof38@gmail.com";
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, adminEmail));
    
    if (existing.length === 0) {
      // ضع كلمة المرور التي تفضلها هنا (مثلاً 12 حرفاً فما فوق)
      const hashedPassword = await bcrypt.hash("YourSecurePassword123", 10);
      
      await db.insert(usersTable).values({
        name: "مهند الخلوف",
        email: adminEmail,
        password: hashedPassword,
        role: "super_admin",
        status: "approved",
      });
      console.log("Super Admin account created successfully!");
    }
  } catch (err) {
    console.error("Failed to seed super admin:", err);
  }
}

// استدعي هذه الدالة عند بدء تشغيل السيرفر قبل استماع الـ port