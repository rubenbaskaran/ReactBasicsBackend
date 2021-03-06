// npm run backend

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const config = require("./config");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const { User } = require("./model/user");
const { auth } = require("./middleware/auth");
var cors = require("cors");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors());

mongoose
  .connect(
    "mongodb+srv://rubenbaskaran:" +
      config.development.database.password +
      "@reacttutorialmongodb-hkyfr.gcp.mongodb.net/test?retryWrites=true&w=majority",
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => console.log("DB connected"))
  .catch((err) => console.error(err));

app.get("/", (req, res) => {
  res.send("hello world! :-)");
});

app.get("/api/user/auth", auth, (req, res) => {
  res.status(200).json({
    _id: req.user._id,
    isAuth: true,
    email: req.user.email,
    name: req.user.name,
    lastname: req.user.lastname,
    role: req.user.role,
  });
});

app.post("/api/user/register", (req, res) => {
  const user = new User(req.body);
  user.save((err, doc) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: err,
      });
    }

    return res.status(200).json({
      success: true,
      userData: doc,
    });
  });
});

app.post("/api/user/login", (req, res) => {
  // Find email
  User.findOne({ email: req.body.email }, (err, user) => {
    if (!user) {
      return res.json({
        loginSuccess: false,
        message: "Auth failed, email not found",
      });
    }

    // Compare password
    user.comparePassword(req.body.password, (err, isMatch) => {
      if (!isMatch) {
        return res.json({
          loginSuccess: false,
          message: "Wrong password",
        });
      }

      // Generate token
      user.generateToken((err, user) => {
        if (err) {
          return res.status(400).send(err);
        }

        // Save received token as a cookie
        res.cookie("x_auth", user.token).status(200).json({
          loginSuccess: true,
        });
      });
    });
  });
});

app.get("/api/user/logout", auth, (req, res) => {
  User.findOneAndUpdate({ _id: req.user._id }, { token: "" }, (err, doc) => {
    if (err) {
      return res.json({ success: false, err });
    }

    return res.status(200).send({
      succes: true,
    });
  });
});

app.listen(5000);
