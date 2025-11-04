const cartModel = require("../models/cartModel");
const productModel = require("../models/productModel");
const userModel = require("../models/userModel.js");
const mongoose = require("mongoose");

const isValidRequestBody = (data) => {
  if (Object.keys(data).length === 0) {
    return false;
  }
  return true;
};

const isValidObjectId = (value) => {
  return mongoose.Types.ObjectId.isValid(value);
};
const isValid = (value) => {
  if (typeof value == "undefined" || value == null) return false;
  if (typeof value == "string" && value.trim().length === 0) return false;
  if (typeof value == "number" && value === null) return false;
  return true;
};




/**************************CREATE CART************************/




const createCart = async (req, res) => {
  try {
    let data = req.body;
    console.log(data);
    let userLoggedIn = req.tokenData.userId;
    if (Object.keys(data).length == 0)
      return res
        .status(400)
        .send({ status: false, message: "Body cannot be empty" });

    let userId = req.params.userId;
    if (!isValidObjectId(userId))
      return res
        .status(400)
        .send({ status: false, message: "Invalid userId Id" });

    //getting token from req in auth
    if (userId != userLoggedIn) {
      return res
        .status(403)
        .send({ status: false, msg: "Error, authorization failed" });
    }
    let { productId, cartId, quantity } = data;
    if (!isValid(productId))
      return res
        .status(400)
        .send({ status: false, message: "productId required" });
    if (!isValidObjectId(productId))
      return res
        .status(400)
        .send({ status: false, message: "Invalid product ID" });

    if (!quantity) {
      quantity = 1;
    }

    quantity = Number(quantity);
    console.log(quantity);
    if (typeof quantity !== "number")
      return res
        .status(400)
        .send({ status: false, message: "quantity must be a number" });
    if (quantity < 1)
      return res
        .status(400)
        .send({ status: false, message: "quantity cannot be less then 1" });

    // checking cartId
    if (cartId) {
      if (!isValidObjectId(cartId))
        return res
          .status(400)
          .send({ status: false, message: "Invalid cart ID" });
    }

    //checking for valid user
    let validUser = await userModel.findOne({ _id: userId });
    if (!validUser)
      return res
        .status(404)
        .send({ status: false, message: "User does not exists" });

    if (cartId) {
      var findCart = await cartModel.findOne({ _id: cartId });
      if (!findCart)
        return res
          .status(404)
          .send({ status: false, message: "Cart does not exists" });
    }

    // user authorization
    if (validUser._id.toString() !== userLoggedIn)
      return res
        .status(403)
        .send({ status: false, message: "Unauthorized access" });

    //searching for product
    let validProduct = await productModel.findOne({
      _id: productId,
      isDeleted: false,
    });
    if (!validProduct)
      return res.status(404).send({
        status: false,
        message: "No products found or product has been deleted",
      });

    let validCart = await cartModel.findOne({ userId: userId });
    if (!validCart && findCart) {
      return res
        .status(403)
        .send({ status: false, message: "Cart does not belong to this user" });
    }
    if (validCart) {
      if (cartId) {
        if (validCart._id.toString() != cartId)
          return res.status(403).send({
            status: false,
            message: "Cart does not belong to this user",
          });
      }
      let productidincart = validCart.items;
      //console.log(productidincart)
      let uptotal =
        validCart.totalPrice + validProduct.price * Number(quantity);
      let proId = validProduct._id.toString();
      for (let i = 0; i < productidincart.length; i++) {
        let productfromitem = productidincart[i].productId.toString();

        //updates old product i.e QUANTITY

        if (proId == productfromitem) {
          // matching
          let oldQuant = productidincart[i].quantity; // adding
          let newquant = oldQuant + quantity;
          productidincart[i].quantity = newquant;
          validCart.totalPrice = uptotal;
          await validCart.save();

          console.log(validCart);

          return res
            .status(201)
            .send({ status: true, message: "Success", data: validCart });
        }
      }
      //adds new product
      validCart.items.push({
        productId: productId,
        quantity: Number(quantity),
      });
      let total = validCart.totalPrice + validProduct.price * Number(quantity);
      validCart.totalPrice = total;
      let count = validCart.totalItems;
      validCart.totalItems = count + 1;
      await validCart.save();
      return res
        .status(201)
        .send({ status: true, message: "Success", data: validCart });
    }

    // 1st time cart
    let calprice = validProduct.price * Number(quantity);
    let obj = {
      userId: userId,
      items: [
        {
          productId: productId,
          quantity: quantity,
        },
      ],
      totalPrice: calprice,
    };
    obj["totalItems"] = obj.items.length;
    console.log(obj)
    let result = await cartModel.create(obj);
    
    return res
      .status(201)
      .send({ status: true, message: "Success", data: result });
  } catch (err) {
   
    return res.status(500).send({ status: false, err: err.message });
    
  }
  
};





