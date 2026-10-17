import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { env } from "./env.js";

// Verifying ID tokens only needs the project ID, not a service account.
const app = initializeApp({ projectId: env.FIREBASE_PROJECT_ID });

export const firebaseAuth = getAuth(app);
