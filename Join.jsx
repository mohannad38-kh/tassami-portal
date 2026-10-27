import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function Join() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const handleJoin = async (e) => {
    e.preventDefault();

    const { error } = await supabase.from("requests").insert([
      {
        name: name,
        email: email,
        phone: phone,
        message: message,
      },
    ]);

    if (error) {
      alert("حدث خطأ: " + error.message);
    } else {
      alert("تم إرسال طلبك بنجاح!");
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>نموذج الانضمام</h1>
      <form
        onSubmit={handleJoin}
        style={{ display: "flex", flexDirection: "column", gap: "10px" }}
      >
        <input
          type="text"
          placeholder="الاسم الثلاثي"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="البريد الإلكتروني"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="رقم الجوال"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <textarea
          placeholder="لماذا ترغب بالانضمام إلينا؟"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button type="submit">إرسال طلب الانضمام</button>
      </form>
    </div>
  );
}