/*********************GET CART*******************/




const getCart = async function (req, res) {
  try {
    let userId = req.params.userId;
    if (!isValid(userId))
      return res.status(400).send({ status: false, msg: "invalid userId" });
    if (!isValidObjectId(userId))
      return res
        .status(400)
        .send({ status: false, msg: "incorrect user Id ." });
    let user = await userModel.findOne({ _id: userId });
    if (!user) {
      return res.status(404).send({
        status: false,
        msg: "No such user found. Please register and try again",
      });
    }
    let checkCart = await cartModel.findOne({ userId });
    if (!checkCart) {
      return res.status(400).send({ status: false, message: "cart not found" });
    }
    if (checkCart) {
      return res
        .status(200)
        .send({ status: true, msg: "Your cart", data: checkCart });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).send({ status: false, message: err.message });
  }
};

/**********************UPDATE CART***********************/
// const updateCart = async function (req, res) {
//   try {
//     let data = req.body;
//     let userId = req.params.userId;
//     userLoggedIn=req.userId

//     if(!isValidObjectId(userId))return res.status(400).send({status:false,msg:"UserId is Not valid"})
//     if(!isValid(userId))return res.status(400).send({status:false,msg:"userId required"})
   
    
//     let user= await userModel.findOne({userId})
//     if(!user){
//       return res.status(404).send({status:false,msg:"Oops !! User Not Found......"})
//     }
//     // if(userLoggedIn._id.toString() != user){
//     //   return res.status(403).send({status:false,msg:"Oyeeee You  not Authorised  For this Action Please tell to real person OK ! "})
//     // }

//     let { cartId, productId,removeProduct} =data
//     if(!isValidRequestBody(data))return res.status(400).send({status:false,msg:"Please give any data to update"})
//     if(!(isValid(cartId)&& isValidObjectId(cartId)))return res.status(400).send({status:false,msg:"Cart Id is not Available or its Invalid"})

//     let cart = await cartModel.findById({_id:cartId})
//     if(!cart){
//       return res.status(404).send({status:false,msg:"Cart is not found for this cartid"})
//     }

//     if(!(isValid(productId) && isValidObjectId(productId)))return res.status(400).send({status:false,msg:"ProductId is Invalid or it's Missing"})
    
//     let product= await productModel.findOne({_id:productId,isDeleted:false})
//     if(!product){
//       return res.status(404).send({status:false,msg:"Product Not Found for this ProductId"})
//     }
  
//   let isProductAvailableInCart= await cartModel.findOne({productId:productId})
//   if(!isProductAvailableInCart){
//     return res.sttaus(404).send({status:false,msg:"Cart not found for this Product Id"})
//   }
  
//   if(isProductAvailableInCart &&  removeProduct==1){
//     let count = cart.quantity
//     cart.quantity = count -1

//   }





// //   if(!(removeProduct==0 || removeProduct==1)){
// //     return res.status(400).send({status:false,msg:"removedProduct should be  0 or 1"})
// //   }

// //   if(!(removeProduct==0))
// // {
// //   let 
// // }
     
// // if(removeProduct==1)
// // {
// //   let AllItems =cart.items
// //   let NewPrice =  cart.price - product.price

    



//   } catch (err) {
//     console.log(err);
//     return res.status(500).send({ status: false, message: err.message });
//   }
// };


