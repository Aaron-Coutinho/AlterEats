// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, fetchSignInMethodsForEmail } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getFirestore, setDoc, doc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyCDC6DXghvxsAP9PR6lOKOLGLEa_YwvdSk",
    authDomain: "altereats-8d931.firebaseapp.com",
    projectId: "altereats-8d931",
    storageBucket: "altereats-8d931.appspot.com",
    messagingSenderId: "707355301418",
    appId: "1:707355301418:web:03c750c155b1d00b4cd553"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Function to show messages
function showMessage(message, divId) {
    var messageDiv = document.getElementById(divId);
    messageDiv.style.display = "block";
    messageDiv.innerHTML = message;
    messageDiv.style.opacity = 1;
    setTimeout(function () {
        messageDiv.style.opacity = 0;
    }, 5000);
}

// ✅ Signup Event Listener
document.getElementById("submitSignUp").addEventListener("click", (e) => {
    e.preventDefault();
    const email = document.getElementById("rEmail").value.trim();
    const password = document.getElementById("rPassword").value.trim();
    const firstName = document.getElementById("fName").value.trim();
    const lastName = document.getElementById("lName").value.trim();

    if (!email || !email.includes("@") || email.length < 5) {
        showMessage("Enter a valid email address", "signUpMessage");
        return;
    }
    if (password.length < 6) {
        showMessage("Password must be at least 6 characters", "signUpMessage");
        return;
    }

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            const userData = {
                email: email,
                firstName: firstName,
                lastName: lastName
            };

            showMessage("Account Created Successfully", "signUpMessage");

            // Write to Firestore
            return setDoc(doc(db, "users", user.uid), userData);
        })
        .then(() => {
            console.log("User data successfully written to Firestore");
            window.location.href = 'signup.html'; // Redirect to signup page
        })
        .catch((error) => {
            console.error("Error:", error.message);
            if (error.code === "auth/email-already-in-use") {
                showMessage("Email already in use", "signUpMessage");
            } else {
                showMessage("Error creating user", "signUpMessage");
            }
        });
});

// ✅ Sign-In Event Listener
document.getElementById('submitSignIn').addEventListener('click', (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !email.includes("@") || email.length < 5) {
        showMessage("Enter a valid email address", "signInMessage");
        return;
    }

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            console.log("User Logged In:", user.uid);
            localStorage.setItem("loggedInUserId", user.uid);

            showMessage("Signed in successfully", "signInMessage");
            setTimeout(() => {
                window.location.href = 'index.html'; // Redirect to main page
            }, 1000);
        })
        .catch((error) => {
            console.error("Sign-in Error:", error.message);
            if (error.code === "auth/user-not-found") {
                showMessage("User not found", "signInMessage");
            } else if (error.code === "auth/wrong-password") {
                showMessage("Incorrect password", "signInMessage");
            } else {
                showMessage("Account does not exist", "signInMessage");
            }
        });
});

// Was trying to set Recover password but not woring :(
// Forgot Password Event Listener
// document.getElementById("forgotPasswordLink").addEventListener("click", async (e) => {
//     e.preventDefault();
//     const email = document.getElementById("email").value.trim();

//     if (!email || !email.includes("@") || email.length < 5) {
//         showMessage("Enter a valid email address", "signInMessage");
//         return;
//     }

//     try {
//         const signInMethods = await fetchSignInMethodsForEmail(auth, email);
//         if (signInMethods.length === 0) {
//             showMessage("This email is not registered", "signInMessage");
//         } else {
//             await sendPasswordResetEmail(auth, email);
//             showMessage("Password reset email sent! Check your inbox.", "signInMessage");
//         }
//     } catch (error) {
//         console.error("Reset Password Error:", error.message);
//         showMessage("Error: " + error.message, "signInMessage");
//     }
// });
