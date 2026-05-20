import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: Request) {
  try {
    const supabase = await createServiceClient();

    const { proposalId, clientEmail, clientName } = await request.json();

    if (!proposalId || !clientEmail) {
      return NextResponse.json(
        { error: "Proposal ID and client email are required" },
        { status: 400 }
      );
    }

    // Get proposal
    const { data: proposal } = await supabase
      .from("proposals")
      .select("*")
      .eq("id", proposalId)
      .single();

    if (!proposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      );
    }

    // Get business profile for sender name
    const { data: profile } = await supabase
      .from("business_profiles")
      .select("company_name")
      .limit(1)
      .single();

    const proposalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/p/${proposalId}`;
    const companyName = profile?.company_name || "Our Team";

    // Send email using Resend
    console.log("Sending email to:", clientEmail);
    console.log("From:", process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev");

    const resend = new Resend(process.env.RESEND_API_KEY);
    const emailResult = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: clientEmail,
      subject: `${companyName} - Your Proposal: ${proposal.title}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f9fafb; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
              <h1 style="margin: 0 0 10px 0; font-size: 24px; font-weight: bold; color: #111827;">
                ${clientName ? `Hi ${clientName},` : "Hello,"}
              </h1>
              <p style="margin: 0; font-size: 16px; color: #6b7280;">
                Thank you for your interest. We've prepared a detailed proposal for you.
              </p>
            </div>

            <div style="background-color: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="margin: 0 0 15px 0; font-size: 20px; font-weight: 600; color: #111827;">
                ${proposal.title}
              </h2>
              <p style="margin: 0 0 20px 0; color: #6b7280;">
                Click the button below to view your personalized proposal.
              </p>
              <a href="${proposalUrl}" style="display: inline-block; background-color: #111827; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                View Proposal
              </a>
            </div>

            <div style="text-align: center; color: #9ca3af; font-size: 14px;">
              <p style="margin: 0;">
                Sent by ${companyName}
              </p>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Resend result:", JSON.stringify(emailResult, null, 2));

    if (emailResult.error) {
      console.error("Resend error:", emailResult.error);
      return NextResponse.json(
        { error: `Failed to send email: ${emailResult.error.message}` },
        { status: 500 }
      );
    }

    // Update proposal client_email if not set
    if (!proposal.client_email) {
      await supabase
        .from("proposals")
        .update({ client_email: clientEmail })
        .eq("id", proposalId);
    }

    // Update status to sent if it's still draft
    if (proposal.status === "draft") {
      await supabase
        .from("proposals")
        .update({ status: "sent" })
        .eq("id", proposalId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Send proposal error:", error);
    return NextResponse.json(
      { error: "Failed to send proposal" },
      { status: 500 }
    );
  }
}
