import bcrypt from "bcryptjs";
import pg from "pg";

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL;
const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
const name = process.env.BOOTSTRAP_ADMIN_NAME?.trim() || "مدير مبادرة تسامي";

if (!databaseUrl || !email || !password) {
  throw new Error(
    "Set DATABASE_URL, BOOTSTRAP_ADMIN_EMAIL, and BOOTSTRAP_ADMIN_PASSWORD.",
  );
}
if (password.length < 12 || Buffer.byteLength(password, "utf8") > 72) {
  throw new Error("The bootstrap password must be 12-72 UTF-8 bytes long.");
}

const departments = [
  ["القسم الإعلامي", "قسم الإعلام والتواصل في مبادرة تسامي."],
  ["القسم الأكاديمي", "القسم الأكاديمي في مبادرة تسامي."],
  ["قسم الورشات", "قسم الورشات والتدريب في مبادرة تسامي."],
  ["قسم التصميم", "قسم التصميم في مبادرة تسامي."],
  ["قسم تكنولوجيا المعلومات", "قسم تكنولوجيا المعلومات في مبادرة تسامي."],
];

const pool = new Pool({ connectionString: databaseUrl });

try {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const existingUsers = await client.query("SELECT id FROM users LIMIT 1");
    if (existingUsers.rowCount) {
      throw new Error(
        "The users table is not empty. Bootstrap is restricted to a new database.",
      );
    }

    for (const [departmentName, description] of departments) {
      await client.query(
        `INSERT INTO departments (name, description)
         SELECT $1, $2
         WHERE NOT EXISTS (
           SELECT 1 FROM departments WHERE name = $1
         )`,
        [departmentName, description],
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await client.query(
      `INSERT INTO users (name, email, password_hash, role, is_active)
       VALUES ($1, $2, $3, 'super_admin', TRUE)`,
      [name, email, passwordHash],
    );
    await client.query("COMMIT");
    console.log(`Created the initial administrator account for ${email}.`);
    console.log("Remove the bootstrap credentials from the environment now.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
} finally {
  await pool.end();
}
