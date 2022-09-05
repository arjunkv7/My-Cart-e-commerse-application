var express = require('express');
const { log } = require('handlebars');
const replace = require('replace-in-file');
const adminHelper = require('../helpers/admin-helper');
var router = express.Router();
var productHelpers = require('../helpers/product-helper')

let verifyLogin = (req, res, next) => {
  if (req.session.adminloggedIn) {
    next()
  }
  else {
    res.render('admin/admin-login', { loginErr: req.session.loginErr ,admin:true})
    req.session.loginErr = false;
  }
}
/* GET users listing. */
router.get('/', verifyLogin, function (req, res, next) {

  productHelpers.getAllProducts().then((products) => {
    res.render('admin/view-products', { products, admin: true })
  }
  )
})

router.get('/admin-login', (req, res) => {
  res.render('admin/admin-login',{admin:true})
})

router.post("/admin-login", (req, res) => {
  console.log(req.body)
  var adminDetails=req.body

  adminHelper.getAdmin().then((result)=>{
    console.log(result)
    if (result.admin == true) {
      adminHelper.doAdminLogin(adminDetails).then((response) => {
        console.log("response")
        if (response.status == true) {
          req.session.adminloggedIn = true;
          req.session.admin = response.admin;
          res.redirect('/admin')
        }
        else {
          req.session.loginErr = "Invalid Username or Password";
          res.redirect('admin/admin-login')
        }
      })
  
    }
    else {
      
      res.render('admin/admin-signUp')
    }
  })


})


router.get('/admin-signUp',(req,res)=>{
  res.render('admin/admin-signUp')
})


router.post('/admin-signUp', (req, res) => {
  console.log("admin sign up request ")
  console.log(req.body)
  adminHelper.adminSignUp(req.body).then((result) => {
    console.log('admin data inserted successfully')
    res.redirect('/admin-login')
  })
})

router.get('/add-product',verifyLogin, (req, res) => {
  res.render('admin/add-product', { admin: true })


})
router.post('/add-product', (req, res) => {

  productHelpers.addProduct(req.body, (Id) => {
    let image = req.files.Image
    let name = image.name
    image.mv('./public/product-images/' + Id + '.jpg', (err, done) => {
      if (err) {
        res.send(err)
        console.log(err)
      } else {
        res.redirect('/admin')
      }
    })
  })
})

router.get('/delete-product/:id',verifyLogin, (req, res) => {
  let proId = req.params.id
  console.log(proId)
  productHelpers.deletePriduct(proId).then((result) => {
    console.log("Got the result")
    console.log(result)
  })
  res.redirect('/admin')

})
router.get('/edit-product/',verifyLogin, (req, res) => {

  let prodId = req.query.proId
  console.log(prodId)
  productHelpers.getProductDetails(prodId, (productDetails) => {
    console.log(productDetails)
    res.render('admin/edit-product', { productDetails, prodId ,admin:true})
  })
})
router.post("/edit-product/:id", (req, res) => {
  let proId = req.params.id
  productHelpers.updateProduct(proId, req.body).then((data) => {
    let newImage = req.files.Image
    console.log(newImage)
    newImage.mv('./public/product-images/' + proId + '.jpg')

  })
  res.redirect('/admin')
})

router.get ("/allOrders",verifyLogin,(req,res)=>{
  console.log('get order appi')
  adminHelper.getAllOrders().then((orders)=>{
    res.render("admin/all-orders",{orders,admin:true})
  })
})

router.get('/allUsers',verifyLogin,(req,res)=>{
  adminHelper.getAllUsers().then((allUsers)=>{
    res.render('admin/all-users',{allUsers,admin:true})
  })
})


module.exports = router;
