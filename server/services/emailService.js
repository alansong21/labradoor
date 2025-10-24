function sendVerificationLink({ email, url, type }) {
  console.log(`[${type}] ${email} -> ${url}`);
}

module.exports = { sendVerificationLink };
