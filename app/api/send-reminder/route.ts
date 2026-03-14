import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { to, subject, html, replyTo } = body;

    if (!to || !subject || !html) {
      return Response.json(
        { error: "Missing required fields: to, subject, html" },
        { status: 400 }
      );
    }

    const { data, error } = await resend.emails.send({
      from: "Cosmi <onboarding@resend.dev>",
      to,
      subject,
      html,
      replyTo,
    });

    if (error) {
      return Response.json({ error }, { status: 500 });
    }

    return Response.json({ data });

  } catch (err) {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}