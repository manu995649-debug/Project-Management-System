const cartModel = require("../models/cartModel");
const mongoose = require("mongoose");
const orderModel = require("../models/orderModel");
const userModel = require("../models/userModel.js");

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


const isValidStatus = function (status) {
  let state = ['pending','completed','cancelled'];
  return state.includes(status);
}

const createOrder = async function (req, res) {
  try {
    let userId = req.params.userId;
    let data = req.body;

    if(!isValidRequestBody(data))return res.status(400).send({status:false,msg:"Please provide data to create order"})
    if (!isValidObjectId(userId)) {
      return res.status(400).send({status: false, message: "Provide a valid userId"});
    }
    let validUser = await userModel.findOne({ _id: userId });
    if (!validUser) {
      return res.status(404).send({status: false, message: "user doesn't exist"});
    }
    if (Object.keys(data).length == 0) {
      return res.status(400).send({status: false, message: "Body must be filled"});
    }
    let { cartId, cancellable } = data;
    if (!isValid(cartId)) {
      return res.status(400).send({status: false, message: "cartId must be present"});
    }
    if (!isValidObjectId(cartId)) {
      return res.status(400).send({status: false, message: "Invalid cartId"});
    }
    let userCart = await cartModel.findOne({_id: cartId, userId: userId}).select({items: 1, totalPrice: 1, totalItems: 1});
    if (!userCart) {
      return res.status(404).send({status: false, message: "cart doesn't exist"});
    }

    if (cancellable) {
      if (!(cancellable == false || cancellable == true)) {
        return res.status(400).send({status: false,message: "cancellable should include true & false only"});
      }
    }

    let totalQuantity = 0;
    for (let i = 0; i < userCart.items.length; i++) {
      totalQuantity += userCart.items[i].quantity;
    }

    const orderDetails = {
      userId: userId,
      items: userCart.items,
      totalPrice: userCart.totalPrice,
      totalItems: userCart.totalItems,
      totalQuantity: totalQuantity,
      cancellable: data.cancellable,
    };
    const saveOrder = await orderModel.create(orderDetails);
    return res.status(201).send({status: false, message: "Success", data: saveOrder});
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};


// const createOrder = async (req, res) => {
//   try {
//     let userId = req.params.userId;
//     let data = req.body;
//     if (!isValid(userId) && isValidObjectId(userId)) {
//       return res.status(400).send({
//         status: false,
//         msg: "UserId Is Invalid or You are not given the UserId please provide",
//       });
//     }
//     if (!isValidRequestBody(data)) {
//       return res
//         .status(400)
//         .send({ status: false, msg: "Please give orderId to Place order" });
//     };

    
//     let { cartId, cancellable, status } = data;

//     let userCart = await cartModel.findOne({_id: cartId, userId: userId}).select({items: 1, totalPrice: 1, totalItems: 1});
//     if (!userCart) {
//       return res.status(404).send({status: false, message: "cart doesn't exist"});
//     }
//       aUser=userCart.userId
//       console.log(aUser)

//     //   let allreadyOrder = await orderModel.findOne({userId:aUser})
//     // if(allreadyOrder){
//     //     return res.status(200).send({status:false,msg:" Order  completed ,Cart is Empty"})
//     // }
//       if(userId != userCart.userId){
//         return res.status(403).send({status:false,msg:"You are not Authorised for"})
//       }

//     if (!isValid(cartId) && isValidObjectId(cartId)) {
//       return res.status(400).send({
//         status: false,
//         msg: "Cart id Is invalid Or Cartid Is no given",
//       });
//     }
//     if (cancellable) {
//       if (!(cancellable == true || cancellable == false)) {
//         return res.status(400).send({
//             sttus: false,
//             msg: "You can only select true or False value OK !",
//           });
//       }
//     }
//     if (status) {
//       if (!["pending", "completed", "canceled"].includes(status)) {
//         return res
//           .status(400)
//           .send({
//             status: false,
//             msg: "Status Should be between One them => 'pending', 'canceled' or 'Completed'...",
//           });
//       }
//     }
//      let newQuantity = 0;
//         for(let i =0 ;i<cart.items.length;i++){
//             newQuantity+= cart.items[i].quantity
//         }

//     let AllData = {
//       userId: userId,
//       items: cart.items,
//       totalPrice: cart.totalPrice,   
//       totalItems: cart.totalItems,
//       totalQuantity: newQuantity,
//       cancellable: cancellable,
//       status: status,
//     };
//     let placeOrder = await orderModel.create(AllData)
//     return res
//       .status(201)
//       .send({
//         status: true,
//         msg: "Your Order Placed Succesfully",
//         data: placeOrder,
//       });
//   } catch (err) {
//     console.log(err)
//     return res.status(500).send({ msg: err.message });
//   }
// };

// const updateOrder = async (req, res) =>{
//   try {
//      let data = req.body;
//      let userId = req.params.userId;

// let {orderId, status} = data;

//   if (!isValid(userId))
//     return res.status(400).send({ status: false, msg: "invalid userId" });

//   //    if(orderId != userId.orderId){
//   //     return res.status(403).send({status: false, msg:"Unauthorized user"})
//   //    }
     
//   console.log("hello")

//      let user = await userModel.findOne({ _id: userId });
     
//      if (!user) {

//     return res.status(404).send({
//       status: false,
//       msg: "No such user found. Please register and try again",
//     });
//   } 
   
//  // console.log(orderId)
  
//   let checkOrder = await orderModel.findById({_id: orderId});

//  // console.log(checkOrder)

//   if(!checkOrder){
//       return res.status(404).send({status:false, msg: "order not found"})
//   }
//   if(!checkOrder.cancellable){
//       return res.status(400).send({status:false, msg:"order can not be cancelled"});
//   }   console.log("hello")

//   if(checkOrder.status!="pending"){
//       return res.status(400).send({status:false, msg:"order can not be cancelled"});
//   } console.log("hello")

//   let updatedOrder = await orderModel.findOneAndUpdate({_id : orderId, isdeleted: false}, {status: "cancelled"}, {new:true})

//   return res.status(200).send({status:true, msg:"order cancelled"})
  
// }

//   catch(err){
//      return res.status(500).send({msg: err.message})
//   }
// }

const updateOrder = async function (req, res) {
  try {
    let userId = req.params.userId;
    let data = req.body;
    if (!isValidObjectId(userId)) {
      return res.status(400).send({status: false, message: "Provide a valid userId"});
    }

    let validUser = await userModel.findOne({ _id: userId });
    if (!isValid(validUser)) {
      return res.status(404).send({status: false, message: "User doesn't exist"});
    }
    if (Object.keys(data).length == 0) {
      return res.status(400).send({status: false, message: "Body must be filled"});
    }
    let { orderId, status } = data;
    if (!isValid(orderId)) {
      return res.status(400).send({status: false, message: "OrderId must be filled"});
    }
    if (!isValid(status)) {
      return res.status(400).send({status: false, message: "Provide a order status"});
    }
    if (!isValidObjectId(orderId)) {
      return res.status(400).send({status: false, message: "Provide a valid orderId"});
    }
    if (!isValidStatus(status)) {
      return res.status(400).send({status: false,message:"Order status should include pending, completed or cancelled only!"});
    }
    let validOrder = await orderModel.findOne({ _id: orderId });
    if (!validOrder) {
      return res.status(404).send({ status: false, message: "Order doesn't exist" });
    }

    if(validOrder.status !== 'pending') {
        return res.status(400).send({status: false, message: "Dear user! your order is not in pending state it is completed or cancelled"});
    }
    if(!["completed", "cancelled"].includes(status)) {
        return res.status(400).send({status: false, message: "Dear user! your order status can be changed to completed or cancelled only"});
    }
    if (status == "cancelled") {
      if (validOrder.cancellable == false) {
        return res.status(400).send({status: false, message: "This order is not cancellable"});
      }
    }
    let updateOrder = await orderModel.findOneAndUpdate({_id: orderId},
      {$set: { status: status, cancellable: false}},{new: true});

    return res
      .status(200).send({status: true,message: `Success`,data: updateOrder});
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};


module.exports = { createOrder,updateOrder };