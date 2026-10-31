
import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function Join() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleJoin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Basic phone number validation
    if (phone && !/^[0-9]+$/.test(phone)) {
      setError("الرجاء إدخال رقم جوال صحيح (أرقام فقط).");
      setLoading(false);
      return;
    }

    const { error: supabaseError } = await supabase.from("requests").insert([
      {
        name: name,
        email: email,
        phone: phone,
        message: message,
      },
    ]);

    if (supabaseError) {
      setError("حدث خطأ أثناء إرسال طلبك: " + supabaseError.message);
    } else {
      setSuccess(true);
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "500px", margin: "0 auto", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ textAlign: "center", color: "#333" }}>نموذج الانضمام</h1>
      <form
        onSubmit={handleJoin}
        style={{ display: "flex", flexDirection: "column", gap: "15px", border: "1px solid #ddd", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}
      >
        <input
          type="text"
          placeholder="الاسم الثلاثي"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{ padding: "10px", borderRadius: "4px", border: "1px solid #ccc", fontSize: "16px" }}
        />
        <input
          type="email"
          placeholder="البريد الإلكتروني"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: "10px", borderRadius: "4px", border: "1px solid #ccc", fontSize: "16px" }}
        />
        <input
          type="text"
          placeholder="رقم الجوال (اختياري)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={{ padding: "10px", borderRadius: "4px", border: "1px solid #ccc", fontSize: "16px" }}
        />
        <textarea
          placeholder="لماذا ترغب بالانضمام إلينا؟ (اختياري)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows="5"
          style={{ padding: "10px", borderRadius: "4px", border: "1px solid #ccc", fontSize: "16px", resize: "vertical" }}
        />
        <button type="submit" disabled={loading} style={{ padding: "10px 15px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "4px", fontSize: "16px", cursor: loading ? "not-allowed" : "pointer" }}>
          {loading ? "جاري الإرسال..." : "إرسال طلب الانضمام"}
        </button>
      </form>
      {error && <p style={{ color: "red", marginTop: "10px", textAlign: "center" }}>{error}</p>}
      {success && <p style={{ color: "green", marginTop: "10px", textAlign: "center" }}>تم إرسال طلبك بنجاح!</p>}
    </div>
  );
}