const updateCart = async function (req, res) {
  try {
      const userId = req.params.userId
      if (!isValidObjectId(userId)) {
          return res.status(400).send({ status: false, message: "Invalid user id" })
      }
      let userDetails = await userModel.findById(userId)
      if (!userDetails) {
          return res.status(404).send({ status: false, message: "user not found" })
      }
      //-------------------------------------checking Authorizaton------------------------->>
    

      if (!isValidRequestBody(req.body)) {
          return res.status(400).send({ status: false, message: "Invalid request.Please provide details to update" })
      }

      const { cartId, productId,removeProduct } = req.body

      if (!(isValid(removeProduct) && (removeProduct == 0 || removeProduct == 1))) {
          return res.status(400).send({ status: false, message: "removeProduct key is required and its value can be either 0 or 1" })
      }
      //validating cartId
      if(!isValid(cartId)){
          return res.status(400).send({ status: false, message: "CartId is required to update cartDetails" })
      }
      if (!isValidObjectId(cartId)) {
          return res.status(400).send({ status: false, message: "Invalid cartid" })
      }
      let isCartExist = await cartModel.findOne({ _id: cartId})
      if (!isCartExist) {
          return res.status(404).send({ status: false, message: "No cart with this Id found" })
      }

      if (isCartExist.userId != userId) {
        return res.status(403).send({ status: false, message: "User logged is not allowed to update the cart details" })
    }

      //validating ProductId
      if(!isValid(productId)){
          return res.status(400).send({ status: false, message: "productId is required to update cartDetails" })
      }
     
      if (!isValidObjectId(productId)) {
          return res.status(400).send({ status: false, message: "Invalid productid" })
      }

      let productExist = await productModel.findOne({ _id: productId, isDeleted: false })
      if (!productExist) {
          return res.status(404).send({ status: false, message: "No Product with this Id found" })
      }
      let priceOfProduct=productExist.price

      

          //checking if product exist in cart
          let  productExistInCart=0
          let qty=0
           for(let i in isCartExist.items){
               if(isCartExist.items[i].productId==productId){
                   productExistInCart=1
                   qty=isCartExist.items[i].quantity
               }
           }
           if(productExistInCart==0){
              return res.status(404).send({ status: false, message: "No Product with this Id found in the cart" })
           }

           let filter={
              _id: cartId,
             "items.productId":productId,
             userId:userId        
           }
     if (removeProduct == 0||qty==1) {
           let update={
          $pull:{items:{productId:productId}},
          $inc: { totalPrice: - 1*qty*priceOfProduct ,totalItems:-1}
      }
          productExistInCart = await cartModel.findOneAndUpdate(filter,update,{ new: true })
          if (!productExistInCart) {
          return res.status(404).send({ status: false, message: "No Product with this Id found in this Cart for current user" })
          }
          productExistInCart["_doc"]["productdetails"] = productExist
          return res.status(200).send({ status: true, message: "Success", data: productExistInCart })
      }
      if (removeProduct == 1) {
         
          let update = {
          $inc: {totalPrice:-1*priceOfProduct,
          "items.$.quantity":-1 }
          }
          productExistInCart = await cartModel.findOneAndUpdate(filter, update, { new: true })
          
          if (!productExistInCart) {
              return res.status(404).send({ status: false, message: "No Product with this Id found in this Cart for current user" })
          }
      
      productExistInCart["_doc"]["productdetails"] = productExist
      res.status(200).send({ status: true, message: "Success", data: productExistInCart })

  }
}
  catch (err) {
      res.status(500).send({ status: false, Error: err.message });
  }
}


/********************DELETE CART***********************/




const deleteCart = async function (req, res) {
  try {
    let userId = req.params.userId;
    if (!isValid(userId))
      return res.status(400).send({ status: false, msg: "invalid userId" });
    if (!isValidObjectId(userId))
      return res
        .status(400)
        .send({ status: false, msg: "user Id is nor=t correct." });
    let user = await userModel.findOne({ _id: userId });
    if (!user) {
      return res.status(404).send({
        status: false,
        msg: "No such user found. Please register and try again",
      });
    }
    let checkCart = await cartModel.findOne({ userId });
    if (!checkCart) {
      return res.status(400).send({ status: false, message: "cart not found" });
    }
    let deleteCart = await cartModel.findOneAndUpdate(
      { userId: userId }, //find
      { items: [], totalPrice: 0, totalItems: 0 }, //conditom
      { new: true }
    );
    return res.status(204).send({ status: true, msg: "✔️Your Cart is deleted✔️ " });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ status: false, message: err.message });
  }
};

module.exports = { createCart, getCart, updateCart, deleteCart };




























