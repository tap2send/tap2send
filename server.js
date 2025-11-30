// ===============================
// TAP2SEND – WhatsApp Cloud API Webhook Server
// ===============================

import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import cors from "cors";

import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

// --------------------------
// FIREBASE CONFIG
// --------------------------
const firebaseConfig = {
  apiKey: "AIzaSyDQMbfvjHV-1I3UEHt3asuEBNOO2Qh3RFA",
  authDomain: "tap2send-8e72d.firebaseapp.com",
  projectId: "tap2send-8e72d",
  storageBucket: "tap2send-8e72d.firebasestorage.app",
  messagingSenderId: "572191430506",
  appId: "1:572191430506:web:3100a351c4be63fbf6b713"
};

const FB = initializeApp(firebaseConfig);
const db = getFirestore(FB);

// --------------------------
// WHATSAPP CLOUD CONFIG
// --------------------------
const VERIFY_TOKEN = "tap2send-webhook-token";

const app = express();
app.use(bodyParser.json());
app.use(cors());

// --------------------------
// 1️⃣ VERIFY WEBHOOK (GET)
// --------------------------
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook Verified!");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// --------------------------
// 2️⃣ RECEIVE MESSAGES (POST)
// --------------------------
app.post("/webhook", async (req, res) => {
  try {
    const entry = req.body.entry?.[0].changes?.[0].value;

    if (!entry || !entry.messages) {
      return res.sendStatus(200);
    }

    // Extract message details
    const msg = entry.messages[0];
    const from = msg.from;          // user number
    const text = msg.text?.body || null;
    const type = msg.type;

    console.log("📩 Incoming Message:", text);

    // Store incoming message in Firebase
    await addDoc(collection(db, "incomingMessages"), {
      from,
      text,
      type,
      timestamp: Date.now()
    });

    // --------------------------
    // AUTO-REPLY (DEMO)
    // --------------------------
    if (text) {
      await sendMessage(from, "Thank you for messaging Tap2Send 👋\nOur bot will assist you shortly!");
    }

    res.sendStatus(200);

  } catch (err) {
    console.error("Webhook Error:", err);
    res.sendStatus(500);
  }
});

// --------------------------
// 3️⃣ SEND MESSAGE FUNCTION
// --------------------------
async function sendMessage(to, message) {
  try {
    const WABA_ID = "4358294717826764";           // Your WhatsApp Business ID
    const TOKEN = "EAAlScBWFZCQoBQOgZBPXFgikZCg7XWk76dm1hkZBRvXc0eZA6muPf8TXNxCzYDi15bnchsJyZB296wQMclIrF20HAM8YESTLYKRuoGnZBRX9CDv6YE6y9jAttzma84MhqznrZBGcy3s6uZB6sMAoyftizZCjzJuDHqMwTo3rqT6Cr4xp9TY7cbDMxrHAuN1wppiUZBYZBhaUyIHMD68SkgiZCsJVv3pcYLKT4GYohcy4LhZAOhjEmqN3KAKY57mtXJo5aZAAzZArnGwZAjJ0NgYfGn51IamTVeQCC";

    await axios.post(
      `https://graph.facebook.com/v17.0/${WABA_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message }
      },
      {
        headers: {
          "Authorization": `Bearer ${TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("📤 Message sent to:", to);

  } catch (error) {
    console.error("❌ Sending message failed:", error.response?.data || error);
  }
}

// --------------------------
// START SERVER
// --------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Tap2Send Webhook Server running on port ${PORT}`);
});
