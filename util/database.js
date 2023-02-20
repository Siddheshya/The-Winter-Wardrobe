const mongodb = require('mongodb')
const MongoClient = mongodb.MongoClient
let _db;
const MongoConnect = (callback)=>MongoClient.connect('mongodb+srv://Siddheshya:Siddheshya%40007@cluster0.famxq9l.mongodb.net/shop?retryWrites=true&w=majority',{useNewUrlParser: true, useUnifiedTopology: true}).then((client)=>{
  _db = client.db()
  callback();
}).catch((err)=>{
  console.log(err)
})
const getdb = ()=>{
  if(_db){
    return _db
  }
  throw 'No database'
}
exports.MongoClient = MongoConnect
exports.getdb = getdb
