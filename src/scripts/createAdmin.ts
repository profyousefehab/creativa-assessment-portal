import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const apiKey = process.env.VITE_FIREBASE_API_KEY || 'AIzaSyDNpaCx0RBWmoL0qEjZIlBr-31VtzcfLkc';
const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'assessmentcreativa';

async function createAdmin() {
  const args = process.argv.slice(2);
  const email = args[0] || 'admin@creativa.gov.eg';
  const password = args[1] || 'CreativaAdmin2026!';

  console.log(`\n======================================================`);
  console.log(`[AUTH] Creativa Assessment Portal — Admin Account Creator`);
  console.log(`======================================================`);
  console.log(`Target Project: ${projectId}`);
  console.log(`Admin Email:    ${email}`);
  console.log(`Password:       ${password.replace(/./g, '*')}`);
  console.log(`------------------------------------------------------`);

  try {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    });

    const data = await res.json();

    if (data.error) {
      const errMsg = data.error.message;
      if (errMsg === 'CONFIGURATION_NOT_FOUND') {
        console.error(`\n[ERROR] Firebase Authentication Email/Password provider is not yet enabled.`);
        console.error(`\n[NOTE] Please enable it in Firebase Console:`);
        console.error(`   https://console.firebase.google.com/project/${projectId}/authentication/providers`);
        console.error(`   1. Click "Email/Password"`);
        console.error(`   2. Toggle "Enable" and click Save.`);
        console.error(`   3. Re-run this command: npx tsx src/scripts/createAdmin.ts ${email} <password>\n`);
      } else if (errMsg === 'EMAIL_EXISTS') {
        console.log(`\n[INFO] The account "${email}" already exists in Firebase Authentication!`);
        console.log(`You can sign in directly at the login screen using this email and your password.\n`);
      } else {
        console.error(`\n[ERROR] Firebase Auth Error:`, errMsg);
      }
      return;
    }

    console.log(`\n[SUCCESS] Admin account created successfully in Firebase Auth!`);
    console.log(`UID:   ${data.localId}`);
    console.log(`Email: ${data.email}`);
    console.log(`\nYou can now log in at: http://localhost:3001/\n`);
  } catch (err: any) {
    console.error(`\n[ERROR] Unexpected error:`, err?.message || err);
  }
}

createAdmin();
