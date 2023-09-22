var db=require('../config/connection')
var collection=require('../config/collections')
const bcrypt = require('bcrypt')
const { ObjectId } = require('mongodb');
const { response } = require('../app');
const Razorpay = require('razorpay');
const { resolve } = require('node:path');

var instance = new Razorpay({
  key_id: 'rzp_test_2igtpdxMnXTlHa',
  key_secret: '0BBnKC96BdQQ4QULcksNuyFd',
});


module.exports={
 doSignup:(userData)=>{
    

    return new Promise(async(resolve,reject)=>{
        userData.Password=await bcrypt.hash(userData.Password,10)
    
         db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{
        
        resolve(data.insertedId)
         })
    })
    
    
 },
 doLogin:(userData)=>{
    
    console.log(userData)
    return new Promise(async(resolve,reject)=>{
        let loginStatus=false
        let response={}
        let user=  await db.get().collection(collection.USER_COLLECTION).findOne({Email:userData.Email})
        
        if(user){
         
            bcrypt.compare(userData.Password,user.Password).then((status)=>{
                    if(status){
                        console.log('login success');
                        response.user=user
                        response.status=true
                        resolve({status,user})

                    }
                    else{
                        console.log('login failed')
                        resolve({status:false})
                    }
            })

        }
        else{
            console.log('user id not found')
            resolve({status:false})
        }

    })
 },
 addToCart:(proId,userId)=>{
    console.log(proId)
    let proObj={
        item:new ObjectId(proId),
        quantity:1

    }
    return new Promise(async(resolve,reject)=>{
        let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({user:new ObjectId(userId)})
        if(userCart){
            let proExist=userCart.products.findIndex(product=> product.item==proId)
            console.log(proExist)
            if(proExist!= -1){
                db.get().collection(collection.CART_COLLECTION)
                .updateOne({user:new ObjectId(userId),'products.item':new ObjectId(proId)},{
                    $inc:{'products.$.quantity':1}
                }).then(()=>{
                    resolve()
                })
                
            }else
             db.get().collection(collection.CART_COLLECTION)
             .updateOne({user:new ObjectId(userId)},
             {
                $push:{products:(proObj)}
                
             }
             ).then((response)=>{
                resolve()
             })
               

        }else{
            let cartobj={
                user:new ObjectId(userId),
                products:[proObj]

            }
            db.get().collection(collection.CART_COLLECTION).insertOne(cartobj).then((response)=>{
                resolve()
            })
        }
    })

 
   },
   getCartProducts:(userId)=>{
    return new Promise(async(resolve,reject)=>{
        let cartItems=await db.get().collection(collection.CART_COLLECTION).aggregate([
            {   //so we are matching data(user) from cart and function parameter userId 
                $match:{user:new ObjectId(userId)
                }
            },
            {  //using unwind each product have individual user name id rather than as whole
                $unwind:'$products'
            } //now we have matched cart in on hand
            ,{
              $project:{
                item:'$products.item',
                quantity:'$products.quantity'
              }
            },
            {
                $lookup:{
                    from:collection.PRODUCT_COLLECTION,
                    localField:'item',
                    foreignField:'_id',
                    as:'product'
                }
            },{
                $project:{
                    //0 means no projection and 1 means projection
                    item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                   }
                }
            ///this is not more working as the structure of database has been changed
            // {
            //     $lookup:{
            //         //we are taking data from product
            //         from:collection.PRODUCT_COLLECTION,
            //         //actually this is data from cart products not from product
            //         let:{proList:'$products'},
            //         pipeline:[
            //             {
            //                 $match:{
            //                     $expr:{
            //                         //now we are matching _id from product and products from cart 
            //                         $in:['$_id','$$proList']
            //                     }
            //                 }
            //             }
            //         ],
            //         //this return full details of product which are match but as object we what to later convert it
            //         as:'cartItems'
            //     }
            // }


        ]).toArray()
        //it contain all the detail but we want only the cart information thus we use this below function if not done this is the output
        // [
        //     {
        //       _id: new ObjectId("64f037bc34e3c5ad83dafd29"),
        //       user: new ObjectId("64edd9606f473ca57ccedcd0"),
        //       products: [
        //         new ObjectId("64ef02df57ed1db1c36e4dc6"),
        //         new ObjectId("64ef4a18084258d762d781ec"),
        //         new ObjectId("64ef02df57ed1db1c36e4dc6")
        //       ],
        //       cartItems: [ [Object], [Object] ]
        //     }
        //   ]
       
        resolve(cartItems);
        //but after this the out put
        // [
        //     {
        //       _id: new ObjectId("64ef02df57ed1db1c36e4dc6"),
        //       Name: 'iphone 14',
        //       Price: '450000',
        //       Description: 'new phone',
        //       Category: 'mobile phone'
        //     },
        //     {
        //       _id: new ObjectId("64ef4a18084258d762d781ec"),
        //       Name: 'basil',
        //       Price: '45',
        //       Description: 'bad',
        //       Category: 'phone17'
        //     }
        //   ]

    })
   },
   getCartCount:(userId)=>{
    return new Promise(async(resolve,reject)=>{
       let count=0
       let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:new ObjectId(userId)})
       if(cart){
           count=cart.products.length


       }
       resolve(count)
    
    })
   },
   changeProductQunatity:(details)=>{
    
    
    details.count=parseInt(details.count)
    details.quantity=parseInt(details.quantity)
    return new Promise((resolve,reject)=>{
        if(details.count==-1 && details.quantity==1){
            db.get().collection(collection.CART_COLLECTION)
            .updateOne({_id:new ObjectId(details.cart)},
            {
                $pull:{products:{item:new ObjectId(details.product)}}
            }).then((response)=>{
                resolve({removeProduct:true})
            })
        }else{
        db.get().collection(collection.CART_COLLECTION)
                .updateOne({_id:new ObjectId(details.cart),'products.item':new ObjectId(details.product)},{
                    $inc:{'products.$.quantity':details.count}//can be -1 or +1
                }).then((response)=>{
                    resolve({status:true})
                })}

    })

   },
   removeQuantity:(details)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.CART_COLLECTION)
            .updateOne({_id:new ObjectId(details.cart)},
            {
                $pull:{products:{item:new ObjectId(details.product)}}
            }).then((response)=>{
                resolve({removeProduct:true})
            })
    })


   },
   getTotalAmount:(userId)=>{
    
    return new Promise(async(resolve,reject)=>{
        let total=await db.get().collection(collection.CART_COLLECTION).aggregate([
            {   //so we are matching data(user) from cart and function parameter userId 
                $match:{user:new ObjectId(userId)
                }
            },
            {  //using unwind each product have individual user name id rather than as whole
                $unwind:'$products'
            } //now we have matched cart in on hand
            ,{
              $project:{
                item:'$products.item',
                quantity:'$products.quantity'
              }
            },
            {
                $lookup:{
                    from:collection.PRODUCT_COLLECTION,
                    localField:'item',
                    foreignField:'_id',
                    as:'product'
                }
            },{
                $project:{
                    //0 means no projection and 1 means projection
                    item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                   }
                },{
                    $group:{
                        _id:null,
                        total:{$sum:{$multiply:['$quantity','$product.Price']}}
                    }
                }
            ///this is not more working as the structure of database has been changed
            // {
            //     $lookup:{
            //         //we are taking data from product
            //         from:collection.PRODUCT_COLLECTION,
            //         //actually this is data from cart products not from product
            //         let:{proList:'$products'},
            //         pipeline:[
            //             {
            //                 $match:{
            //                     $expr:{
            //                         //now we are matching _id from product and products from cart 
            //                         $in:['$_id','$$proList']
            //                     }
            //                 }
            //             }
            //         ],
            //         //this return full details of product which are match but as object we what to later convert it
            //         as:'cartItems'
            //     }
            // }


        ]).toArray()
        //it contain all the detail but we want only the cart information thus we use this below function if not done this is the output
        // [
        //     {
        //       _id: new ObjectId("64f037bc34e3c5ad83dafd29"),
        //       user: new ObjectId("64edd9606f473ca57ccedcd0"),
        //       products: [
        //         new ObjectId("64ef02df57ed1db1c36e4dc6"),
        //         new ObjectId("64ef4a18084258d762d781ec"),
        //         new ObjectId("64ef02df57ed1db1c36e4dc6")
        //       ],
        //       cartItems: [ [Object], [Object] ]
        //     }
        //   ]
        console.log(total)
        resolve(total[0].total);
        //but after this the out put
        // [
        //     {
        //       _id: new ObjectId("64ef02df57ed1db1c36e4dc6"),
        //       Name: 'iphone 14',
        //       Price: '450000',
        //       Description: 'new phone',
        //       Category: 'mobile phone'
        //     },
        //     {
        //       _id: new ObjectId("64ef4a18084258d762d781ec"),
        //       Name: 'basil',
        //       Price: '45',
        //       Description: 'bad',
        //       Category: 'phone17'
        //     }
        //   ]

    })
   },
   placeOrder:(order,products,total)=>{
    console.log(order)
    console.log('lyf is beautiful')
    return new Promise((resolve,reject)=>{
        let status = order['payment-method']==='COD'?'placed':'pending'//like: if else
        let orderObj={
            deliveryDetails:{
                mobile:order.mobile,
                address:order.address,
                pincode:order.pincode
            },
            userId:new ObjectId(order.userId),
            PaymentMethod:order['payment-method'],
            products:products,
            totalAmount:total,
            status:status,
            date:new Date()
        }
        db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
            db.get().collection(collection.CART_COLLECTION).deleteOne({user:new ObjectId(order.userId)})

           
           
            resolve(response.insertedId)
        })

    })

   },
    
   getCartProductsList:(userId)=>{
   
    return new Promise(async(resolve,reject)=>{
        let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:new ObjectId(userId)})
        resolve(cart.products)
    })
   },
   getUserOrders:(userId)=>{
    return new Promise(async(resolve,reject)=>{
        
        let orders= await db.get().collection(collection.ORDER_COLLECTION)
        .find({userId:new ObjectId(userId)}).toArray()//study difference between find and findone
        
        resolve(orders)
    })
   },
   getOrderProducts:(orderId)=>{
    
    return new Promise(async(resolve,reject)=>{
        let orderIteams=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
            {   //so we are matching data(user) from cart and function parameter userId 
                $match:{_id:new ObjectId(orderId)
                }
            },
            {  //using unwind each product have individual user name id rather than as whole
                $unwind:'$products'
            } //now we have matched cart in on hand
            ,{
              $project:{
                item:'$products.item',
                quantity:'$products.quantity'
              }
            },
            {
                $lookup:{
                    from:collection.PRODUCT_COLLECTION,
                    localField:'item',
                    foreignField:'_id',
                    as:'product'
                }
            },{
                $project:{
                    //0 means no projection and 1 means projection
                    item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                   }
                }
           


        ]).toArray()
        
        resolve(orderIteams);
       

    })
   },
   generateRazorpay:(orderId,total)=>{
    console.log(orderId)
    console.log(total)
    
    
    return new Promise((resolve,reject)=>{
            var options ={
                amount: total,
            
                receipt:''+orderId,
                notes: {
                    key1: "value3",
                    key2: "value2"
                  }
            };
           
            instance.orders.create(options, function(err,order){
                if(err){
                    
                    console.log(err);
                }
                else{
               
                resolve(order)
                }
            })
    })
   },
   verifyPayment:(details)=>{
    return new Promise(async(resolve,reject)=>{
        const {
            createHmac,
          } = await import('node:crypto');
          
          let hmac = createHmac('sha256', '0BBnKC96BdQQ4QULcksNuyFd');
          hmac.update(details['payment[razorpay_order_id]']+'|'+details[ 'payment[razorpay_payment_id]']);
          hmac = hmac.digest('hex')
          if(hmac==details['payment[razorpay_signature]']){
            resolve()
          }
          else{
            reject()
          }
    })
   },
   changePaymentStatus:(orderId)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.ORDER_COLLECTION)
        .updateOne({_id: new ObjectId(orderId)},
        {
            $set:{
                status:'placed'
            }
        }
        ).then(()=>{
            resolve()
        })
    })
   }

}