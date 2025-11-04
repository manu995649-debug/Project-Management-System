//***** <----IMPORTING MODULES AND CONTROLLER FILES----> ******
const userModel = require("../models/userModel");
const { uploadFile } = require("../awsS3/aws");
const validEmail = require("email-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const validator = require("../validations/validator");

//****** <---- INITIALIZING REGEX && SALT ROUNDS----> *******
const nameRegex = /^[a-zA-z]+([\s][a-zA-Z]+)*$/;
const phoneRegex =
  /^(?:(?:\+|0{0,2})91(\s*|[\-])?|[0]?)?([6789]\d{2}([ -]?)\d{3}([ -]?)\d{4})$/;
const passwordRegex = /^[a-zA-Z0-9!@#$%^&*]{8,15}$/;
const streetRegex = /^[a-zA-Z0-9\s,.'-]{3,}$/;
const cityRegex = /^[a-zA-z]+([\s][a-zA-Z]+)*$/;
const pincodeRegex = /^\d{6}$/;
const saltRounds = 10;

//********* <----VALIDATOR FUNCTIONS----> *********
const isValid = function (value) {
  if (typeof value === "undefined" || value === null) return false;
  if (typeof value === "string" && value.trim().length === 0) return false;
  if (typeof value === "number") return false;
  return true;
};

const isValidImage = function (files) {
  if (files == undefined || files == "") return false;
  if (!/(\.jpg|\.jpeg|\.png|\.gif)$/i.exec(files.originalname)) return false;
  return true;
};

//********* <----REGISTER USER API----> ***********
const createUser = async function (req, res) {
  try {
    let data = req.body;

    if (Object.keys(data).length == 0)
      return res
        .status(400)
        .send({ status: false, message: "There is no data to register." });

    let { fname, lname, email, phone, password, address } = data;

    if (!validator.isValidObject(data)) {
      return res
        .status(400)
        .send({ status: false, message: "please enter data for creation" });
    }

    if (!isValid(fname))
      return res
        .status(400)
        .send({ status: false, message: "First name is not present." });
    fname = fname.trim();
    if (!nameRegex.test(fname))
      return res
        .status(400)
        .send({
          status: false,
          message: "First name should only contain alphabets.",
        });

    if (!isValid(lname))
      return res
        .status(400)
        .send({ status: false, message: "Last name is not present." });
    lname = lname.trim();
    if (!nameRegex.test(lname))
      return res
        .status(400)
        .send({
          status: false,
          message: "Last name should only contain alphabets.",
        });

    if (!isValid(email))
      return res
        .status(400)
        .send({ status: false, message: "Email address is not present." });
    email = email.trim();
    if (!validEmail.validate(email))
      return res
        .status(400)
        .send({ status: false, message: "The email address is invalid." });
    let checkEmail = await userModel.findOne({ email });
    if (checkEmail)
      return res
        .status(400)
        .send({
          status: false,
          message: "This email address is already registered.",
        });

    let files = req.files[0];
    if (!isValidImage(files))
      return res
        .status(400)
        .send({
          status: false,
          message:
            "Image must be present and only jpg/jpeg/png/gif extensions are allowed.",
        });
    data.profileImage = await uploadFile(files);

    if (!isValid(phone))
      return res
        .status(400)
        .send({ status: false, message: "Phone number is not present." });
    phone = phone.trim();
    if (!phoneRegex.test(phone))
      return res
        .status(400)
        .send({
          status: false,
          message:
            "Phone number must contain only digits and should have length of 10.",
        });
    let checkPhone = await userModel.findOne({ phone });
    if (checkPhone)
      return res
        .status(400)
        .send({
          status: false,
          message: "This phone number is already registered.",
        });

    if (!isValid(password))
      return res
        .status(400)
        .send({ status: false, message: "Password is not present." });
    password = password.trim();
    if (!passwordRegex.test(password))
      return res
        .status(400)
        .send({
          status: false,
          message: "Password should have 8 to 15 characters.",
        });

    data.password = await bcrypt.hash(password, saltRounds); 
    if (!address)
      return res
        .status(400)
        .send({ status: false, message: "Address should be present." });

    try {
      data.address = JSON.parse(address);
    } catch (err) {
      return res
        .status(400)
        .send({
          status: false,
          message: " The address is not in valid format.",
        });
    }

    let { shipping, billing } = data.address;

    if (!shipping || typeof shipping != "object")
      return res
        .status(400)
        .send({
          status: false,
          message:
            "The shipping address must be present and should be an object.",
        });
    {
      let { street, city, pincode } = shipping;

      if (!isValid(street))
        return res
          .status(400)
          .send({
            status: false,
            message: "The shipping street should be present.",
          });
      street = street.trim();
      if (!streetRegex.test(street))
        return res
          .status(400)
          .send({
            status: false,
            message:
              "The shipping street should only contain alphabets and digits.",
          });

      if (!isValid(city))
        return res
          .status(400)
          .send({
            status: false,
            message: "The shipping city should be present.",
          });
      city = city.trim();
      if (!cityRegex.test(city))
        return res
          .status(400)
          .send({
            status: false,
            message: "The shipping city should contain only alphabets.",
          });
      if (!pincode || typeof pincode != "number")
        return res
          .status(400)
          .send({
            status: false,
            message:
              "The shipping pincode must be present and should be a number.",
          });
       
      if (!pincodeRegex.test(pincode))
        return res
          .status(400)
          .send({
            status: false,
            message: "The shipping pincode should have 6 six digits.",
          });
    }

    if (!billing || typeof billing != "object")
      return res
        .status(400)
        .send({
          status: false,
          message:
            "The billing address must be present and should be an object.",
        });
    {
      let { street, city, pincode } = billing;

      if (!isValid(street))
        return res
          .status(400)
          .send({
            status: false,
            message: "The billing street should be present.",
          });
      street = street.trim();
      if (!streetRegex.test(street))
        return res
          .status(400)
          .send({
            status: false,
            message:
              "The billing street should only contain alphabets and digits.",
          });

      if (!isValid(city))
        return res
          .status(400)
          .send({
            status: false,
            message: "The billing city should be present.",
          });
      city = city.trim();
      if (!cityRegex.test(city))
        return res
          .status(400)
          .send({
            status: false,
            message: "The billing city should contain only alphabets.",
          });

      if (!pincode || typeof pincode != "number")
        return res
          .status(400)
          .send({
            status: false,
            message:
              "The billing pincode must be present and should be a number.",
          });
      if (!pincodeRegex.test(pincode))
        return res
          .status(400)
          .send({
            status: false,
            message: "The billing pincode should have 6 six digits.",
          });
    }

    let profileData = await userModel.create(data);
    return res
      .status(201)
      .send({
        status: true,
        message: "User Created Successfully",
        data: profileData,
      });
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

//********* <----USER LOGIN API----> ************
const userLogin = async function (req, res) {
  try {
    let data = req.body;
    let { email, password } = data;
    if (Object.keys(data).length == 0)
      return res
        .status(400)
        .send({ status: false, message: "There is no data to Login." });

    if (!isValid(email))
      return res
        .status(400)
        .send({ status: false, message: "Email address should be present." });
    if (!validEmail.validate(email))
      return res
        .status(400)
        .send({ status: false, message: "The email address is invalid." });
    let user = await userModel.findOne({ email });
    if (!user)
      return res
        .status(404)
        .send({
          status: false,
          message: "This email address is not registered.",
        });

    if (!isValid(password))
      return res
        .status(400)
        .send({ status: false, message: "Password should be present." });
    if (!passwordRegex.test(password))
      return res
        .status(400)
        .send({
          status: false,
          message: "Password is invalid. It should have 8 to 15 characters.",
        });

    let checkPassword = await bcrypt.compare(password, user.password);
    if (!checkPassword)
      return res
        .status(400)
        .send({ status: false, message: "Invalid Password Credential." });

    const token = jwt.sign(
      {
        userId: user._id,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 100*60 * 60,
      },
      "functionup-project-5"
    );

    res.header("Authorisation", token);
    return res.status(200).send({
      status: true,
      message: "User successfully loggedin",
      data: { userId: user._id, token: token },
    });
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

//******** <----GET PROFILE DETAILS API----> **********
const getUser = async function (req, res) {
  try {
    let userId = req.params.userId;

    if (!mongoose.isValidObjectId(userId))
      return res
        .status(400)
        .send({ status: false, message: "The userId is invalid" });

    let userData = await userModel.findOne({ _id: userId });
    if (!userData)
      return res
        .status(404)
        .send({
          status: false,
          message: "The user doesn't exist with the given userId.",
        });

    if (userId !== req.userId)
      return res
        .status(403)
        .send({
          status: false,
          message: "The access is denied to invalid users.",
        });

    return res
      .status(200)
      .send({ status: true, message: "User profile details", data: userData });
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

//******* <----UPDATE PROFILE DETIALS API----> **********
const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!validator.isValidObjectId(userId)) {
      return res
        .status(400)
        .send({ status: false, message: "Please provide valid ID" });
    }

    // if (userId != userLoggedIn) {
    //   return res
    //     .status(403)
    //     .send({ status: false, msg: "Error, authorization failed" });
    // }

    const data = req.body; //JSON.parse(JSON.stringify(req.body))
    const files = req.files;
    const { password } = data;
    const updateUserData = {};
    // if(!validator.isValidObject(data)){
    //     return res.status(400).send ({status:false, message :"Please provide body"})
    // }
    const isUserExist = await userModel.findById(userId);
    if (!isUserExist) {
      return res.status(404).send({ status: false, message: "user not found" });
    }
    if (data._id) {
      return res
        .status(400)
        .send({ status: false, message: "can not update user id" });
    }
    if (data.fname) {
      if (!validator.isValid(data.fname)) {
        return res
          .status(400)
          .send({ status: false, message: "please provide valid first name" });
      }
      if (!validator.isValidString(data.fname)) {
        return res.status(400).send({
          status: false,
          message: "please enter letters only in first name",
        });
      }
      updateUserData.fname = data.fname;
    }
    if (data.lname) {
      if (!validator.isValid(data.lname)) {
        return res
          .status(400)
          .send({ status: false, message: "please provide valid lname name" });
      }
      if (!validator.isValidString(data.lname)) {
        return res.status(400).send({
          status: false,
          message: "please enter letters only in last name",
        });
      }
      updateUserData.lname = data.lname;
    }
    if (data.email) {
      if (!validator.isValidEmail(data.email)) {
        return res
          .status(400)
          .send({ status: false, message: "Please provide valid email Id" });
      }
      const isEmailInUse = await userModel.findOne({ email: data.email });
      if (isEmailInUse) {
        return res.status(400).send({
          status: false,
          message: "email already registered, enter different email",
        });
      }
      updateUserData.email = data.email;
    }
    if (data.phone) {
      if (!validator.isValidPhone(data.phone)) {
        return res.status(400).send({
          status: false,
          message:
            "Please provide 10 digit number && number should start with 6,7,8,9",
        });
      }
      const isPhoneInUse = await userModel.findOne({ phone: data.phone });
      if (isPhoneInUse) {
        return res.status(400).send({
          status: false,
          message: "phone number already registered, enter different number",
        });
      }
      updateUserData.phone = data.phone;
    }
    //it check image avilable or not
    if (files && files.length > 0) {
      const link = await uploadFile(files[0]);
      updateUserData.profileImage = link;
    }
    if (password) {
      const hash = await bcrypt.hash(password, saltRounds);
      updateUserData.password = hash;
    }

    // try{
    //   data.address = JSON.parse(address)
    // }catch(err){return res.status(400).send({status: false, message: 'The address is not in valid format.'})}

    if (data.address || data.address == "") {
      const add = JSON.parse(JSON.stringify(isUserExist.address));
      try {
        if (data.address) {
          data.address = JSON.parse(data.address);
        }
      } catch (err) {
        return res
          .status(400)
          .send({
            status: false,
            message: "The address is not in valid format.",
          });
      }

      if (data.address.shipping) {
        if (data.address.shipping.street) {
          if (!validator.isValid(data.address.shipping.street)) {
            return res.status(400).send({
              status: false,
              message: "please enter shipping street name",
            });
          }
          add.shipping.street = data.address.shipping.street;
        }
        if (data.address.shipping.city) {
          if (!validator.isValid(data.address.shipping.city)) {
            return res.status(400).send({
              status: false,
              message: "please enter shipping city name",
            });
          }
          add.shipping.city = data.address.shipping.city;
        }
        if (data.address.shipping.pincode) {
          if (!validator.isValid(data.address.shipping.pincode)) {
            return res.status(400).send({
              status: false,
              message: "please enter shipping pincode",
            });
          }
          if (!validator.isValidPincode(data.address.shipping.pincode)) {
            return res.status(400).send({
              status: false,
              message:
                "please enter valid shipping pincode only accept 6 didgit number ",
            });
          }
          add.shipping.pincode = data.address.shipping.pincode;
        }
      }
      if (data.address.billing) {
        if (data.address.billing.street) {
          if (!validator.isValid(data.address.billing.street)) {
            return res.status(400).send({
              status: false,
              message: "please enter billing street name",
            });
          }
          add.billing.street = data.address.billing.street;
        }
        if (data.address.billing.city) {
          if (!validator.isValid(data.address.billing.city)) {
            return res.status(400).send({
              status: false,
              message: "please enter billing city name",
            });
          }
          add.billing.city = data.address.billing.city;
        }
        if (data.address.billing.pincode) {
          if (!validator.isValid(data.address.billing.pincode)) {
            return res
              .status(400)
              .send({ status: false, message: "please enter billing pincode" });
          }

          if (!validator.isValidPincode(data.address.billing.pincode)) {
            return res.status(400).send({
              status: false,
              message:
                "please enter valid billing pincode only accept 6 didgit number ",
            });
          }
          add.billing.pincode = data.address.billing.pincode;
        }
      }
      updateUserData.address = add;
    }

    if (!validator.isValidObject(updateUserData)) {
      return res
        .status(400)
        .send({ status: false, message: "please enter data for updation" });
    }
    const updateUser = await userModel.findOneAndUpdate(
      { _id: userId },
      updateUserData,
      { new: true }
    );
    return res.status(200).send({
      status: true,
      message: "User profile update successfully",
      data: updateUser,
    });
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

//******** <----EXPORTING ALL THE API'S----> **********
module.exports = { createUser, getUser, userLogin, updateUser };

// module.exports = {registerUser, loginUser, getProfile, updateProfile};

// const userModel = require("../models/userModel");
// const jwt = require("jsonwebtoken");
// const { uploadFile } = require("../awsS3/aws");
// const bcrypt = require("bcrypt");

//================================================
// const createUser = async function (req, res) {
//   try {
//     let data = req.body;
//     let files = req.files;
//     if (!isValidFiles(files))
//       return res.status(400).send({ status: false, msg: "invalid file" });

//     if (!isValidRequestBody(data))
//       return res.status(400).send({
//         status: false,
//         message: "Please Enter Data To Create User",
//       });

//     let { fname, lname, phone, email, password, address } = data;
//     fname = fname.trim();
//     lname = fname.trim();
//     email = email.trim();
//     phone = phone.trim();
//     password = password.trim();

//     if (!address|| address.trim()=="") {return res.status(400).send({status:false,msg:"please provide address"})}

//     /*
//       if (address) {
//         const parsedAddress = JSON.parse(data.address);
//         address = parsedAddress;
//         data.address = address

//     }*/

//     data.profileImage = await uploadFile(files[0]);

//     if (!isValidName(fname))
//       return res.status(400).send({
//         status: false,
//         message: "First Name is Missing",
//       });
//     if (!isValid(fname))
//       return res.status(400).send({
//         status: false,
//         message: "Plaese Enter Valid Name with Only alphabet",
//       });

//     if (!isValid(lname))
//       return res.status(400).send({
//         status: false,
//         message: "Last Name is Missing",
//       });

//     if (!isValidName(lname))
//       return res.status(400).send({
//         status: false,
//         message: "Plaese Enter Valid Name with Only alphabet",
//       });

//     let usedPhone = await userModel.findOne({ phone: phone });
//     if (usedPhone) {
//       return res.status(400).send({
//         status: false,
//         message: " Phone is allready Used Please Use Another Phone",
//       });
//     }

//     if (!isValid(phone))
//       return res.status(400).send({
//         status: false,
//         message: "Phone number is missing ",
//       });
//     if (!isValidPhone(phone))
//       return res.status(400).send({
//         status: false,
//         message: "Please Enter Valid phone Number",
//       });

//     let usedEmail = await userModel.findOne({ email: email });
//     if (usedEmail) {
//       return res
//         .status(400)
//         .send({ status: false, message: "email already in use" });
//     }

//     if (!isValid(email))
//       return res.status(400).send({
//         status: false,
//         message: "Email is Missing ",
//       });
//     if (!isValidEmail(email))
//       return res.status(400).send({
//         status: false,
//         message: " Please Enter Valid Email",
//       });

//     if (!isValid(password))
//       return res.status(400).send({
//         status: false,
//         message:
//           "Password is missing or Please Enter Valid Password Minumum 8 Character and Maximum 15 ",
//       });
//     if (!isValidPassword(password))
//       return res.status(400).send({
//         status: false,
//         message:
//           "Password is missing or Please Enter Valid Password Minumum 8 Character and Maximum 15 ",
//       });

//     ///hash password
//     const saltRounds = 10;
//     const hash = await bcrypt.hash(password, saltRounds);
//     data.password = hash;

//     getAddress = JSON.parse(data.address);
//     address = getAddress;
//     data.address = address;
//     console.log(data);

//     data.address.shipping.street = data.address.shipping.street.trim();
//     data.address.shipping.city = data.address.shipping.city.trim();
//     data.address.billing.street = data.address.billing.street.trim();
//     data.address.billing.city = data.address.billing.city.trim();

//     if (address) {
//       let key = Object.keys(address);

//       for (let i = 0; i < key.length; i++) {
//         if (address[key[i]].length == 0)
//           return res.status(400).send({
//             status: false,
//             message: "Enter valid inforamtion in address ",
//           });
//       }

//       if (!isvalidaddress(address.billing.street)) {
//         return res.status(400).send({
//           status: false,
//           message: "Street should be Valid and Its alphabetic and Number",
//         });
//       }

//       if (!isvalidaddress(address.billing.city)) {
//         return res.status(400).send({
//           status: false,
//           message: "city name should be valid. contain only alphabets",
//         });
//       }
//       if (!isValidPincode(address.billing.pincode)) {
//         return res.status(400).send({
//           status: false,
//           message: "Pincode should have only 6 digits. No alphabets",
//         });
//       }

//       if (!isvalidaddress(address.shipping.street)) {
//         return res.status(400).send({
//           status: false,
//           message: "Street should be Valid and Its alphabetic and Number",
//         });
//       }

//       if (!isvalidaddress(address.shipping.city)) {
//         return res.status(400).send({
//           status: false,
//           message: "city name should be valid. contain only alphabets",
//         });
//       }
//       if (!isValidPincode(address.shipping.pincode)) {
//         return res.status(400).send({
//           status: false,
//           message: "Pincode should have only 6 digits. No alphabets",
//         });
//       }
//     }

//     let savedData = await userModel.create(data);
//     res.status(201).send({
//       status: true,
//       message: "User Created Successfully",
//       data: savedData,
//     });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).send({ status: false, message: error.message });
//   }
// };

// const userLogin = async (req, res) => {
//   try {
//     let data = req.body;
//     let { email, password } = data;
//     if (!isValidRequestBody(data)) {
//       return res
//         .status(400)
//         .send({ status: false, msg: "Please enter email and Password" });
//     }
//     if (!isValid(email))
//       return res.status(400).send({ status: false, msg: "Please enter email" });

//     if (!isValidEmail(email)) {
//       return res.status(400).send({
//         status: false,
//         message: "Email should be a valid email address",
//       });
//     }

//     if (!isValid(password))
//       return res
//         .status(400)
//         .send({ status: false, msg: "Please enter Password" });
//     let user = await userModel.findOne({ email: email });
//     if (!user) {
//       return res
//         .status(404)
//         .send({ status: false, msg: "Invalid credetial Found" });
//     }

//     const token = jwt.sign(
//       {
//         userId: user._id,
//         iat: Math.floor(Date.now() / 1000),
//         exp: Math.floor(Date.now() / 1000) + 10 * 60*60,
//       },
//       "functionup-project-5"
//     );
//     res.header("Authorisation", token);
//     return res.status(200).send({
//       status: true,
//       message: "User successfully loggedin", data: {userId: user._id,
//       token: token},

//     });
//   } catch (error) {
//     console.log(error)
//     res.status(500).send({ status: false, msg: error.message });
//   }
// };

// const getUser = async (req, res) => {
//   try {
//     let userId = req.params.userId;
//     if (!isValidObjectIdId(userId))
//       return res
//         .status(400)
//         .send({ status: false, msg: `Oops! ${userId} This Not Valid UserId ` });
//     let userDetail = await userModel.findById(userId)
//     // if(userId != userDetail)return res.status(403).send({status:false, msg:"this user not authorised"})
//     if (!userDetail) {
//       return res
//         .status(404)
//         .send({ status: false, msg: "User you are searching for is not here" });
//     } else {
//       res.status(200).send({
//         status: true,
//         msg: "Your details is here",
//         data: userDetail,
//       });
//     }
//   } catch (error) {
//     console.log(error)
//     res.status(500).send({ status: false, msg: error.message });
//   }
// };

// const updateUser = async (req, res) => {
//  try{ let userId = req.params.userId;
//   let userData = await userModel.findById(userId);
//   if (!isValidRequestBody(req.body)) {
//     return res
//       .status(400)
//       .send({ status: false, message: "CANT BE EMPTY BODY" });
//   }
//   let {
//     fname,
//     lname,
//     email,
//     phone,
//     password,
//     address,
//     profileImage,
//     ...other
//   } = req.body;

//   if (isValidRequestBody(other))
//     return res
//       .status(400)
//       .send({
//         status: false,
//         message: "Any extra field is not allowed for updation",
//       });

//   if (profileImage != undefined)
//     return res
//       .status(400)
//       .send({
//         status: false,
//         message: "profileImage field should have a image file",
//       });

//   let files = req.files;

//   if (isValidFiles(files)) {
//     if (files.length > 1 || files[0].fieldname != "profileImage")
//       return res
//         .status(400)
//         .send({
//           status: false,
//           message: `Only One ProfileImage is allowed by the field name profileImage, no any other file or field allowed `,
//         });

//     if (!["image/png", "image/jpeg"].includes(files[0].mimetype))
//       return res
//         .status(400)
//         .send({
//           status: false,
//           message: "only png,jpg,jpeg files are allowed from profileImage",
//         });

//     userData.profileImage = await uploadFile.uploadFile(files[0]);
//   }

//   if (fname || fname == "") {
//     if (!isValid(fname))
//       return res
//         .status(400)
//         .send({ status: false, message: "not valid fname" });
//     userData.fname = fname;
//   }
//   if (lname || lname == "") {
//     if (!isValid(lname))
//       return res
//         .status(400)
//         .send({ status: false, message: "not valid lname" });
//     userData.lname = lname;
//   }
//   if (email || email == "") {
//     if (!isValidEmail(email.trim()))
//       return res.status(400).send({ status: false, msg: "enter valid email" });

//     let duplicatemail = await userModel.findOne({ email: email });
//     if (duplicatemail)
//       return res
//         .status(400)
//         .send({ status: false, message: "email already exists" });

//     userData.email = email;
//   }
//   if (phone || phone == "") {
//     if (!isValidPhone(phone)) {
//       return res
//         .status(400)
//         .send({
//           status: false,
//           message: `phone no should be a valid phone no`,
//         });
//     }
//     let duplicatephone = await userModel.findOne({ phone: phone });
//     if (duplicatephone) {
//       return res
//         .status(400)
//         .send({ status: false, message: "Phone no. already exists" });
//     }
//     userData.phone = phone;
//   }
//   if (password || password == "") {
//     if (!isValidPassword(password))
//       return res
//         .status(400)
//         .send({
//           status: false,
//           Message:
//             "Please provide a vaild password ,Password should be of 8 - 15 characters",
//         });
//     userData.password = password;
//   }

//   if (address || address == "") {
//     if (!isValid(address)) {
//       return res
//         .status(400)
//         .send({ status: false, Message: " address is required to Update or not valid address" });
//     }

//     let { shipping, billing } = address;
//     if (shipping || shipping == "") {
//       if (!isvalidaddress(shipping))
//         return res
//           .status(400)
//           .send({ status: false, Message: "Not valid shipping address" });

//       let { street, city, pincode } = shipping;

//       if (street || street == "") {
//         if (!isValid(street))
//           return res
//             .status(400)
//             .send({ status: false, Message: "not valid street" });
//         userData.address.shipping.street = street;
//       }
//       if (city || city == "") {
//         if (!isValid(city))
//           return res
//             .status(400)
//             .send({ status: false, Message: "not valid city" });
//         userData.address.shipping.city = city;
//       }
//       if (pincode || pincode == "") {
//         if (!isValidPincode(pincode))
//           return res
//             .status(400)
//             .send({ status: false, Message: "not valid pincode" });
//         userData.address.shipping.pincode = pincode;
//       }
//     }

//     if (billing || billing == "") {
//       if (!isvalidaddress(billing))
//         return res
//           .status(400)
//           .send({ status: false, Message: "Not valid billing address" });

//       let { street, city, pincode } = billing;

//       if (street || street == "") {
//         if (!isValid(street))
//           return res
//             .status(400)
//             .send({ status: false, Message: "not valid street" });
//         userData.address.billing.street = street;
//       }
//       if (city || city == "") {
//         if (!isValid(city))
//           return res
//             .status(400)
//             .send({ status: false, Message: "not valid city" });
//         userData.address.billing.city = city;
//       }
//       // if (pincode || pincode == "") {
//         if (!isValidPincode(pincode))
//           return res
//             .status(400)
//             .send({ status: false, Message: "not valid pincode" });
//         userData.address.billing.pincode = pincode;
//       // }
//     }
//     userData.address= JSON.parse(address)
//   }

//   let find = await userModel.findByIdAndUpdate(userId, userData, { new: true });

//   res
//     .status(200)
//     .send({ status: false, message: "User profile updated", data: find });
//   } catch (error) {
//     console.log(error)
//     res.status(500).send({ status: false, msg: error.message });
//   }
// };
