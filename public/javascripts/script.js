const { response } = require("../../app")

function addToCart(proId){
  
    $.ajax({
        url: '/add-to-cart/'+proId,
        method:'get',
        success:(response)=>{
            if(response.status){
                let count=$('#cart-count').html()
                count=parseInt(count)+1
                $("#cart-count").html(count)
            }
          
        }
    })

}

function changeQuantity(cartId,proId,userID,count){
    let quantity=parseInt(document.getElementById(proId).innerHTML)
    count=parseInt(count)
    $.ajax({
        
        url:'/change-product-quantity',
        data:{
        user:userID,
        cart:cartId,
        product:proId,
        count:count,
        quantity:quantity
        },
        method:'post',
        success:(response)=>{
            if(response.removeProduct){
            alert('product removed from cart')
            location.reload()
            }
            else{
                document.getElementById(proId).innerHTML=quantity+count
                
                document.getElementById('total').innerHTML=response.total
                
            }
    }
    })
}
function removeQuantity(cartId,proId){

    $.ajax({
        
        url:'/change-product-remove',
        data:{
        cart:cartId,
        product:proId,
        
    },
    method:'post',
        success:(response)=>{
            console.log(response)
            if(response.removeProduct){
                alert('product removed from cart')
                location.reload()
                }
    }
})

}

function viewOrderProduct(proId){
  
    $.ajax({
        url: '/view-order-products/'+proId,
        method:'P',
        success:(response)=>{
            if(response){
                location.href = "user/place-order-products"
            }
            
        }
    })

}
