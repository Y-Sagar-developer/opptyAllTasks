const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.post("/send-mail", async (req, res) => {
    // const name = req.body.name;
    // const email = req.body.email;
    // const wpm = req.body.wpm;
    // const accuracy = req.body.accuracy;
    const { name, email, wpm, accuracy } = req.body;

    try {
        let transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "sagaryarra987@gmail.com",
                pass: "swqzdwgiddlkazvo"
            }
        });

        await transporter.sendMail({
            from: "sagaryarra987@gmail.com",
            to: email,
            subject: "Typing Test Result",
            text: `Hello ${name},

WPM: ${wpm}
Accuracy: ${accuracy}%`
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