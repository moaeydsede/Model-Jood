import { auth, db } from "./firebase.js";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { TENANT_ID } from "./config.js";

export async function loginWithEmail(email, password){
  return signInWithEmailAndPassword(auth, email, password);
}

export async function logout(){
  return signOut(auth);
}

export function watchAuth(cb){
  return onAuthStateChanged(auth, cb);
}

export async function fetchMyProfile(uid){
  const ref = doc(db, "tenants", TENANT_ID, "users", uid);
  const snap = await getDoc(ref);
  if(!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}
