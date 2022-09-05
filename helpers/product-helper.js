const { promiseCallback } = require('express-fileupload/lib/utilities');
const fs = require('fs');
const async = require('hbs/lib/async');
const { ObjectId } = require('mongodb');
const { resolve, reject } = require('promise');
const collections = require('../config/collections');
const collection = require('../config/collections');
var db=require('../config/connection')
var objectId=require("mongodb").ObjectId

module.exports={

    addProduct:(product,callback)=>{
      

        db.get().collection('product').insertOne(product,(err,data)=>{
            if(!err)
            console.log(data);
            callback(data.insertedId)
    })
    },
    getAllProducts:()=>{
        return new Promise(async(resolve, reject) => {
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
            console.log(products)
            
        })
    },
    deletePriduct:(productId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.PRODUCT_COLLECTION).deleteOne({_id:ObjectId(productId)},(err,data)=>{
                resolve(data)
               fs.unlink('./public/product-images/'+ObjectId(productId)+'.jpg',(err,data)=>{
               
                console.log('image deleted')
               })
            })
               
            })   
    },
    getProductDetails:(productId,callback)=>{
        db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:ObjectId(productId)},(err,data)=>{
            if(err)
            console.log(err)
            else console.log(data)
            callback(data)
        })
     
        },
        updateProduct:(productId,productData)=>{
            return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:ObjectId(productId)},{
                $set:{
                    Name:productData.Name,
                    Description:productData.Description,
                    Price:productData.Price,
                    Category:productData.Category

                }
            },(data)=>{
                console.log(data)
                console.log('data updated successfully')
                resolve(data)
            })
        })
    }
    
}