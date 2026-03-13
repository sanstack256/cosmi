export function reminderEmail(
  clientName: string,
  invoiceNumber: string,
  amount: string
) {
  return `
    <h2>Payment Reminder</h2>

    <p>Hi ${clientName},</p>

    <p>This is a friendly reminder that invoice 
    <strong>${invoiceNumber}</strong> for 
    <strong>${amount}</strong> is due soon.</p>

    <p>Please complete the payment at your earliest convenience.</p>

    <p>Thank you,<br/>
    Cosmi</p>
  `;
}