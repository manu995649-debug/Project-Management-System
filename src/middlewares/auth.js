const jwt = require("jsonwebtoken");
const UserModel = require("../models/userModel");
const {isValidObjectId} = require("../validations/userValidation");

const authentication = async function (req, res, next) {
  try {
    let bearerHeader = req.headers["authorization"];
    if (!bearerHeader) {
      return res.status(400).send({
        status: false,
        Error: "Enter Token In BearerToken !!!",
      });
    }

    const bearer = bearerHeader.split(" ");
    const bearerToken = bearer[1];
    // console.log(bearerToken)

    if (!bearerToken) {
      return res.status(400).send({
        status: false,
        message: " Please provide Bearer Token or invalid token",
      });
    }
    // To verify the token, we are using error handling callback function
    jwt.verify(bearerToken, "functionup-project-5", function (err, decoded) {
      if (err) {
        return res.status(403).send({
          status: false,
          message: " Invalid token , UnAuthorised",
        });
      } else {
        req.tokenData = decoded; //Attribute to store the value of decoded token
        next();
      }
    });
  } catch (err) {
    console.log("this error is from token validation", err.message);
    res.status(500).send({ msg: err.message });
  }
};


const authorization = async function (req, res, next) {
  try {
    let userLoggedIn = req.tokenData; //Accessing userId from token attribute
    let userId = req.params.userId; // pass user id in path params
    //check if user id is valid or not
    if (!isValidObjectId(userId)) {
      return res.status(400).send({
        status: false,
        message: "userId is invalid",
      });
    }
    let userAccessing = await UserModel.findById(userId);
    if (!userAccessing) {
      return res.status(404).send({
        status: false,
        message: "Error!  User Does Not Exist ",
      });
    }

    if (userId !== userLoggedIn.userId) {
      return res.status(403).send({
        status: false,
        msg: "Error, authorization failed",
      });
    }

    next();
  } catch (err) {
    res.status(500).send({
      status: false,
      error: err.message,
    });
  }
};


module.exports = { authentication, authorization };
//==============================================Authorization=============================//


