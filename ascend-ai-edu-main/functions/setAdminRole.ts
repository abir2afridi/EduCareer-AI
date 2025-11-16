/**
 * setAdminRole Cloud Function
 * ---------------------------------------------
 * Usage steps (see README instructions below as well):
 * 1. Deploy this function: `firebase deploy --only functions:setAdminRole`
 * 2. Invoke it via CLI once deployed:
 *    `firebase functions:call setAdminRole`
 *    (Make sure you are authenticated with the same account that owns the project.)
 * 3. The callable verifies that the invoker's email matches the trusted admin account and then
 *    assigns the custom claim { role: "admin" } to the hard-coded UID.
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

// Ensure the Firebase Admin SDK is initialized exactly once per instance.
if (!admin.apps.length) {
  admin.initializeApp();
}

// Trusted account + target user information.
const TRUSTED_ADMIN_EMAIL = "abir2afridi@gmail.com";
const TARGET_ADMIN_UID = "iGTkV2ygpuek86HlM2EXZE8znP62";

export const setAdminRole = onCall(async (request) => {
  // Basic guard: require Firebase Auth context and ensure caller email matches the trusted admin.
  if (!request.auth || request.auth.token.email !== TRUSTED_ADMIN_EMAIL) {
    throw new HttpsError(
      "permission-denied",
      "Only the trusted administrator can invoke this function.",
    );
  }

  try {
    await admin.auth().setCustomUserClaims(TARGET_ADMIN_UID, { role: "admin" });

    console.info("setAdminRole: claim assigned", {
      targetUid: TARGET_ADMIN_UID,
      role: "admin",
      invokedBy: request.auth.token.email,
    });

    return {
      success: true,
      message: `Custom claim { role: "admin" } applied to UID ${TARGET_ADMIN_UID}.`,
    };
  } catch (error) {
    console.error("setAdminRole: failed", error);
    throw new HttpsError("internal", "Failed to assign admin role.");
  }
});
