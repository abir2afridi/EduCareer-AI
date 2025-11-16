/*
 * Standalone script to assign the Firebase Auth custom claim { role: "admin" }
 * to the specified user. Run with: node setAdminClaim.cjs
 */

const admin = require("firebase-admin");

const SERVICE_ACCOUNT_PATH = "./educareer-ai-firebase-adminsdk-fbsvc-b9bf106481.json";
const TARGET_UID = "iGTkV2ygpuek86HlM2EXZE8znP62";
const TARGET_CLAIMS = { role: "admin" };

async function main() {
  try {
    const serviceAccount = require(SERVICE_ACCOUNT_PATH);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (initializationError) {
    console.error("❌ Failed to initialize Firebase Admin SDK:", initializationError.message || initializationError);
    console.error("   • Ensure the service account JSON exists at:", SERVICE_ACCOUNT_PATH);
    process.exit(1);
  }

  try {
    await admin.auth().setCustomUserClaims(TARGET_UID, TARGET_CLAIMS);
    console.log("✅ Successfully applied custom claims", TARGET_CLAIMS, "to UID", TARGET_UID);
    console.log("ℹ️  Ask the user to reauthenticate or refresh their ID token to see the new role.");
    process.exit(0);
  } catch (claimError) {
    console.error("❌ Failed to set admin claim:", claimError.message || claimError);
    console.error("   • Double-check that the UID is correct and your service account has the required permissions.");
    process.exit(1);
  }
}

void main();
