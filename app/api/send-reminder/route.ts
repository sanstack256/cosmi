import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { subject, html } = body;

    if (!subject || !html) {
      return Response.json(
        { error: "Missing required email fields" },
        { status: 400 }
      );
    }

    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev",

      // 🔴 PUT YOUR EMAIL HERE
      to: ["nssan2007@gmail.com"],

      subject: String(subject),
      html: String(html),
    });

    if (error) {
      console.error("Resend error:", error);
      return Response.json({ error }, { status: 500 });
    }

    return Response.json({ success: true, data });

  } catch (err) {
    console.error("API error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}