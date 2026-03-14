import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { to, subject, html } = body;

    if (!to || !subject || !html) {
      return Response.json(
        { error: "Missing required email fields" },
        { status: 400 }
      );
    }

    console.log("EMAIL PAYLOAD:", { to, subject });

    const { data, error } = await resend.emails.send({
      from: "Cosmi <onboarding@resend.dev>",
      to: [String(to)],
      subject: String(subject),
      html: String(html),
    });

    if (error) {
      console.error("Resend error:", error);
      return Response.json({ error }, { status: 500 });
    }

    return Response.json({ data });

  } catch (err) {
    console.error("API error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}