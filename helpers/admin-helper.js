const bcrypt = require("bcryptjs/dist/bcrypt")
const { response } = require("express")
const async = require("hbs/lib/async")
var db = require('../config/connection')
const { resolve, reject } = require("promise")
const collections = require("../config/collections")

module.exports = {
    getAdmin: function () {
        return new Promise(async(resolve, reject) => {
            console.log('get admin')
         let admin=await   db.get().collection(collections.ADMIN_DETAILS)
         
                if (admin) {
                  
                    resolve({admin:true})
                }
                else{
                   
                    resolve({admin:false})
                }
    
            })
        
    },

    doAdminLogin: (loginDetails) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false;
            let response = {}
            let admin = await db.get().collection(collections.ADMIN_DETAILS).findOne({ Email: loginDetails.Email })
            console.log(admin)

            if (admin) {
                bcrypt.compare( loginDetails.Password,admin.Password, (err, data) => {
                    if (data) {
                        loginStatus = true;
                        response.admin = admin;
                        response.status = true;
                        resolve(response)
                    }
                    else if (err) {
                        console.log(err)
                    }
                    else {
                        console.log("login Failed")
                        resolve({ loginStatus: false })
                    }
                })
            }

        })

    },

    adminSignUp:(signUpdata)=>{
        return new Promise (async(resolve,reject)=>{
            signUpdata.Password = await bcrypt.hash(signUpdata.Password,10)
            db.get ().collection(collections.ADMIN_DETAILS).insertOne((signUpdata),(err,data)=>{
                if (data){
                    console.log(data)
                    resolve(data)
                }
                else{
                    console.log(err)
                }
            })
        })
    },

    getAllOrders:()=>{
        return new Promise (async(resolve,reject)=>{     
        let orders=await db.get().collection(collections.USER_ORDERS).find().toArray()
        console.log(orders)
        resolve(orders)
    })
    },

    getAllUsers:()=>{
        return new Promise(async(resolve,reject)=>{
          let allUsers=await  db.get().collection(collections.USER_DATA).find().toArray()
          resolve(allUsers)
        })
    }


}