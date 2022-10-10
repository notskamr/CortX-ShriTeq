// Lib imports
import express from "express";
import * as http from "http";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import mongoose from "mongoose";
import { MailTransporter } from "./lib/mailer.js";
import User from "./models/user.js";
import nodemailer from "nodemailer";
import checkUser from "./middlewares/checkUser.js";
import * as jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";

import jsonwebtoken from "jsonwebtoken";
import { validate } from "email-validator";
import bcrypt from "bcryptjs";

import recognize from "./lib/TesseractDetect.js";

// await recognize("file.png").then((res) => console.log(res));
// App init
const app = express();
dotenv.config();

app.use(cookieParser());

// react file handler
if (
  process.env.NODE_ENV === "production" ||
  process.env.NODE_ENV === "staging"
) {
  app.use(express.static("client/build"));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname + "/client/build/index.html"));
  });
}

// DB connection
mongoose
  .connect(process.env.HEALTHCARE_DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to database successfully");
  })
  .catch((err) => {
    console.log(err);
  });

// Route setup
import userRouter from "./routes/userRouter.js";
app.use("/api/users/", userRouter);

import reminderRouter from "./routes/reminderRouter.js";
app.use("/api/reminders/", reminderRouter);

import fileRouter from "./routes/fileRouter.js";
import cookieParser from "cookie-parser";
import { databaseNamespace } from "mongodb/lib/utils.js";
app.use("/api/files/", fileRouter);

// ejs view engine
app.set("view engine", "ejs");

// middleware setup
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("combined"));
const server = http.Server(app);

app.use(express.static("public"));
app.use("/assets", express.static("assets"));

// Root route

const mailTransporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "cortxapp@gmail.com",
    pass: "zkpnzjmxemzizvcf",
  },
});

app.get("/api/sendMail", checkUser, async (req, res) => {
  if (!req.query?.subject)
    return res.status(400).json("No subject or body for mail.");

  const user = await User.findById(req.checkData.id);
  if (!user) return res.status(403).json("User not found");
  console.log(user);
  const subject = req.query.subject;

  let body;
  if (!req.query.body)
    body = `${req.checkData.username}'s Corto Companion is attached! Thank you for using CortX.`;
  else {
    body = req.query.body;
  }

  let recepient = user.email;

  if (req.query.recepient) recepient = req.query.recepient;
  const file = fs.readFileSync(
    "C:\\Users\\Skamr\\Documents\\HealthcareApp\\data.csv"
  );
  mailTransporter.sendMail(
    {
      from: "<cortxapp@gmail.com> CortX App",
      to: recepient,
      subject: subject,
      text: body,
      attachments: [
        {
          filename: "Your Data.csv",
          content: file,
        },
      ],
    },
    (err, info) => {
      if (err) {
        console.log(err);
        return res
          .status(400)
          .json({ status: "error", error: "Could not send." });
      } else {
        return res.json({ status: "success" });
      }
    }
  );
});

const listener = server.listen(process.env.PORT || 5000, (err) => {
  if (err) {
    console.log(err);
  } else {
    console.log(`Listening on ${listener.address().port}`);
  }
});
