
const bcrypt = require('bcryptjs/dist/bcrypt');
const { log } = require('handlebars');
const async = require('hbs/lib/async');
const ObjectId = require('mongodb').ObjectId
const { reject, resolve } = require('promise');
const { USER_DATA, PRODUCT_COLLECTION } = require('../config/collections');
const collection = require('../config/collections');
var db = require('../config/connection')
var Razorpay=require("razorpay")


var instance = new Razorpay({
    key_id: 'rzp_test_OmG04rRbthJLub',
    key_secret: 'wdMPe0yV3rKBHqY9pRuyRg1e',
  });

module.exports = {
    doSignUp: (userData) => {
        return new Promise(async (resolve, reject) => {
            userData.Password = await bcrypt.hash(userData.Password, 10)
            db.get().collection(collection.USER_DATA).insertOne(userData, (err, data) => {
                if (err) {
                    console.log(err)
                    reject(err)
                }
                else {
                    console.log(data)
                    resolve(data)
                }
            })

        })
    },

    doLogin: (loginData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collection.USER_DATA).findOne({ Email: loginData.Email })
            if (user) {
                bcrypt.compare(loginData.Password, user.Password, (err, status) => {
                    if (status) {
                        loginStatus = true
                        response.user = user;
                        response.status = true;
                        console.log("login success")
                        resolve(response)
                    }
                    else {
                        console.log("login faile")
                        resolve({ loginStatus: false })
                    }
                })
            }
            else {
                resolve({ loginStatus: false })
            }
        })
    },

    userCart: (userId) => {
        return new Promise(async (resolve, reject) => {
            let usercart = false
            let result = {}
            let cart = await db.get().collection(collection.USER_CART).findOne({ user: ObjectId(userId) })
            if (cart) {
                usercart = true
                result.user = cart
                resolve()
            }

            else {
                let cartObj = {
                    user: ObjectId(userId),
                    products: []
                }
                await db.get().collection(collection.USER_CART).insertOne(cartObj, (err, result) => {
                    if (err)
                        console.log(err)
                    else
                        console.log("cart created")
                    resolve(result)
                })
            }
        })
    },

    addtoCart: (userId, productId) => {
        return new Promise(async (resolve, reject) => {
            let prodObj = {
                item: ObjectId(productId),
                quantity: 1
            }

            let cart = await db.get().collection(collection.USER_CART).findOne({ user: ObjectId(userId) })
            console.log(cart)
            if (cart) {

                let proExist = cart.products.findIndex(product => product.item == productId)
                console.log(proExist)
                if (proExist != -1) {

                    db.get().collection(collection.USER_CART).updateOne({ 'products.item': ObjectId(productId), 'user': ObjectId(userId) },
                        {
                            $inc: { 'products.$.quantity': 1 }
                        }, (err, result) => {
                            resolve(result)
                            console.log()
                        })
                }
                else {

                    db.get().collection(collection.USER_CART).updateOne({ user: ObjectId(userId) },
                        {
                            $push: {
                                products: prodObj
                            }
                        }, (err, data) => {

                            resolve(data)
                        })
                }
            }
            else {
                let cartObj = {
                    user: ObjectId(userId),
                    products: [prodObj]
                }
                db.get().collection(collection.USER_CART).insertOne(cartObj, (data) => {
                    console.log(data + "  cart created and product added to the cart")
                    resolve()
                })
            }
        })
    },
    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {

            let cart = await db.get().collection(collection.USER_CART).findOne()

            if (cart) {
                let products = await db.get().collection(collection.USER_CART).aggregate([
                    {
                        $match: { user: ObjectId(userId) }

                    },
                    {
                        $unwind: '$products'
                    },
                    {
                        $project: {
                            item: '$products.item',
                            quantity: '$products.quantity',
                            user:"$user"
                            
                            
                        }
                    },
                    {
                        $lookup: {
                            from: PRODUCT_COLLECTION,
                            localField: 'item',
                            foreignField: '_id',
                            as: 'cartItems',

                        },
                        
                    },
                   
                    {
                        $project: {
                            item: 1,
                            quantity: 1,
                            price:'$cartItems.Price',
                            cartItems:1,
                            user:1
  
                        }

                    },
                    {
                        $unwind:'$price'
                    },
                    {
                        $project: {
                            item: 1,
                            quantity: 1,
                            user:1,
                            totalPrice:{$multiply:['$quantity',{$toInt:'$price'}]},
                            cartItems:1,
                             
                        }

                    },
                    
                    {
                        $project: {
                            item: 1,
                            quantity: 1,
                            cartItems:1,
                            totalPrice:1,
                            user:1,
                                                       
                          }
                    }
                    
                    
                    

                ]).toArray()
                
                let amount=0
                products.forEach(element => {amount+=element.totalPrice });
                    //console.log(amount)
                resolve({products,amount})
                
                    
            }
        })

    },
    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartCount = 0
            let cart = await db.get().collection(collection.USER_CART).findOne({ user: ObjectId(userId) })
            // console.log(cart)
            if (cart) {
                //cartCount = cart.products.length
                let cartCount = await db.get().collection(collection.USER_CART).aggregate([
                    {
                        $match: { user: ObjectId(userId) }
                    },
                    {
                        $project: {
                            quantity: { '$sum': '$products.quantity' }
                        }
                    },

                ]).toArray()
                //console.log(cartCount)
                resolve(cartCount)
            }

        })
    },
    changeCartquantity: (userId, prodId,count) => {
        return new Promise((resolve, reject) => {
           
           // console.log(count)


            db.get().collection(collection.USER_CART).updateOne({ user: ObjectId(userId),'products.item': ObjectId(prodId) }, {
                 
                    $inc: { 'products.$.quantity': count }
                
            }, (err, result) => {
               if(err)
                console.log(err)
                else
                //console.log(result)
                resolve(result)
            })
        })
    },

    removeCartItem:(user,prodId)=>{
        return new Promise((resolve,reject)=>{

        db.get().collection(collection.USER_CART).updateOne({user:ObjectId(user)},{$pull:{products:{item:ObjectId(prodId)}}},(err,result)=>{
            if(err)
            console.log(err)
            else
            //console.log(result)
            resolve({itemDeleted:true})
        })
    })
    },

    getCartOrderProducts:(userId)=>{
        return new Promise( async(resolve,reject)=>{
           let products=await db.get().collection(collection.USER_CART).findOne({user:ObjectId(userId)},(err,result)=>{
            if(err)
            console.log(err)
            else 
            resolve(result)
            //console.log(result)
           })
                    
        })
        
    },

    placeOrder:(user,order,products)=>{
        return new Promise (async (resolve,reject)=>{
         let status= order['payment-method']==="cod"?'Cash on delevery':'pending'
        
           
                let orderObj={
                    user:ObjectId(user),
                    delevery:{
                        name:order.name,
                        house:order.house,
                        landmark:order.landmark,
                        pincode:order.pincode,
                        city:order.city,
                        mobile:order.mobile,
                        
                       },
                    products:products,
                    payment:status,
                    amount:order.amount,
                    dateOfOrder:new Date()
   

                }
                
                await db.get().collection(collection.USER_ORDERS).insertOne(orderObj,(err,data)=>{
                    if(err)
                    console.log (err)
                    else console.log(data)
                    db.get().collection(collection.USER_CART).deleteOne({user:ObjectId(user)})
                    resolve(data.insertedId)
                    console.log(data.insertedId)
                })              
            }
        )
    },

    getOrders:(userId)=>{
        return new Promise(async (resolve,reject)=>{
          let orderItems= await db.get().collection(collection.USER_ORDERS).find({user:ObjectId(userId)}
          ).toArray()
          //console.log(orderItems)
          resolve(orderItems)

    })
    },

    getOrderProducts:(orderId,userId)=>{
        return new Promise (async(resolve,reject)=>{
            let orderProducts=await db.get().collection(collection.USER_ORDERS).aggregate([
                {
                    $match:{
                       
                        _id:ObjectId(orderId)
                    }
                },
                {
                    $unwind:"$products"
                },
                 {
                    $project:{
                      item:"$products.item",
                        quantity:"$products.quantity",        
                    }
                },
                {
                    $lookup:{
                        from:PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:"orderItems"
                    }
                },
                {
                    $project:{
                        user:1,orderItems:1,item:1,quantity:1,Price:'$orderItems.Price'
                    }
                }
               ]).toArray()
            console.log(orderProducts)
            resolve(orderProducts)  
        })
    },

    generateRazorpay:(orderId,amount)=>{
    return new Promise((resolve,reject)=>{
       var options={
            amount: amount * 100,
            currency: "INR",
            receipt: orderId .toString()
       }
           
       instance.orders.create(options,(err,data)=>{
            if(err)
            console.log(err)
            else
            console.log(data)
            resolve(data)
           
          })
         
        })
    },

    verifyPayment:(details)=>{
         return new Promise ((resolve,reject)=>{
            var crypto=require('crypto')
            var hmac = crypto.createHmac('sha256', 'wdMPe0yV3rKBHqY9pRuyRg1e');
            hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]']);
            hmac=hmac.digest('hex')
            if(hmac===details[ 'payment[razorpay_signature]']){
            console.log('payment successs')
            resolve()
            }
            else
            reject() 

         })
    },

    updatePaymentstatus:(orderId)=>{
        return new Promise ((resolve,reject)=>{
            db.get().collection(collection.USER_ORDERS).updateOne({_id:ObjectId(orderId)},{$set:{payment:'success'}},(err,data)=>{
                if(err)
                console.log(err)
                else 
                console.log(data)

                resolve({paymentUpdated:true})
            })
        })
    }




}
