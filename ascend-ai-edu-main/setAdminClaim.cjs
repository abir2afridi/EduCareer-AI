const admin = require("firebase-admin");

try {
  const serviceAccount = require("./serviceAccountKey.json");

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} catch (error) {
  console.error("❌ Failed to initialize Firebase Admin SDK:", error.message || error);
  process.exit(1);
}

const uid = "iGTkV2ygpuek86HlM2EXZE8znP62";

admin
  .auth()
  .setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log("✅ Admin claim set successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Failed to set admin claim:", error.message || error);
    process.exit(1);
  });
