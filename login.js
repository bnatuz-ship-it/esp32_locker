import { initializeApp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

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

const login = document.getElementById("login");

login.addEventListener("click", function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
        const user = userCredential.user;

        //Optional: Store user info in session/local storage
        localStorage.setItem("user", JSON.stringify({
            uid: user.uid,
            email: user.email,
        }));
        //Redirect
        window.location.href = "dashboard.html";
    })
    .catch((error) =>{
        const errorMessage = error.message;
        alert(errorMessage);
    });
});