import { initializeApp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyDWgV24AXGkGtU1EC3GA40JXYaHSAFI53c",
  authDomain: "esp32-firebase-40c8e.firebaseapp.com",
  databaseURL: "https://esp32-firebase-40c8e-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "esp32-firebase-40c8e",
  storageBucket: "esp32-firebase-40c8e.firebasestorage.app",
  messagingSenderId: "605742945011",
  appId: "1:605742945011:web:a863cd7c8c311515171d86",
  measurementId: "G-4JWK0KC2V3"
};

//
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const username = document.getElementById("username");
const email = document.getElementById("email");
const idnumber = document.getElementById("idnumber");
const logoutBtn = document.getElementById("logout");

//Fetch user details
onAuthStateChanged(auth, (user) =>{
    if (user) {
        const userDocRef = doc(db, "users", user.uid);
        getDoc(userDocRef)
        .then((docSnapshot) =>{
            if (docSnapshot.exists()) {
                const userData = docSnapshot.data();
                username.textContent = userData.displayName;
                email.textContent = userData.email;
                idnumber.textContent = userData.idnumber;
            } else {
                alert("No user data found!");
            }
        })
        .catch((error) => {
            console.error("Error fetching user data:",error);
            alert("Failed to fetch user data.");
        });
    } else {
        window.location.href = "login.html";
    }
});

logoutBtn.addEventListener("click", () => {
    signOut(auth)
    .then(() => {
        window.location.href = "login.html";
    })
    .catch((error) =>{
        const errorMessage = error.message;
        alert(errorMessage);
    });
})