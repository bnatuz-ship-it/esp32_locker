// Import Firebase modules using version 13.2.0 uniformly
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";
import { getDatabase, ref, get, set, push, serverTimestamp, onValue, query, limitToLast } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-database.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

// Your project's Firebase configuration
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

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const firestore = getFirestore(app);

// UI Containers
const relayContainer = document.getElementById("relayContainer");
const logList = document.getElementById("logList");
const logsRef = ref(db, 'relayLogs');

// Generate 10 relay controls dynamically
for (let i = 1; i <= 10; i++) {
    const relayKey = `relay${i}`;

    // Create a card element for each relay including an image preview box
    const card = document.createElement("div");
    card.className = "relay-card";
    card.innerHTML = `
        <img id="img-${i}" src="empty.webp" alt="Locker Item">
        <h3>Relay ${i}</h3>
        <p>Status: <span id="status-${i}">Loading...</span></p>
        <button id="btn-${i}">Toggle</button>
    `;
    relayContainer.appendChild(card);

    const statusSpan = document.getElementById(`status-${i}`);
    const toggleBtn = document.getElementById(`btn-${i}`);
    const imgElement = document.getElementById(`img-${i}`);
    const relayRef = ref(db, relayKey);

    // Track state and image URL locally for this relay
    let currentState = 0;
    let currentImageUrl = "";

    // Fetch initial state and image URL once
    // Fetch initial state and image URL once
    get(relayRef).then((snapshot) => {
        if (snapshot.exists()) {
            const val = snapshot.val();
            if (typeof val === 'object' && val !== null) {
                currentState = val.state || 0;
                currentImageUrl = val.imageUrl || "";
            } else {
                currentState = val; 
            }
            
            if (imgElement) {
                imgElement.src = currentImageUrl ? currentImageUrl : "empty.webp";
            }
        }
    });

    // Listen for real-time changes from Firebase (ESP32 or web)
    onValue(relayRef, (snapshot) => {
        const value = snapshot.val();
        if (value !== null) {
            if (typeof value === 'object') {
                currentState = value.state !== undefined ? value.state : 0;
                currentImageUrl = value.imageUrl || "";
            } else {
                currentState = value;
            }

            statusSpan.textContent = currentState === 1 ? "ON (1)" : "OFF (0)";
            
            // Apply CSS class based on state instead of inline color styling
            statusSpan.className = currentState === 1 ? "status-on" : "status-off";

            if (imgElement) {
                imgElement.src = currentImageUrl ? currentImageUrl : "empty.webp";
            }
        } else {
            statusSpan.textContent = "Offline";
            statusSpan.className = ""; // Optional offline styling if desired
        }
    });

    // Handle button click for this specific relay
    toggleBtn.addEventListener("click", async () => {
        const newState = currentState === 1 ? 0 : 1;
        const currentUser = auth.currentUser;
        let username = "Anonymous";

        if (currentUser) {
            try {
                const userDoc = await getDoc(doc(firestore, "users", currentUser.uid));
                if (userDoc.exists()) {
                    username = userDoc.data().displayName || currentUser.email;
                } else {
                    username = currentUser.email;
                }
            } catch (err) {
                console.error("Error fetching username:", err);
                username = currentUser.email || "Unknown User";
            }
        }

        const logData = {
            relay: `Relay ${i}`,
            state: newState,
            username: username,
            timestamp: serverTimestamp()
        };

        // Prepare the updated relay object containing BOTH state and the preserved image URL
        const updatedRelayData = {
            state: newState,
            imageUrl: currentImageUrl
        };

        // Update database (saving the object instead of overwriting with a plain number) and push log simultaneously
        Promise.all([
            set(relayRef, updatedRelayData),
            push(logsRef, logData)
        ])
        .then(() => {
            console.log(`Relay ${i} toggled to ${newState} by ${username}`);
        })
        .catch((error) => {
            console.error(`Failed to update Relay ${i}:`, error);
            alert("Action failed: " + error.message);
        });
    });
}

// 3. Listen for recent activity logs and display them
const recentLogsQuery = query(logsRef, limitToLast(10));
onValue(recentLogsQuery, (snapshot) => {
    logList.innerHTML = "";

    if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
            const log = childSnapshot.val();
            const li = document.createElement("li");

            let timeString = "Just now";
            if (log.timestamp) {
                timeString = new Date(log.timestamp).toLocaleString();
            }

            const stateText = log.state === 1 ? "ON" : "OFF";
            const relayName = log.relay || "Relay";
            
            li.textContent = `${log.username} turned ${relayName} ${stateText} at ${timeString}`;
            logList.appendChild(li);
        });
    } else {
        const li = document.createElement("li");
        li.textContent = "No history logs found.";
        logList.appendChild(li);
    }
});

const exportBtn = document.getElementById("exportBtn");

if (exportBtn) {
    exportBtn.addEventListener("click", () => {
        get(logsRef).then((snapshot) => {
            if (!snapshot.exists()) {
                alert("No logs to export!");
                return;
            }

            let csvContent = "data:text/csv;charset=utf-8,Relay,Username,State,Timestamp\n";

            snapshot.forEach((childSnapshot) => {
                const log = childSnapshot.val();
                const time = log.timestamp ? new Date(log.timestamp).toLocaleString() : "";
                const state = log.state === 1 ? "ON" : "OFF";
                const row = `"${log.relay || ''}","${log.username || ''}","${state}","${time}"`;
                csvContent += row + "\n";
            });

            // Create download link
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `relay_activity_log_${Date.now()}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    });
}