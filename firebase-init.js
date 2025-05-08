// firebase-init.js
// Firebase configuration (replace with your own project's config)
var firebaseConfig = {
    apiKey: "AIzaSyBKAypjgOh4D7yIxFQtjBwGeT8-MRU-8wY",
    authDomain: "studentteacher-a7cfd.firebaseapp.com",
    projectId: "studentteacher-a7cfd",
    appId: "1:911522532928:web:280919c1d60996ebce99a5"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Logging utility – prepends ISO timestamp to messages
function log(message) {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} - ${message}`);
}

// Define admin user(s) by email
const ADMIN_EMAILS = ["sahil.spdp468@gmail.com"];
