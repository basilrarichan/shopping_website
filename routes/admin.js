var express = require('express');
const {render} = require('../app')
var router = express.Router();
var productHelper = require('../helpers/product-helpers')

/* GET users listing. */
router.get('/', function(req, res, next) {
  
  productHelper.getAllproduct().then((products)=>{
    console.log(products)
    res.render('admin/view-products',{admin:true,products})
  })
  
});
router.get('/add-product',function(req,res){
  res.render('admin/add-product')
})
router.post('/add-product',(req,res)=>{
  console.log(req.body)
  console.log(req.files.image)
  productHelper.addProduct(req.body,(product_id)=>{
    console.log(product_id)
    let image=req.files.image
    image.mv('./public/product-images/'+product_id+'.jpg',(err,done)=>{
      if(!err){
        res.render('admin/add-product')
      }
      else{
        console.log('err')
      }
    })
    res.render("admin/add-product")
  })
})
router.get('/delete-product/:id',(req,res)=>{
  let proId=req.params.id
  console.log(proId);
  productHelper.deleteProduct(proId).then((response)=>{
    res.redirect('/admin')
  })
  
})

module.exports = router;
