const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
require("dotenv").config();


const app = express();

app.use(cors());
app.use(express.json());

app.post("/send-mail", async (req, res) => {
    const { name, email, wpm, accuracy, mistakes } = req.body;

    try {
        let transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.GMAIL_USER,   // ← .env nundi
                pass: process.env.GMAIL_PASS,
            }
        });

        await transporter.sendMail({
            from: "sagaryarra987@gmail.com",
            to: email,
            subject: "Typing Test Result",
            text: `Hello ${name},

Your Typing Test Results:

WPM: ${wpm}
Accuracy: ${accuracy}%
Mistakes: ${mistakes}`
        });

        res.send("Email sent successfully");
    } catch (error) {
        console.log(error);
        res.send("Error sending email");
    }
});

app.listen(5000, () => {
    console.log("Server running on http://localhost:5000");
});