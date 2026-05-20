import { Resend } from "resend";

let _resend: Resend;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

export async function sendNotification({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  try {
    await getResend().emails.send({
      from: "Proposals <onboarding@resend.dev>",
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error("Failed to send email:", error);
  }
}

export function proposalViewedEmail(proposalTitle: string, viewerInfo: string) {
  return {
    subject: `Your proposal "${proposalTitle}" was viewed`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0f172a;">Proposal Viewed</h2>
        <p style="color: #334155;">Your proposal <strong>"${proposalTitle}"</strong> was just viewed${viewerInfo ? ` by ${viewerInfo}` : ""}.</p>
        <p style="color: #64748b; font-size: 14px;">This is an automated notification from your proposal platform.</p>
      </div>
    `,
  };
}

export function proposalSignedEmail(
  proposalTitle: string,
  signerName: string
) {
  return {
    subject: `"${proposalTitle}" has been signed!`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0f172a;">Proposal Signed!</h2>
        <p style="color: #334155;">Great news! <strong>${signerName}</strong> has signed your proposal <strong>"${proposalTitle}"</strong>.</p>
        <p style="color: #334155;">The next step is payment. You'll receive another notification once payment is complete.</p>
        <p style="color: #64748b; font-size: 14px;">This is an automated notification from your proposal platform.</p>
      </div>
    `,
  };
}

export function paymentReceivedEmail(
  proposalTitle: string,
  amount: string,
  paymentType: string
) {
  return {
    subject: `Payment received for "${proposalTitle}"`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0f172a;">Payment Received!</h2>
        <p style="color: #334155;">You've received a ${paymentType} payment of <strong>${amount}</strong> for your proposal <strong>"${proposalTitle}"</strong>.</p>
        <p style="color: #64748b; font-size: 14px;">This is an automated notification from your proposal platform.</p>
      </div>
    `,
  };
}