/*const cartModel = require("../models/cartModel");
const productModel = require("../models/productModel");
const userModel = require("../models/userModel.js");
const mongoose = require("mongoose");

const isValidRequestBody = (data) => {
  if (Object.keys(data).length === 0) {
    return false;
  }
  return true;
};

const isValidObjectId = (value) => {
  return mongoose.Types.ObjectId.isValid(value);
};
const isValid = (value) => {
  if (typeof value == "undefined" || value == null) return false;
  if (typeof value == "string" && value.trim().length === 0) return false;
  if (typeof value == "number" && value === null) return false;
  return true;
};

/***********CREATE CART*************/

// const createCart = async (req, res) => {
//   try {
//     let data = req.body;
//     console.log(data);
//     let userLoggedIn = req.tokenData.userId;
//     if (Object.keys(data).length == 0)
//       return res
//         .status(400)
//         .send({ status: false, message: "Body cannot be empty" });

//     let userId = req.params.userId;
//     if (!isValidObjectId(userId))
//       return res
//         .status(400)
//         .send({ status: false, message: "Invalid userId Id" });

//     //getting token from req in auth
//     if (userId != userLoggedIn) {
//       return res
//         .status(403)
//         .send({ status: false, msg: "Error, authorization failed" });
//     }
//     let { productId, cartId, quantity } = data;
//     if (!isValid(productId))
//       return res
//         .status(400)
//         .send({ status: false, message: "productId required" });
//     if (!isValidObjectId(productId))
//       return res
//         .status(400)
//         .send({ status: false, message: "Invalid product ID" });

//     if (!quantity) {
//       quantity = 1;
//     }

//     quantity = Number(quantity);
//     console.log(quantity);
//     if (typeof quantity !== "number")
//       return res
//         .status(400)
//         .send({ status: false, message: "quantity must be a number" });
//     if (quantity < 1)
//       return res
//         .status(400)
//         .send({ status: false, message: "quantity cannot be less then 1" });

//     // checking cartId
//     if (cartId) {
//       if (!isValidObjectId(cartId))
//         return res
//           .status(400)
//           .send({ status: false, message: "Invalid cart ID" });
//     }

//     //checking for valid user
//     let validUser = await userModel.findOne({ _id: userId });
//     if (!validUser)
//       return res
//         .status(404)
//         .send({ status: false, message: "User does not exists" });

//     if (cartId) {
//       var findCart = await cartModel.findOne({ _id: cartId });
//       if (!findCart)
//         return res
//           .status(404)
//           .send({ status: false, message: "Cart does not exists" });
//     }

//     // user authorization
//     if (validUser._id.toString() !== userLoggedIn)
//       return res
//         .status(403)
//         .send({ status: false, message: "Unauthorized access" });

//     //searching for product
//     let validProduct = await productModel.findOne({
//       _id: productId,
//       isDeleted: false,
//     });
//     if (!validProduct)
//       return res.status(404).send({
//         status: false,
//         message: "No products found or product has been deleted",
//       });

//     let validCart = await cartModel.findOne({ userId: userId });
//     if (!validCart && findCart) {
//       return res
//         .status(403)
//         .send({ status: false, message: "Cart does not belong to this user" });
//     }
//     if (validCart) {
//       if (cartId) {
//         if (validCart._id.toString() != cartId)
//           return res.status(403).send({
//             status: false,
//             message: "Cart does not belong to this user",
//           });
//       }
//       let productidincart = validCart.items;
//       let uptotal =
//         validCart.totalPrice + validProduct.price * Number(quantity);
//       let proId = validProduct._id.toString();
//       for (let i = 0; i < productidincart.length; i++) {
//         let productfromitem = productidincart[i].productId.toString();

//         //updates old product i.e QUANTITY

//         if (proId == productfromitem) {
//           // matching
//           let oldQuant = productidincart[i].quantity; // adding
//           let newquant = oldQuant + quantity;
//           productidincart[i].quantity = newquant;
//           validCart.totalPrice = uptotal;
//           await validCart.save();

//           console.log(validCart);

//           return res
//             .status(200)
//             .send({ status: true, message: "Success", data: validCart });
//         }
//       }
//       //adds new product
//       validCart.items.push({
//         productId: productId,
//         quantity: Number(quantity),
//       });
//       let total = validCart.totalPrice + validProduct.price * Number(quantity);
//       validCart.totalPrice = total;
//       let count = validCart.totalItems;
//       validCart.totalItems = count + 1;
//       await validCart.save();
//       return res
//         .status(200)
//         .send({ status: true, message: "Success", data: validCart });
//     }

