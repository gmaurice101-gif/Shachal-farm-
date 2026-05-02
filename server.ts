import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/send-sms", async (req, res) => {
    const { phone, message } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ error: "Phone and message are required" });
    }

    const apiKey = process.env.CELCOM_API_KEY;
    const partnerId = process.env.CELCOM_PARTNER_ID;
    const senderId = process.env.CELCOM_SENDER_ID;

    if (!apiKey || !partnerId) {
      return res.status(500).json({ error: "SMS service not configured on server" });
    }

    try {
      // Celcom Africa API structure based on general Kenyan bulk SMS providers
      // Note: This format might need adjustment based on exact documentation if available
      const response = await axios.post("https://api.celcomafrica.com/v1/send", {
        api_key: apiKey,
        partner_id: partnerId,
        message: message,
        shortcode: senderId,
        mobile: phone
      });

      res.json({ success: true, data: response.data });
    } catch (error: any) {
      console.error("SMS Error:", error.response?.data || error.message);
      res.status(500).json({ error: "Failed to send SMS", details: error.response?.data || error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
