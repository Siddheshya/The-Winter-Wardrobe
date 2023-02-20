const Product = require("../models/product");
const mongodb = require('mongodb');


exports.getAddProduct = (req, res, next) => {
  res.render("admin/edit-product", {
    pageTitle: "Add Product",
    path: "/admin/add-product",
    editing: false,
    isAuthenticated:req.session.isLoggedIn
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  console.log(image)
  if(!image){
    return res.redirect('/admin/add-product')
  }
  const imageUrl = image.path
  const product = new Product({
    title: title,
    price: price,
    imageUrl: imageUrl,
    description: description,
    userId:req.user._id
  })
  product.save().then((result) => {
    console.log('Created')
    res.redirect('/')
  })
  .catch((err) => {
    res.redirect('/500')
  })
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect("/");
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        return res.redirect("/");
      }
      res.render("admin/edit-product", {
        pageTitle: "Edit Product",
        path: "/admin/edit-product",
        editing: editMode,
        product: product,
        isAuthenticated: req.session.isLoggedIn
      });
    })
    .catch((err) => console.log(err));
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const image = req.file;
  const updatedDesc = req.body.description;
  Product.findById(prodId).then(product=>{
    product.title = updatedTitle;
    product.price = updatedPrice;
    if(image){
      
      product.imageUrl = image.path;
    }
    product.description = updatedDesc;
    return product.save()
  }).then((result) => {
      console.log("UPDATED PRODUCT!");
      res.redirect("/admin/products");
    })
    .catch((err) => console.log(err));
};

exports.getProducts = (req, res, next) => {
  Product.find({userId:req.user._id})
    .then((products) => {
      res.render("admin/products", {
        prods: products,
        pageTitle: "Admin Products",
        path: "/admin/products",
        isAuthenticated: req.session.isLoggedIn
      });
    })
    .catch((err) => console.log(err));
};

exports.deleteProduct = (req, res, next) => {
  const prodId = req.params.productId;
  console.log(prodId);
  Product.findByIdAndRemove(prodId)
    .then((result) => {
      console.log("DESTROYED PRODUCT");
      res.status(200).json({message:"Success"})
    })
    .catch((err) => res.status(500).json({message:"deleting product failed"}));
};