//     // 1st time cart
//     let calprice = validProduct.price * Number(quantity);
//     let obj = {
//       userId: userId,
//       items: [
//         {
//           productId: productId,
//           quantity: quantity,
//         },
//       ],
//       totalPrice: calprice,
//     };
//     obj["totalItems"] = obj.items.length;
//     let result = await cartModel.create(obj);
//     return res
//       .status(201)
//       .send({ status: true, message: "Success", data: result });
//   } catch (err) {
//     return res.status(500).send({ status: false, err: err.message });
//   }
// };

// /***********GET CART*************/

// const getCart = async function (req, res) {
//   try {
//     let userId = req.params.userId;
//     if (!isValid(userId))
//       return res.status(400).send({ status: false, msg: "invalid userId" });
//     if (!isValidObjectId(userId))
//       return res
//         .status(400)
//         .send({ status: false, msg: "user Id is nor=t correct." });
//     let user = await userModel.findOne({ _id: userId });
//     if (!user) {
//       return res.status(404).send({
//         status: false,
//         msg: "No such user found. Please register and try again",
//       });
//     }
//     let checkCart = await cartModel.findOne({ userId: userId });
//     if (!checkCart) {
//       return res.status(400).send({ status: false, message: "cart not found" });
//     } else {
//       return res
//         .status(200)
//         .send({ status: true, msg: "Your cart", data: checkCart });
//     }
//   } catch (err) {
//     console.log(err);
//     return res.status(500).send({ status: false, message: err.message });
//   }
// };

