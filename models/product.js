const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
  title:{
    type: String,
    required:true
  },
  price:{
    type:Number,
    required:true
  },
  description:{
    type: String,
    required:true
  },
  imageUrl:{
    type: String,
    required:true
  },
  userId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User',
    required:true
  }
})
module.exports = mongoose.model('Product',productSchema)



// const getdb = require("../util/database").getdb;
// const mongodb = require("mongodb")

// class Product {
//   constructor(title,price,description,ImageUrl,id,userId) {
//     this.title = title;
//     this.price = price;
//     this.ImageUrl = ImageUrl;
//     this.description = description,
//     this._id=id
//     this.userId = mongodb.ObjectId(userId);
//   }
//   save() {
//     const db = getdb()
//     let dbOp
//     if(this._id){
//       dbOp = db.collection('products').updateOne({_id:mongodb.ObjectId(this._id)},{$set:this})
//     }
//     else{
//       dbOp = db
//       .collection("products")
//       .insertOne(this)
//     }
//     return dbOp
//       .then((result) => {
//         console.log(result);
//       })
//       .catch((error) => {
//         console.log(error);
//       });
//   }
//   static fetchAll(){
//     const db = getdb()
//     return db.collection('products').find().toArray().then((products) => {
//       return products;
//     }).catch((error) => {
//       console.log(error);
//     });
//   }
//   static findbyId(prodId){
//     const db = getdb();
//     return db.collection('products').find({_id:mongodb.ObjectId(prodId)}).next().then(product => {
//       console.log(product);
//       return product
//     })
//     .catch(err => {
//       console.log(err);
//     })
//   }
//   static deleteProduct = (prodId)=>{
//     const db = getdb()
//     return db.collection('products').deleteOne({_id:mongodb.ObjectId(prodId)}).then((result)=>{
//       console.log('Deleted')
//     })
//     .catch((err) => {
//       console.log(err);
//     })
//   }
// }

// module.exports = Product;
