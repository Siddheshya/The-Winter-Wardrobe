const express = require("express");
const User = require("../models/user");
const { check, body } = require("express-validator/check");
const router = express.Router();
const authController = require("../controllers/auth");
router.get("/login", authController.getLogin);
router.post("/login", authController.postLogin);
router.post("/logout", authController.postLogout);
router.post(
  "/signup",
  [
    check("email").isEmail().withMessage("Please enter valid email").custom((value,{req})=>{
        return User.findOne({email: value}).then(userDoc=>{
            if(userDoc){
                return Promise.reject('Email already exist')
            }
        })
    }),
    body("password", "Please enter password of length 5 or more")
      .isLength({ min: 5 })
      .isAlphanumeric(),
    body('confirmPassword').custom((value,{req})=>{
        if(value!==req.body.password){
            throw new Error("Password mismatch!")
        }
        return true
    })  
  ],
  authController.postSignup
);
router.get("/signup", authController.getSignup);
router.get("/reset", authController.getReset);
router.post("/reset", authController.postReset);
router.get("/reset/:token", authController.getnewPassword);
router.post("/new-password", authController.postNewPassword);
module.exports = router;
