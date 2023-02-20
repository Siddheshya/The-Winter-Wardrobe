const User = require("../models/user");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const {validationResult} = require("express-validator/check");
const nodemailer = require("nodemailer");

var sendinblueTransport = require("sib-api-v3-sdk");
const sibTransport = require("nodemailer-sendinblue-transport");
// const sendgridTransport = require("nodemailer-sendgrid-transport");
// const transporter = nodemailer.createTransport(sendgridTransport({
//   auth:{
//     api_key: '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'
//   }
// }))
// const transporter = nodemailer.createTransport(
//   service:'SendinBlue',
//     auth: {
//       apiKey: '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'
//     }
// );
const transporter = nodemailer.createTransport(
  new sibTransport({
    apiKey:
      "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",
  })
);
// const api = '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'
exports.getLogin = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    isAuthenticated: false,
    errorMessage: message,
  });
};
exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  User.findOne({ email: email }).then((user) => {
    if (!user) {
      req.flash("error", "Invalid email or Password");
      return res.redirect("/login");
    }
    bcrypt.compare(password, user.password).then((doMatch) => {
      if (doMatch) {
        req.session.isLoggedIn = true;
        req.session.user = user;
        return req.session.save((err) => {
          return res.redirect("/login");
        });
      }
    });
  });
};
exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    console.log(err);
    res.redirect("/");
  });
};
exports.getSignup = (req, res, next) => {
  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "Signup",
    isAuthenticated: false,
    errorMessage:undefined
  });
};
exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(422).render("auth/signup", {
      path: "/signup",
      pageTitle: "Signup",
      errorMessage:error.array()[0].msg
    });
  }
   bcrypt.hash(password, 12).then((hashedPassword) => {
        const user = new User({
          email: email,
          password: hashedPassword,
          cart: { items: [] },
        });
        return user.save();
      })
    .then((reuslt) => {
      res.redirect("/");
      transporter
        .sendMail({
          to: email,
          from: "siddheshya007@gmail.com",
          subject: "Sign Up successfully!!",
          html: "<h1> You successfully signed up </h1>",
        })
        .then((res) => {
          console.log("send");
        })
        .catch((err) => {
          console.log(err);
        });
    })
};
exports.getReset = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/reset", {
    path: "/reset",
    pageTitle: "Reset Password",
    isAuthenticated: false,
    errorMessage: message,
  });
};
exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect("/reset");
    }
    const token = buffer.toString("hex");
    User.findOne({ email: req.body.email })
      .then((user) => {
        if (!user) {
          req.flash("error", "No account with this email found");
          console.log("no user found");
          return res.redirect("/reset");
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save();
      })
      .then((result) => {
        res.redirect("/");
        transporter
          .sendMail({
            to: req.body.email,
            from: "siddheshya007@gmail.com",
            subject: "Sign Up successfully!!",
            html: `
            <p>You requested a password reset</p>
            <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password.</p>
          `,
          })
          .then((res) => {
            console.log("send");
          })
          .catch((err) => {
            console.log(err);
          });
      })
      .catch(console.log(err));
  });
};
exports.getnewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
    .then((user) => {
      let message = req.flash("error");
      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }
      res.render("auth/new-password", {
        path: "/new-password",
        pageTitle: "New Password",
        isAuthenticated: false,
        errorMessage: message,
        userId: user._id.toString(),
        passwordToken: token,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};
exports.postNewPassword = (req, res, next) => {
  const userId = req.body.userId;
  const token = req.body.passwordToken;
  const newPassword = req.body.password;
  console.log(newPassword);
  let resetUser;
  User.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() },
    _id: userId,
  })
    .then((user) => {
      resetUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then((hashedPassword) => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then((result) => {
      res.redirect("/login");
    })
    .catch();
};
