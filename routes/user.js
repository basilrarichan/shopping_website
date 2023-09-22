var express = require('express');
var router = express.Router();
var productHelper = require('../helpers/product-helpers')
const userHelpers= require('../helpers/user-helpers');
const { response, render } = require('../app');


const verifyLogin=(req,res,next)=>{
  if (req.session.userLoggedIn){
    next()
  }else{
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/', async function(req, res, next) {

  let user=req.session.user
  console.log(user)
  //cart count can be null when user is not loged in
  let cartCount=null
  if(req.session.user){//only work when user is logged in 
  cartCount=await userHelpers.getCartCount(req.session.user._id)
  
}
  productHelper.getAllproduct().then((products)=>{
   
    res.render('user/view-products',{admin:false,products,user,cartCount})
  })

});
router.get("/login",(req,res)=>{
  if(req.session.user){
    res.redirect('/')
  }
  else
  res.render('user/login',{"loginErr":req.session.userLoginErr})
  req.session.userLoginErr=false
})
router.get("/signup",(req,res)=>{
  res.render('user/signup')
})
router.post("/signup",(req,res)=>{
  userHelpers.doSignup(req.body).then((response)=>{
    console.log(response)
    
    req.session.user=response
    req.session.user.loggedIn=true
    res.redirect('/')
  })
  
})
router.post("/login",(req,res)=>{
  userHelpers.doLogin(req.body).then((response)=>{
    if(response.status===true){
    
      
      req.session.user=response.user
      req.session.user.loggedIn=true
      req.session.userLoggedIn=true
      res.redirect('/')
    }else{
      req.session.userLoginErr="invalid user name or password"
      res.redirect('/login')
    }

  })
 
 
})
router.get('/logout',(req,res)=>{
  req.session.user=null
  req.session.userLoggedIn=false
  res.redirect('/login')
})
router.get('/cart',verifyLogin,async(req,res)=>{

  let products= await userHelpers.getCartProducts(req.session.user._id)
  let totalValue=0
  if(products.length>0){
     totalValue=await userHelpers.getTotalAmount(req.session.user._id)
  }
  
  res.render('user/cart',{products,user:req.session.user._id,totalValue})
})

router.get('/add-to-cart/:id',(req,res)=>{
    console.log('api call')
    userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
  
    res.json({status:true})
  })

})
router.post('/change-product-quantity',(req,res,next)=>{
  console.log(req.body)

  userHelpers.changeProductQunatity(req.body).then(async(response)=>{
    response.total = await userHelpers.getTotalAmount(req.body.user)
     res.json(response)
  })
})

router.post('/change-product-remove',(req,res,next)=>{
  console.log(req.body)
  userHelpers.removeQuantity(req.body).then((response)=>{
    
     res.json(response)
  })
})
router.get("/place-order",verifyLogin,async(req,res)=>{
  let total = await userHelpers.getTotalAmount(req.session.user._id)
  res.render('user/place-order',{total,user:req.session.user})
})
router.post('/place-order',async(req,res)=>{
  
  let products=await userHelpers.getCartProductsList(req.body.userId)
  let totalPrice=await userHelpers.getTotalAmount(req.body.userId)
  userHelpers.placeOrder(req.body,products,totalPrice).then((orderId)=>{
    if(req.body['payment-method']==='COD'){
      res.render('user/order-success',{user:req.session.user})
      res.json({codSuccess:true})
    // res.json(status:true) their is some error
    }
    else{
     
      userHelpers.generateRazorpay(orderId,totalPrice).then((response)=>{
       
       
        res.json(response)
        

      })
    }
    

  })
  
})
router.get('/order-success',(req,res)=>{
  res.render('user/order-success',{user:req.session.user})
})
router.get('/orders',async(req,res)=>{
  let orders=await userHelpers.getUserOrders(req.session.user._id)

  res.render('user/orders',{user:req.session.user,orders})
})
router.get('/view-order-products/:id',async(req,res)=>{
  
  let products = await userHelpers.getOrderProducts(req.params.id)

  
  console.log(products)
  
  res.render('user/view-order-products',{user:req.session.user,products})
  

  
})
router.post('/verify-payment',(req,res)=>{
  console.log(req.body)
  userHelpers.verifyPayment(req.body).then(()=>{
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
      console.log('payment syccessfull')
      res.json({status:true})
    })

  }).catch((err)=>{
    console.log(err);
    res.json({status:false,errMsg:''})
  })
})

module.exports = router;

