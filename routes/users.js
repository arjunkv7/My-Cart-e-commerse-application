const { response } = require('express');
var express = require('express');
const async = require('hbs/lib/async');
const { CURSOR_FLAGS } = require('mongodb');
var router = express.Router();
var productHelpers = require('../helpers/product-helper');
const userHelper = require('../helpers/user-helper');
var usrHelpers = require('../helpers/user-helper')


const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {

    next()
  } else {
    res.redirect('/login')
    next()
  }
}

/* GET home page. */

router.get('/', async function (req, res, next) {
  let user = req.session.user

  let cartCount = 0
  if (user) {
    let count = await usrHelpers.getCartCount(req.session.user._id)
    cartCount = count[0].quantity
  }
  productHelpers.getAllProducts().then((allProducts) => {
    products = allProducts.slice(0, 8)
    res.render('./users/homePage', { products, admin: false, user, cartCount });
  })

});
//Get login page
router.get('/login', (req, res) => {
  console.log('login req')
  if (req.session.loggedIn) {
    res.redirect('/')
    console.log('login inside')
  }
  else {
    res.render('./users/login', { loginErr: req.session.loginErr })
    req.session.loginErr = false
    console.log('login outside')
  }
})


//Do login

router.post('/login', (req, res) => {
  console.log(req.body)
  userHelper.doLogin(req.body).then((response) => {
    if (response.user) {
      req.session.loggedIn = true
      req.session.user = response.user
      res.redirect('/')
    }
    else {
      req.session.loginErr = "Invalid Username or Password"
      res.redirect('/login')
    }
  })
})

//Get signUp page

router.get('/signup', (req, res) => {
  res.render('./users/signup')
})

//Do signUp

router.post('/signup', (req, res) => {
  usrHelpers.doSignUp(req.body).then((response) => {
    req.session.loggedIn = true
    req.session.user = response.user
  })
  res.redirect("/")

})

//Do logout

router.get('/logout', (req, res) => {
  req.session.destroy()
  res.redirect('/')
})

//get cart



//create cart

router.get('/cart', verifyLogin, async (req, res) => {
  let userId = req.session.user._id
  console.log(userId)

  await userHelper.userCart(userId).then(async (result) => {
    let cartProducts = await userHelper.getCartProducts(userId)

    console.log(cartProducts)
    res.render('./users/cart', { cartProducts, user: req.session.user })


  })

})

//add items to cart

router.get('/add-to-cart/:id', (req, res) => {
  console.log('api call');
  var user = req.session.user;
  if (user) {
    userHelper.addtoCart(req.session.user._id, req.params.id).then((data) => {
      console.log(data)
      res.json({ status: true })
    })
  }
  else {
    console.log('addtocart else case')
    res.json({ status:false })
    

  }

})

router.post('/change-cart-quantity', (req, res, next) => {
  console.log("new api call")
  let num = (req.body.num)
  num = parseFloat(num)
  console.log(num)
  userHelper.changeCartquantity(req.session.user._id, req.body.product, num)
  res.json({ result: true })
})

router.get('/remove-item/:prodId', (req, res) => {
  let userId = req.session.user._id
  let prodId = req.params.prodId
  console.log(userId, prodId)
  userHelper.removeCartItem(userId, prodId).then((result) => {
    console.log(result)
    res.send(result)
  })
})

router.get('/proceed-order/', verifyLogin, async (req, res) => {
  console.log('haiiii')
  let cart = await userHelper.getCartCount(req.session.user._id)
  let cartCount = cart[0].quantity
  let cartPrice = await userHelper.getCartProducts(req.session.user._id)
  console.log(cartPrice)
  res.render('./users/check-out', { cartPrice, cartCount, user: req.session.user._id })

})
router.post("/place-order/", verifyLogin, async (req, res) => {
  console.log("order reached")
  let order = req.body
  console.log(order)
  let user = req.session.user._id
  let products = await userHelper.getCartOrderProducts(user)
  let amount = parseInt(order.amount)
  console.log(products)

  userHelper.placeOrder(user, order, products.products).then((result) => {
    console.log(result)
    console.log(amount)
    if (order['payment-method'] === "cod") {
      console.log("payment cod")
      res.json({ cod: true })
    }
    else {
      console.log("razor pay result")
      userHelper.generateRazorpay(result, amount).then((response) => {
        console.log("razor pay result")
        res.json(response)
      })

    }
  })

})

router.get("/order-placed", verifyLogin, (req, res) => {
  console.log("got the order placed req")
  res.render("./users/order-placed")
})

router.get("/orders/", async (req, res) => {
  console.log("orders arrived")
  let userId = req.session.user._id
  var orderDetails = await userHelper.getOrders(userId)

  //console.log(orderProducts)
  //console.log(orderDetails)
  res.render("./users/view-orders", { orderDetails })
})

router.get("/view-order-products/:orderId", verifyLogin, async (req, res) => {
  let orderId = req.params.orderId
  var user = req.session.user._id
  let products = await userHelper.getOrderProducts(orderId, user)

  console.log(products)
  res.render("./users/view-order-products", { products })
})

router.post("/verify-payment/", (req, res) => {
  console.log(req.body)
  console.log("payment verify api")
  userHelper.verifyPayment(req.body).then(() => {
    console.log('payment verified successfully ')
    userHelper.updatePaymentstatus(req.body['order[receipt]']).then((data) => {
      console.log('payment updated')
      res.json({ payment: true })
    })

  }).catch(() => {
    console.log('payment failed')
  })

})

router.get('/product', (req, res) => {
  res.render('./users/product-details')
})

router.get('/view-products', (req, res) => {
  productHelpers.getAllProducts().then((products) => {
    res.render('./users/view-products', { products })
  })

})





module.exports = router;
