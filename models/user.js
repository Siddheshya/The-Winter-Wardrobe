const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  resetToken:String,
  resetTokenExpiration:Date,
  cart: {
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true },
      },
    ],
  },
});
userSchema.methods.addToCart = function (product) {
  const cartProductIndex = this.cart.items.findIndex((cp) => {
    return cp.productId.toString() === product._id.toString();
  });

  let newQuantity = 1;
  const updatedCartItems = [...this.cart.items];
  if (cartProductIndex >= 0) {
    newQuantity = this.cart.items[cartProductIndex].quantity + 1;
    updatedCartItems[cartProductIndex].quantity = newQuantity;
  } else {
    updatedCartItems.push({
      productId: product._id,
      quantity: newQuantity,
    });
  }
  const updatedCart = {
    items: updatedCartItems,
  };
  this.cart = updatedCart;
  return this.save()
};
userSchema.methods.removeFromCart = function(productId){
  const updatedCart = this.cart.items.filter(item=>{
    return item.productId.toString() !== productId.toString()
  })
  this.cart.items = updatedCart
  return this.save()
}
userSchema.methods.clearCart = function(){
  this.cart = {items:[]}
  return this.save()
}
module.exports = mongoose.model("User", userSchema);
// const mongodb = require("mongodb");
// const getdb = require("../util/database").getdb;
// class user {
//   constructor(username, email, cart, id) {
//     this.username = username;
//     this.email = email;
//     this.cart = cart;
//     this._id = id;
//   }
//   save() {
//     const db = getdb();
//     return db.collection("users").insertOne(this);
//   }
//   addToCart(product) {
//     const cartProductIndex = this.cart.items.findIndex((cp) => {
//       return cp.productId.toString() === product._id.toString();
//     });

//     let newQuantity = 1;
//     const updatedCartItems = [...this.cart.items];
//     if (cartProductIndex >= 0) {
//       newQuantity = this.cart.items[cartProductIndex].qty + 1;
//       updatedCartItems[cartProductIndex].qty = newQuantity;
//     } else {
//       updatedCartItems.push({
//         productId: mongodb.ObjectId(product._id),
//         qty: newQuantity,
//       });
//     }
//     const updatedCart = {
//       items: updatedCartItems,
//     };
//     console.log(this._id);
//     const db = getdb();
//     return db
//       .collection("users")
//       .updateOne(
//         { _id: mongodb.ObjectId(this._id) },
//         { $set: { cart: updatedCart } }
//       );
//   }
//   getCart() {
//     const db = getdb();
//     const productIds = this.cart.items.map((id) => {
//       return id.productId;
//     });
//     return db
//       .collection("products")
//       .find({ _id: { $in: productIds } })
//       .toArray()
//       .then((product) => {
//         return product.map((p) => {
//           return {
//             ...p,
//             quantity: this.cart.items.find((i) => {
//               return i.productId.toString() === p._id.toString();
//             }).qty,
//           };
//         });
//       });
//   }
//   deleteItemFromCart(prodId) {
//     const updatedCartItems = this.cart.items.filter((items) => {
//       return prodId.toString() !== items.productId.toString();
//     });
//     const db = getdb();
//     return db
//       .collection("users")
//       .updateOne(
//         { _id: mongodb.ObjectId(this._id) },
//         { $set: { cart: { items: updatedCartItems } } }
//       );
//   }
//   getOrder() {
//     const db = getdb();
//     return db
//       .collection("orders")
//       .find({ "user._id": mongodb.ObjectId(this._id) })
//       .toArray();
//   }
//   addOrder() {
//     const db = getdb();
//     return this.getCart()
//       .then((products) => {
//         const order = {
//           items: products,
//           user: {
//             _id: mongodb.ObjectId(this._id),
//             name: this.username,
//           },
//         };
//         return db.collection("orders").insertOne(order);
//       })
//       .then((result) => {
//         this.cart = { items: [] };
//         // console.log(this._id)
//         return db
//           .collection("users")
//           .updateOne({ _id: this._id }, { $set: { cart: { items: [] } } });
//       });
//   }
//   static findById(userId) {
//     const db = getdb();
//     return db.collection("users").findOne({ _id: mongodb.ObjectId(userId) });
//   }
// }
// module.exports = user;