/***********UPDATE CART*************/
/*
const updateCart = async function (req, res){
  try{
    let userId = req.params.userId;
    let data = req.body;

    let {productId, removeProduct} = data;
    let checkUser = await userModel.findOne({_id: userId});
    if(!checkUser) return res.status(400).send({status: false, message: 'This user does not exist.'});

    let checkCart = await cartModel.findOne({userId});
    if(!checkCart) return res.status(400).send({status: false, message: 'There is no cart for the given userId.'});

    let checkProduct = await productModel.findOne({_id: productId});
    
    if(removeProduct == 1){
      let count = 0;
      for(let i=0; i<checkCart.items.length; i++){
        if(checkCart.items[i].productId == productId){
          checkCart.items[i].quantity--;
        }else{ count++; }
        if(count == 0){ checkCart.totalItems = 0; }
      }
      checkCart.totalPrice-=checkProduct.price;
      console.log(checkCart);
      let updatedCart = await cartModel.findOneAndUpdate({_id: checkCart._id}, checkCart, {new: true});
      return res.status(200).send({status: true, message: 'Success', updatedData: updatedCart});
    }
    else if(removeProduct == 0){
      let count = 0, oldQuantity;
      for(let i=0; i<checkCart.items.length; i++){
        if(checkCart.items[i].productId == productId){
          oldQuantity = checkCart.items[i].quantity;
          checkCart.items[i].quantity = 0;
        }else{ count++; }
        if(count == 0){ checkCart.totalItems = 0; }
      }
      checkCart.totalPrice-=checkProduct.price*oldQuantity;
      console.log(checkCart);
      let updatedCart = await cartModel.findOneAndUpdate({_id: checkCart._id}, checkCart, {new: true});
      return res.status(200).send({status: true, message: 'Success', updatedData: updatedCart});
    }
    else
      return res.status(400).send({status: false, message: 'Invalid removeProduct. It should be either 0 or 1'});
  }
  catch(error){
    console.log(error);
    return res.status(500).send(error.message);
  }
}
*/
/*const updateCart = async function (req, res) {
  try {
    const userId = req.params.userId;
    let userLoggedIn = req.userId;
    if (!isValidObjectId(userId)) {
      return res
        .status(400)
        .send({ status: false, message: "Invalid user id" });
    }
    let userDetails = await userModel.findById(userId);
    if (!userDetails) {
      return res.status(404).send({ status: false, message: "user not found" });
    }


    if (!isValidRequestBody(req.body)) {
      return res
        .status(400)
        .send({
          status: false,
          message: "Invalid request.Please provide details to update",
        });
    }

    const { cartId, productId, removeProduct } = req.body;

    if (
      !(isValid(removeProduct) && (removeProduct == 0 || removeProduct == 1))
    ) {
      return res
        .status(400)
        .send({
          status: false,
          message:
            "removeProduct key is required and its value can be either 0 or 1",
        });
    }
    //validating cartId
    if (!isValid(cartId)) {
      return res
        .status(400)
        .send({
          status: false,
          message: "CartId is required to update cartDetails",
        });
    }
    if (!isValidObjectId(cartId)) {
      return res.status(400).send({ status: false, message: "Invalid cartid" });
    }
    let isCartExist = await cartModel.findOne({ _id: cartId });
    if (!isCartExist) {
      return res
        .status(404)
        .send({ status: false, message: "No cart with this Id found" });
    }

        //-------------------------------------checking Authorizaton------------------------->>
        if (userLoggedIn != userId) {
          return res
            .status(403)
            .send({
              status: false,
              message: "User logged is not allowed to update the cart details",
            });
        }

    //validating ProductId
    if (!isValid(productId)) {
      return res
        .status(400)
        .send({
          status: false,
          message: "productId is required to update cartDetails",
        });
    }

    if (!isValidObjectId(productId)) {
      return res
        .status(400)
        .send({ status: false, message: "Invalid productid" });
    }

    let productExist = await productModel.findOne({
      _id: productId,
      isDeleted: false,
    });
    if (!productExist) {
      return res
        .status(404)
        .send({ status: false, message: "No Product with this Id found" });
    }
    
    let priceOfProduct = productExist.price;

    //checking if product exist in cart
    let productExistInCart = 0;
    let qty = 0;
    for (let i in isCartExist.items) {
      if (isCartExist.items[i].productId == productId) {
        productExistInCart = 1;
        qty = isCartExist.items[i].quantity;
      }
    }
    if (productExistInCart == 0) {
      return res
        .status(404)
        .send({
          status: false,
          message: "No Product with this Id found in the cart",
        });
    }

    let filter = {
      _id: cartId,
      "items.productId": productId,
      userId: userId,
    };
    if (removeProduct == 0 || qty == 1) {
      let update = {
        $pull: { items: { productId: productId } },
        $inc: { totalPrice: -1 * qty * priceOfProduct, totalItems: -1 },
      };
      productExistInCart = await cartModel.findOneAndUpdate(filter, update, {
        new: true,
      });
      if (!productExistInCart) {
        return res
          .status(404)
          .send({
            status: false,
            message:
              "No Product with this Id found in this Cart for current user",
          });
      }
      productExistInCart["_doc"]["productdetails"] = productExist;
      return res
        .status(200)
        .send({ status: true, message: "Success", data: productExistInCart });
    }
    if (removeProduct == 1) {
      let update = {
        $inc: { totalPrice: -1 * priceOfProduct, "items.$.quantity": -1 },
      };
      productExistInCart = await cartModel.findOneAndUpdate(filter, update, {
        new: true,
      });

      if (!productExistInCart) {
        return res
          .status(404)
          .send({
            status: false,
            message:
              "No Product with this Id found in this Cart for current user",
          });
      }

      productExistInCart["_doc"]["productdetails"] = productExist;
      res
        .status(200)
        .send({ status: true, message: "Success", data: productExistInCart });
    }
  } catch (err) {
    res.status(500).send({ status: false, Error: err.message });
  }
};
*/
/***********DELETE CART*************/

/*const deleteCart = async function (req, res) {
  try {
    let userId = req.params.userId;
    if (!isValid(userId))
      return res.status(400).send({ status: false, msg: "invalid userId" });
    if (!isValidObjectId(userId))
      return res
        .status(400)
        .send({ status: false, msg: "user Id is nor=t correct." });
    let user = await userModel.findOne({ _id: userId });
    if (!user) {
      return res.status(404).send({
        status: false,
        msg: "No such user found. Please register and try again",
      });
    }
    let checkCart = await cartModel.findOne({ userId: userId });
    if (!checkCart) {
      return res.status(400).send({ status: false, message: "cart not found" });
    }
    let deleteCart = await cartModel.findOneAndUpdate(
      { userId: userId }, //find
      { items: [], totalPrice: 0, totalItems: 0 }, //conditom
      { new: true }
    );
    return res
      .status(204)
      .send({
        status: true,
        msg: "✔️Your Cart is deleted✔️ ",
        data: deleteCart,
      });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ status: false, message: err.message });
  }
};

module.exports = { createCart, getCart, updateCart, deleteCart };
*/


