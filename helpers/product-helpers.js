var db=require('../config/connection')
var collection=require('../config/collections');
const { ObjectId } = require('mongodb');
const { response } = require('../app');

module.exports={

    addProduct:(product,callback)=>{
        console.log(product);
        db.get().collection('product').insertOne(product).then((data)=>{
          
            callback(data.insertedId)
           

        })}
    ,
    getAllproduct:()=>{
        return new Promise(async(resolve,reject)=>{
            let products=db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    }
,
deleteProduct:(prodId)=>{
    return new Promise((resolve,reject)=>{
     db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:new ObjectId(prodId)}).then((response)=>{
        resolve(response)
     })
         
       
    })
}
}
