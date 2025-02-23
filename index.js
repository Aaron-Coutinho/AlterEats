// this is for signout option after signing in Do Not Mess :)

import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

const auth = getAuth();
const db = getFirestore();
const signInBtn = document.getElementById("signInBtn");
const profileContainer = document.getElementById("profileContainer");
const profileInitials = document.getElementById("profileInitials");
const profileDropdown = document.getElementById("profileDropdown");
const username = document.getElementById("username");
const signOutBtn = document.getElementById("signOutBtn");

// Check if User is Logged In
onAuthStateChanged(auth, async (user) => {
    if (user) {
        signInBtn.style.display = "none"; // Hide Sign In Button
        profileContainer.style.display = "inline-block"; // Show Profile Icon

        // Fetch user data from Firestore
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();
            const firstName = userData.firstName || "";
            const lastName = userData.lastName || "";

            // Set initials
            const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
            profileInitials.textContent = initials;

            // Set username in dropdown
            username.innerText = `${firstName} ${lastName}`;
        }
    } else {
        signInBtn.style.display = "inline-block"; // Show Sign In Button
        profileContainer.style.display = "none"; // Hide Profile Icon
    }
});

// Toggle Dropdown on Profile Click
profileInitials.addEventListener("click", () => {
    profileDropdown.style.display = profileDropdown.style.display === "block" ? "none" : "block";
});

// Sign Out Function
signOutBtn.addEventListener("click", () => {
    signOut(auth).then(() => {
        localStorage.removeItem("loggedInUserId"); // Clear user ID from local storage
        localStorage.clear(); // Clears all local storage data
        sessionStorage.clear(); // Clears session storage (optional)
        window.location.reload(); // Refresh Page After Logout
    }).catch((error) => {
        console.error("Sign Out Error:", error.message);
    });
});
