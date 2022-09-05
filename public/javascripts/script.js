

function addToCart(productId){
    $.ajax({
      url:'/add-to-cart/'+productId,
      method:'get',
      success:function(response){
        if(response.status){
          let count=$('#cart-count').html()
          count=parseInt(count)+1
          $("#cart-count").html(count)
          alert('Item added to cart')
        }
        else{
          
        }
            
          }
            
           
    })
  }

  