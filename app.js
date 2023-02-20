const path = require("path");
const mongoose = require("mongoose");
const express = require("express");
const bodyParser = require("body-parser");
const MongoClient = require("./util/database").MongoClient;
const User = require("./models/user");
const session = require('express-session')
const MongoDBStore = require('connect-mongodb-session')(session)
const errorController = require("./controllers/error");
const csurf = require('csurf')
const flash = require('connect-flash')
const multer = require('multer')

const app = express();
const MongoDB_URI = 'mongodb+srv://Siddheshya:Siddheshya%40007@cluster0.famxq9l.mongodb.net/shop?retryWrites=true&w=majority'

const store = new MongoDBStore({
  uri: MongoDB_URI,
  collection:'sessions'
})
app.use(
  session({
    secret:'my secret',
    resave:false,
    saveUninitialized:false,
    store:store
  })
)
const csrfProtection = csurf()
const fileStorage = multer.diskStorage({
  destination:(req,file,cb)=>{
    cb(null,'images')
  },
  filename:(req,file,cb)=>{
    cb(null,file.filename+'-'+file.originalname)
  }
})
const filefilter = (req,file,cb)=>{
  if(file.mimeType === 'image/png' || file.mimeType === 'image/jpeg' || file.mimeType === 'image/jpg'){
    cb(null,true)
  }
  else{
    cb(null,false)
  }
}
app.use(flash())
app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({storage:fileStorage}).single('image'))
app.use(express.static(path.join(__dirname, "public")));
app.use('/images',express.static(path.join(__dirname, "images")));
app.use(csrfProtection)

app.use((req, res, next) => {
  if(!req.session.user){
    return next()
  }
  User.findById(req.session.user._id).then(user=>{
    req.user = user
    next();
  }).catch(err => {
    console.log(err);
  })
})
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});
app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);
app.listen(3000);
mongoose
  .connect(
    MongoDB_URI,
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then((result) => {
    
  })
  .catch((err) => {
    console.log(err);
  });
app.use('/500',errorController.get500)
app.use(errorController.get404)
