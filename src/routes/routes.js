const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const productController = require("../controllers/productController");
const cartController = require("../controllers/cartController");
const middleWare = require("../middlewares/auth");
const orderController= require("../controllers/orderController")
const newAuth=require("../middlewares/auth2")

let {auth}=newAuth
let { authentication, authorization } = middleWare;
let { createUser, userLogin, getUser, updateUser } = userController;
let {
  createProduct,
  deleteProduct,
  updateProductById,
  getProductById,
  getAllProduct,
} = productController;

let { createCart, updateCart, getCart, deleteCart } = cartController;
let {createOrder, updateOrder} = orderController


router.post("/register", createUser);
router.post("/login", userLogin);
router.get("/user/:userId/profile",auth,getUser);
router.put("/user/:userId/profile", auth,updateUser);

router.post("/products", createProduct);
router.get("/products", getAllProduct);
router.get("/products/:productId", getProductById);
router.put("/products/:productId", updateProductById);
router.delete("/products/:productId", deleteProduct);

router.post("/users/:userId/cart", authentication, authorization, createCart);
router.put("/users/:userId/cart", authentication, authorization, updateCart);
router.get("/users/:userId/cart", authentication, authorization, getCart);
router.delete("/users/:userId/cart", authentication, authorization, deleteCart);


router.post("/users/:userId/orders", authentication, authorization, createOrder);
router.put("/users/:userId/orders", authentication, authorization, updateOrder);


router.all("/*", async function (req, res) {
  res.status(404).send({ status: false, msg: "Page Not Found!" });
});

module.exports = router;
