const { Resend } = require("resend");

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const DOMAIN = process.env.DOMAIN || "resend.dev" //needs to be set
const FROM = `Labradoor <verification@${DOMAIN}>`; //change?


/*[dev start]
for dev purposes

set SEND_VERIFICATION_EMAIL in env to "false" to disable email sending
ensure that in production, SEND_VERIFICATION_EMAIL is not "false", or remove this check entirely
*/
const SEND_EMAIL = process.env.SEND_VERIFICATION_EMAIL !== "false";
//[dev end]

function createResendClient() {
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set in the environment");
  }
  const resend = new Resend(RESEND_API_KEY);
  return resend;
}

async function sendMessage({ to, subject, text, html }) {
  const resend = createResendClient();
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: Array.isArray(to) ? to : [to],
    subject: subject,
    text: text,
    ...(html ? { html } : {})
  });

  if (error) {
    console.log(error);
  }
  
  console.log(data);
};


function sendVerificationLink({ email, url, type }) {
  console.log(`[${type}] ${email} -> ${url}`);
  if(!SEND_EMAIL) {
    console.log("SEND_EMAIL is false; not sending email.");
    return;
  }
  const subject = `[${type}] Please verify your email`;
  const text = `Click this link to verify your account: ${url}`;
  sendMessage({ to: email, subject, text });
}

module.exports = { sendVerificationLink };
