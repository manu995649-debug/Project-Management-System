//***** <----IMPORTING MODULES AND CONTROLLER FILES----> ******
const productModel = require("../models/productModel");
const { uploadFile } = require("../awsS3/aws");
const mongoose = require("mongoose");
const validator = require("../validations/validator");

const titleRegex = /^([a-zA-Z0-9- ]{2,50})*$/;
const descriptionRegex = /^([a-zA-Z0-9-,.! ]{2,50})*$/;
const numberRegex = /^([0-9.])*$/;
const nameRegex = /^[a-zA-z]+([\s][a-zA-Z]+)*$/;
let sizeOptions = ["S", "XS", "M", "X", "L", "XXL", "XL"];

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

const createProduct = async function (req, res) {
  try {
    let data = req.body;

    if (Object.keys(data).length == 0)
      return res
        .status(400)
        .send({
          status: false,
          message: "There is not any data to create product.",
        });

    if (!validator.isValidObject(data)) {
      return res
        .status(400)
        .send({ status: false, message: "please enter data for creation" });
    }

    let {
      title,
      description,
      price,
      currencyId,
      currencyFormat,
      isFreeShipping,
      style,
      availableSizes,
      installments,
    } = data;

    if (!Object.keys(data).length)
      return res
        .status(400)
        .send({ status: false, message: "Product data is not present." });

    if (!isValid(title))
      return res
        .status(400)
        .send({
          status: false,
          message: "Title is not present or is it not valid.",
        });
    if (!titleRegex.test(title))
      return res
        .status(400)
        .send({ status: false, message: "The title is not valid." });
    let checktitle = await productModel.findOne({ title });
    if (checktitle)
      return res
        .status(400)
        .send({
          status: false,
          message: "The title is not unique. Please enter a unique title.",
        });

    if (!isValid(description))
      return res
        .status(400)
        .send({
          status: false,
          message: "The description is not present or it is not valid.",
        });
    if (!descriptionRegex.test(description))
      return res
        .status(400)
        .send({ status: false, message: "The description is not valid." });

    if (!isValid(price))
      return res
        .status(400)
        .send({
          status: false,
          message: "The price is not present or it is not valid.",
        });
    if (!numberRegex.test(price))
      return res
        .status(400)
        .send({ status: false, message: "The price is not valid." });

    if (currencyId || currencyId == "") {
      if (!isValid(currencyId))
        return res
          .status(400)
          .send({
            status: false,
            message: "The currencyId is not present of it is invalid.",
          });
      if (currencyId != "INR")
        return res
          .status(400)
          .send({
            status: false,
            message: "The currencyId is not valid. It should be 'INR'.",
          });
    }

    if (currencyFormat || currencyFormat == "") {
      if (!isValid(currencyFormat))
        return res
          .status(400)
          .send({
            status: false,
            message: "The currencyFormat is not present or it is not valid.",
          });
      if (currencyFormat != "₹")
        return res
          .status(400)
          .send({
            status: false,
            message: "The currencyFormat is not valid. It should be '₹'",
          });
    }

    if (isFreeShipping || isFreeShipping == "") {
      if (!isValid(isFreeShipping))
        return res
          .status(400)
          .send({
            status: false,
            message: "The isFreeShipping is not present or it is not valid.",
          });
      if (isFreeShipping != "true" && isFreeShipping != "false")
        return res
          .status(400)
          .send({
            status: false,
            message:
              "The is isFreeShipping is not valid. It should be either true or false.",
          });
    }

    if (style || style == "") {
      if (!isValid(style))
        return res
          .status(400)
          .send({
            status: false,
            message: "The style is not valid or it is not valid.",
          });
      if (!nameRegex.test(style))
        return res
          .status(400)
          .send({
            status: false,
            message:
              "The description is not valid. It should be a valid string.",
          });
    }

    if (installments || installments == "") {
      if (!isValid(installments))
        return res
          .status(400)
          .send({
            status: false,
            message: "The installments is not present or it is not valid.",
          });
      if (installments < 1 && installment > 6)
        return res.status({
          status: false,
          message:
            "The installment is not valid. It should in range (1, 6) inclusively.",
        });
    }

    if (availableSizes || availableSizes == "") {
      if (!isValid(availableSizes))
        return res
          .status(400)
          .send({
            status: false,
            message: "The availablesizes is not present or it is not valid.",
          });

      availableSizes = [
        ...new Set(
          availableSizes
            .toUpperCase()
            .split(",")
            .map((size) => size.trim())
        ),
      ];
      for (size of availableSizes) {
        if (sizeOptions.indexOf(size) === -1)
          return res
            .status(400)
            .send({
              status: false,
              message: `The keyword '${size}' is not a valid size. Please enter a right sizes.`,
            });
      }
      data.availableSizes = availableSizes;
    }
    let files = req.files[0];
    if (!isValidImage(files))
      return res
        .status(400)
        .send({
          status: false,
          message:
            "Image must be present and only jpg/jpeg/png/gif extensions are allowed.",
        });
    data.productImage = await uploadFile(files);

    let createdData = await productModel.create(data);
    return res
      .status(201)
      .send({
        status: false,
        message: "Product Created Succesfully",
        data: createdData,
      });
  } catch (error) {
    console.log(error)
    return res.status(500).send({ status: false, message: error.message });
  }
};



const getAllProduct = async function (req, res) {
  try {
      let data = {
          isDeleted: false
      }
      let queryDataSize = req.query.size;
      if (queryDataSize) {
          if (!(validator.isValid(queryDataSize)) && (validator.isValidSize(queryDataSize))) {
              return res.status(400).send({ status: false, message: "plz Enter a valid Size" })
          }
          if (!(validator.isValidSize(queryDataSize))) {
              return res.status(400).send({ status: false, message: "Please Provide Available Sizes from S,XS,M,X,L,XXL,XL" })
          }
          data["availableSizes"] = queryDataSize.trim();
      }
      let name = req.query.name;
      if (name) {
          if (!validator.isValid(name)) {
              return res.status(400).send({ status: false, message: "plz enter a valid name" })
          }
          data["title"] = { $regex: name.trim() }
      }
      let priceGreaterThan = req.query.priceGreaterThan;
      if (priceGreaterThan) {
          if (!validator.isValid(priceGreaterThan)) {
              return res.status(400).send({ status: false, message: "plz enter a valid name" })
          }
          data["price"] = {
              $gte: priceGreaterThan
          }
      }
      let priceLessThan = req.query.priceLessThan;
      if (priceLessThan) {
          if (!validator.isValid(priceLessThan)) {
              return res.status(400).send({ status: false, message: "plz enter a valid name" })
          }
          data["price"] = {
              $lte: priceLessThan
          }
      }
      if (priceLessThan && priceGreaterThan) {
          if (!validator.isValid(priceLessThan)) {
              return res.status(400).send({ status: false, message: "plz enter a valid price" })
          }
          if (!validator.isValid(priceGreaterThan)) {
              return res.status(400).send({ status: false, message: "plz enter a valid price" })
          }
          data["price"] = { $lte: priceLessThan, $gte: priceGreaterThan }

      }
      let filerProduct = await productModel.find(data).sort({ price: req.query.priceSort });
      // let filerProduct = await productModel.find({title: {$regex: name}});
      if (filerProduct.length === 0) {
          return res.status(404).send({
              status: true,
              message: "No product found"
          })
      }
      return res.status(200).send({
          status: true,
          message: "products you want",
          data: filerProduct
      })
  } catch (error) {
      return res.status(500).send({ status: false, message: error.message })
  }
};





const getProductById = async function (req, res) {
  try {
    let productId = req.params.productId;

    if (!mongoose.isValidObjectId(productId))
      return res
        .status(400)
        .send({
          status: false,
          message:
            "The productId is not valid. Please enter a valid productId.",
        });

    let productDetails = await productModel.findOne({
      _id: productId,
      isDeleted: false,
    });

    if (!productDetails)
      return res
        .status(404)
        .send({
          status: false,
          message: "No data found for the given productId.",
        });

    return res
      .status(200)
      .send({ status: false, message: "Success", data: productDetails });
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

const updateProductById = async function (req, res) {
  try {
    let data = req.body;
    let productId = req.params.productId;

    if (Object.keys(data).length == 0)
      return res
        .status(400)
        .send({
          status: false,
          message: "There is no data to update product.",
        });

    if (!mongoose.isValidObjectId(productId))
      return res
        .status(400)
        .send({ status: false, message: "The given productId is not valid." });
    if (Object.keys(data) == 0)
      return res
        .status(400)
        .send({
          status: false,
          message: "There is not data present in the request body.",
        });

    let {
      title,
      description,
      price,
      currencyId,
      currencyFormat,
      isFreeShipping,
      productImage,
      style,
      availableSizes,
      installments,
    } = data;

    checkproductId = await productModel.findOne({
      _id: productId,
      isDeleted: false,
    });
    if (!checkproductId)
      return res
        .status(404)
        .send({
          status: false,
          message: "No product found with the given productId.",
        });

    let dataToUpdate = {};

    if (title || title == "") {
      title = title.trim();
      if (!isValid(title))
        return res
          .status(400)
          .send({
            status: false,
            message: "Title is not present or is it not valid.",
          });
      if (!titleRegex.test(title))
        return res
          .status(400)
          .send({ status: false, message: "The title is not valid." });
      let checktitle = await productModel.findOne({ title });
      if (checktitle)
        return res
          .status(400)
          .send({
            status: false,
            message: "The title is not unique. Please enter a unique title.",
          });

      dataToUpdate.title = title;
    }

    if (description || description == "") {
      description = description.trim();
      if (!isValid(description))
        return res
          .status(400)
          .send({
            status: false,
            message: "The description is not present or it is not valid.",
          });
      if (!descriptionRegex.test(description))
        return res
          .status(400)
          .send({ status: false, message: "The description is not valid." });
      if (checkproductId.description == description)
        return res
          .status(400)
          .send({
            status: false,
            message:
              "This description is already present. Please enter another description.",
          });
      dataToUpdate.description = description;
    }

    if (price || price == "") {
      price = price.trim();
      if (!isValid(price))
        return res
          .status(400)
          .send({
            status: false,
            message: "The price is not present or it is not valid.",
          });
      if (!numberRegex.test(price))
        return res
          .status(400)
          .send({ status: false, message: "The price is not valid." });
      if (checkproductId.price == price)
        return res
          .status(400)
          .send({
            status: false,
            message:
              "This price is already present. Please enter a different price.",
          });
      dataToUpdate.price = price;
    }

    if (currencyId || currencyId == "") {
      currencyId = currencyId.trim();
      if (currencyId.toUpperCase() != "INR")
        return res
          .status(400)
          .send({
            status: false,
            message: "The currencyId is not valid. It should be only 'INR'",
          });
    }

    if (currencyFormat || currencyFormat == "") {
      currencyFormat = currencyFormat.trim();
      if (currencyFormat != "₹")
        return res
          .status(400)
          .send({
            status: false,
            message: "The currencyFormat is not valid. It should be only '₹'",
          });
    }

    if (isFreeShipping || isFreeShipping == "") {
      isFreeShipping = isFreeShipping.trim();
      if (!isValid(isFreeShipping))
        return res
          .status(400)
          .send({
            status: false,
            message: "The isFreeShipping is not present or it is not valid.",
          });
      if (isFreeShipping != "true" && isFreeShipping != "false")
        return res
          .status(400)
          .send({
            status: false,
            message:
              "The is isFreeShipping is not valid. It should be either true or false.",
          });

      dataToUpdate.isFreeShipping = isFreeShipping;
    }

    if (style || style == "") {
      style = style.trim();
      if (!isValid(style))
        return res
          .status(400)
          .send({
            status: false,
            message: "The style is not valid or it is not valid.",
          });
      if (!nameRegex.test(style))
        return res
          .status(400)
          .send({
            status: false,
            message:
              "The description is not valid. It should be a valid string.",
          });
      if (checkproductId.style == style)
        return res
          .status(400)
          .send({
            status: false,
            message:
              "This style is already is already present. Please enter a different style.",
          });

      dataToUpdate.style = style;
    }

    if (availableSizes || availableSizes == "") {
      if (!isValid(availableSizes))
        return res
          .status(400)
          .send({
            status: false,
            message: "The availablesizes is not present or it is not valid.",
          });

      availableSizes = [
        ...new Set(
          availableSizes
            .toUpperCase()
            .split(",")
            .map((size) => size.trim())
        ),
      ];
      for (size of availableSizes) {
        if (sizeOptions.indexOf(size) === -1)
          return res
            .status(400)
            .send({
              status: false,
              message: `The keyword '${size}' is not a valid size. Please enter a right sizes.`,
            });
      }
      dataToUpdate.availableSizes = availableSizes;
    }

    if (installments || installments == "") {
      installments = installments.trim();
      if (!isValid(installments))
        return res
          .status(400)
          .send({
            status: false,
            message: "The installments is not present or it is not valid.",
          });
      if (installments < 1 && installment > 6)
        return res.status({
          status: false,
          message:
            "The installment is not valid. It should in range (1, 6) inclusively.",
        });
      if (checkproductId.installments == installments)
        return res
          .status(400)
          .send({
            status: false,
            message:
              "This installments value is already present. Please choose a different value.",
          });

      dataToUpdate.installments = installments;
    }
    let files = req.files[0];
    if (isValidImage(files)) {
      if (files.length === 0)
        return res
          .status(400)
          .send({ status: false, message: "Please upload profileImage" });
      dataToUpdate.profileImage = await uploadFile(files);
    }

    let updatedProduct = await productModel
      .findOneAndUpdate({ _id: productId }, dataToUpdate, { new: true })
      .select({ createdAt: 0, __v: 0, deletedAt: 0 });

    return res
      .status(200)
      .send({ status: true, message: "Success", data: updatedProduct });
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

const deleteProduct = async function (req, res) {
  try {
    let productId = req.params.productId;

    if (!mongoose.isValidObjectId(productId))
      return res
        .status(400)
        .send({
          status: false,
          message:
            "The productId is not valid. Please provide a valid productId.",
        });

    let checkProduct = await productModel.findById(productId);
    if (!checkProduct)
      return res
        .status(404)
        .send({
          status: false,
          message: "No product found with the given productId.",
        });

    if (checkProduct.isDeleted == true)
      return res
        .status(404)
        .send({
          status: false,
          message: "The product not found or already deleted.",
        });

    let deletedData = await productModel
      .findByIdAndUpdate(
        { _id: productId },
        { $set: { isDeleted: true, deletedAt: new Date() } },
        { new: true }
      )
      .select({ _id: 1, title: 1, isDeleted: 1, deletedAt: 1 });

    res
      .status(200)
      .send({
        status: true,
        message: "Product deleted successfullly.",
        data: deletedData,
      });
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

module.exports = {
  createProduct,
  deleteProduct,
  updateProductById,
  getAllProduct,
  getProductById,
};

// const productModel = require("../models/productModel");
// const { uploadFile } = require("../awsS3/aws");

// const {
//   isValid,
//   isValidObjectId,
//   isValidSize,
//   isValidFiles,
//   isValidRequestBody,
//   isVlidPrice,
//   isValidNumber
// } = require("../validations/userValidation");

//==========================================Product===================================================

// const createProduct = async (req, res) => {
//   try {
//     let productData = JSON.parse(JSON.stringify(req.body));
//     let files = req.files;

//     if (!isValidRequestBody(productData)) {
//       return res.status(400).send({
//         status: true,
//         msg: "Please Provide data To Create Product",
//       });
//     }

//     let {
//       title,
//       description,
//       price,
//       currencyId,
//       currencyFormate,
//       isFreeShipping,
//       style,
//       availableSizes,
//       installments,
//     } = productData;

//     if (!(title && isValid(title)))
//       return res.status(400).send({
//         status: false,
//         msg: "Title is required  & It's should be a valid title",
//       });
//     let checkTitle = await productModel.findOne({ title });
//     if (checkTitle) {
//       return res.status(400).send({
//         status: false,
//         msg: "Title is already Used , Please Use Different title",
//       });
//     }

//     if (!(description && isValid(description))) {
//       return res.status(400).send({
//         status: false,
//         message: "Description is required & It should be a Valid description",
//       });
//     }

//     if (!price)
//       return res.status(400).send({
//         status: false,
//         msg: "Price is Required & Should be valid",
//       });

//     if (!isVlidPrice(price))
//       return res.status(400).send({
//         status: false,
//         msg: "Price Should be Valid and in Right Form",
//       });

//     if (!isValid(currencyId))
//       return res.status(400).send({
//         status: false,
//         msg: "CurrencyId Is required and Should be valid",
//       });

//     if (currencyId != "INR")
//       return res.status(400).send({
//         status: false,
//         msg: "Currency id should be 'INR' it can't accept any other Id.",
//       });

//     if (!isValid(currencyFormate))
//       return res.status(400).send({
//         status: false,
//         msg: "Corrency Formate is required and  should be valid",
//       });

//     if (currencyFormate != "₹")
//       return res.status(400).send({
//         status: false,
//         msg: "Currency Formate should be in '₹' Rupee format",
//       });
//     // console.log(currencyFormate)
//     if (!isValid(style))
//       return res.status(400).send({
//         status: false,
//         msg: "Style is Required",
//       });

//     // availableSizes = JSON.parse(availableSizes)
//     //     // return res.send({data: availableSizes})
//     //     for (let i of availableSizes) {
//     //          //console.log(i)
//     //         if (!isValidSize(i)) {
//     //             return res.status(400).send({ status: false, message: 'Please Provide Available Sizes from S,XS,M,X,L,XXL,XL' })
//     //         }
//     //     }

//     // if(availableSizes){
//     //     for(let i=0;i<availableSizes.length;i++){

//     //     }
//     // }

//     if (availableSizes) {
//       if (!isValidSize(availableSizes))
//         return res.status(400).send({
//           status: false,
//           msg: "Please Select between one of them => 'S', 'XS','M','X', 'L','XXL', 'XL' ",
//         });
//     }
//     if (isFreeShipping) {
//       if (!(isFreeShipping === "true" || isFreeShipping === "false")) {
//         return res.status(400).send({
//           status: false,
//           message: "isFreeShipping should have only true/false in it",
//         });
//       }
//     }
//     if (installments) {
//       if (
//         !(
//           installments == 2 ||
//           installments == 3 ||
//           installments == 4 ||
//           installments == 5 ||
//           installments == 6
//         )
//       )
//         return res.status(400).send({
//           status: false,
//           message: "Please select Installmet betwee 2 to 6 ",
//         });
//     }
//     // if (installments) {
//     // if (typeof installments == "number") {
//     //     if (installments >= 1 && installments <= 5) {
//     //     } else {
//     //       return res.status(400).send({
//     //         status: false,
//     //         message:
//     //           " please provide rating between 1 to 5 and type should be Number",
//     //       })}}};

//     if (!isValidFiles(files)) {
//       return res.status(400).send({
//         status: false,
//         msg: "Files Can't be empty",
//       });
//     }

//     productData.productImage = await uploadFile(files[0]);

//     const productFinalData = {
//       title: title,
//       description: description,
//       price: price,
//       currencyId: currencyId,
//       currencyFormate: currencyFormate,
//       installments: installments,
//       isFreeShipping: isFreeShipping,
//       style: style,
//       availableSizes: availableSizes,
//       productImage: productData.productImage,
//     };

//     let finalData = await productModel.create(productFinalData);
//     res.status(201).send({
//       status: true,
//       message: "Product Created Succesfilly",
//       data: finalData,
//     });
//     console.log(productFinalData);
//   } catch (error) {
//     console.log(error);
//     res.status(500).send({ status: false, msg: error.message });
//   }
// };

// const getAllProduct = async (req, res) => {
//   try {
//     let data = req.query;

//     let filter = { isDeleted: false };

//     if (data.name) {
//       if (!isValid(data.name)) {
//         return res.status(400).send({
//           status: false,
//           message: "Please enter valid name for filter.",
//         });
//       }
//       filter.title = { $regex: data.name };
//     }

//     if (data.size) {
//       data.size = data.size.toUpperCase();
//       data.size = data.size.split(",");

//       if (!isValidSize(data.size)) {
//         return res.status(400).send({
//           status: false,
//           message: "Sizes should be among [XS, S, M, L, XL, XXL]",
//         });
//       }

//       filter.availableSizes = { $in: data.size };
//     }

//     if (data.priceGreaterThan && data.priceLessThan) {
//       if (
//         !(
//           isValid(data.priceGreaterThan) && isValidNumber(data.priceGreaterThan)
//         )
//       ) {
//         return res.status(400).send({
//           status: false,
//           message: "Price filter should be a numeric value. Ga",
//         });
//       }
//       if (!(isValid(data.priceLessThan) && isValidNumber(data.priceLessThan))) {
//         return res.status(400).send({
//           status: false,
//           message: "Price filter should be a numeric value. La",
//         });
//       }
//       filter.price = { $gt: data.priceGreaterThan, $lt: data.priceLessThan };
//     } else if (data.priceGreaterThan) {
//       if (
//         !(
//           isValid(data.priceGreaterThan) && isValidNumber(data.priceGreaterThan)
//         )
//       ) {
//         return res.status(400).send({
//           status: false,
//           message: "Price filter should be a numeric value. G",
//         });
//       }
//       filter.price = { $gt: data.priceGreaterThan };
//     } else if (data.priceLessThan) {
//       if (!(isValid(data.priceLessThan) && isValidNumber(data.priceLessThan))) {
//         return res.status(400).send({
//           status: false,
//           message: "Price filter should be a numeric value.+",
//         });
//       }
//       filter.price = { $lt: data.priceLessThan };
//     }

//     if (data.priceSort) {
//       priceSort = data.priceSort;
//     } else {
//       priceSort = 1;
//     }

//     const product = await productModel.find(filter).sort({ price: priceSort });

//     if (product.length > 0) {
//       return res
//         .status(200)
//         .send({ status: true, message: "Success", data: product });
//     } else
//       return res
//         .status(404)
//         .send({ status: false, message: "No product found." });
//   } catch (err) {
//     console.log(err);
//     res.status(500).send({ status: false, Error: err.message });
//   }
// };

/*const getAllProduct = async function (req, res) {
  try {
    let data = {
      isDeleted: false,
    };
    let queryDataSize = req.query.size;
    if (queryDataSize) {
      if (!isValid(queryDataSize) && isValidSize(queryDataSize)) {
        return res
          .status(400)
          .send({ status: false, message: "plz Enter a valid Size" });
      }
      if (!isValidSize(queryDataSize)) {
        return res.status(400).send({
          status: false,
          message: "Please Provide Available Sizes from S,XS,M,X,L,XXL,XL",
        });
      }
      data["availableSizes"] = queryDataSize.trim();
    }
    let name = req.query.name;
    if (name) {
      if (!isValid(name)) {
        return res
          .status(400)
          .send({ status: false, message: "plz enter a valid name" });
      }
      data["title"] = { $regex: name.trim() };
    }
    let priceGreaterThan = req.query.priceGreaterThan;
    if (priceGreaterThan) {
      if (!isValid(priceGreaterThan)) {
        return res
          .status(400)
          .send({ status: false, message: "plz enter a valid name" });
      }
      data["price"] = {
        $gte: priceGreaterThan,
      };
    }
    let priceLessThan = req.query.priceLessThan;
    if (priceLessThan) {
      if (!isValid(priceLessThan)) {
        return res
          .status(400)
          .send({ status: false, message: "plz enter a valid name" });
      }
      data["price"] = {
        $lte: priceLessThan,
      };
    }
    if (priceLessThan && priceGreaterThan) {
      if (!isValid(priceLessThan)) {
        return res
          .status(400)
          .send({ status: false, message: "plz enter a valid price" });
      }
      if (!isValid(priceGreaterThan)) {
        return res
          .status(400)
          .send({ status: false, message: "plz enter a valid price" });
      }
      data["price"] = { $lte: priceLessThan, $gte: priceGreaterThan };
    }
    let filerProduct = await productModel
      .find(data)
      .sort({ price: req.query.priceSort });
    // let filerProduct = await productModel.find({title: {$regex: name}});
    if (filerProduct.length === 0) {
      return res.status(400).send({
        status: true,
        message: "No product found",
      });
    }
    return res.status(200).send({
      status: true,
      message: "products you want",
      data: filerProduct,
    });
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};*/

//--------------------------getbyId---------------------------------------------------------------------//

// const getProductById = async (req, res) => {
//   try {
//     const query = req.query;

//     if (Object.keys(query) != 0) {
//       return res
//         .status(400)
//         .send({ status: false, message: "Invalid params present in URL" });
//     }

//     const productId = req.params.productId;

//     if (!isValidObjectId(productId)) {
//       return res.status(400).send({
//         status: false,
//         message: `${productId} is not valid type Product Id`,
//       });
//     }

//     const findProduct = await productModel.findOne({
//       _id: productId,
//       isDeleted: false,
//     });
//     if (!findProduct) {
//       return res.status(404).send({
//         status: false,
//         message: "Product does not exists or has been deleted",
//       }); //Validate: The Product Id is valid or not.
//     }
//     return res.status(200).send({
//       status: true,
//       message: "Product found successfully",
//       data: findProduct,
//     });
//   } catch (error) {
//     console.log(err);
//     res.status(500).send({ message: err.message });
//   }
// };

// const updateProductById = async function (req, res) {
//   try {
//     let updateProductData = req.body;
//     let productId = req.params.productId;
//     if (!isValidRequestBody(updateProductData)) {
//       return res
//         .status(400)
//         .send({ status: false, message: "enter details to update product" });
//     }

//     if (!isValidObjectId(productId)) {
//       return res
//         .status(400)
//         .send({ status: false, message: "productId is required" });
//     }

//     checkproductId = await productModel.findOne({
//       _id: productId,
//       isDeleted: false,
//     });

//     if (!checkproductId) {
//       return res
//         .status(404)
//         .send({ status: false, message: "no product found" });
//     }

//     let {
//       title,
//       description,
//       price,
//       currencyId,
//       currencyFormate,
//       isFreeShipping,
//       productImage,
//       style,
//       availableSizes,
//       installments,
//     } = updateProductData;

//     let checkUniqueTitle = await productModel.findOne({ title: title });
//     if (checkUniqueTitle) {
//       return res.status(400).send({
//         status: false,
//         message: "title entered already exists. Please enter a new title",
//       });
//     }

//     let productData = {};

//     if (title) {
//       if (!isValid(title)) {
//         return res
//           .status(400)
//           .send({ status: false, message: "invalid Title" });
//       }
//       productData.title = title;
//     }

//     if (description) {
//       if (!isValid(description)) {
//         return res
//           .status(400)
//           .send({ status: false, message: " invalid description " });
//       }
//       productData.description = description;
//     }

//     if (price) {
//       if (!isVlidPrice(price))
//         return res.status(400).send({
//           status: false,
//           msg: "Price Should be Valid and in Right Form",
//         });
//       productData.price = price;
//     }

//     if (currencyId) {
//       if (currencyId != "INR")
//         return res.status(400).send({
//           status: false,
//           msg: "Currency id should be 'INR' it can't accept any other Id.",
//         });
//       productData.currencyId = currencyId;
//     }

//     if (currencyFormate) {
//       if (currencyFormate != "₹")
//         return res.status(400).send({
//           status: false,
//           msg: "Currency Formate should be in '₹' Rupee format",
//         });
//       productData.currencyFormate = currencyFormate;
//     }

//     if (isFreeShipping) {
//       if (!(isFreeShipping === "true" || isFreeShipping === "false")) {
//         return res.status(400).send({
//           status: false,
//           message: "isFreeShipping should have only true/false in it",
//         });
//       }
//       productData.isFreeShipping = isFreeShipping;
//     }

//     if (style) {
//       if (!isValid(style)) {
//         return res
//           .status(400)
//           .send({ status: false, message: "style is not valid" });
//       }
//       productData.style = style;
//     }

//     if (installments) {
//       if (
//         !(
//           installments == 2 ||
//           installments == 3 ||
//           installments == 4 ||
//           installments == 5 ||
//           installments == 6
//         )
//       )
//         return res.status(400).send({
//           status: false,
//           message: "Please select Installmet betwee 2 to 6 ",
//         });
//       productData.installments = installments;
//     }

//     if (availableSizes) {
//       if (!isValidSize(availableSizes))
//         return res.status(400).send({
//           status: false,
//           msg: "Please Select between one of them => 'S', 'XS','M','X', 'L','XXL', 'XL' ",
//         });
//       productData.availableSizes = availableSizes;
//     }

//     if (productImage != undefined)
//       return res.status(400).send({
//         status: false,
//         message: "productImage field should have a image file",
//       });

//     let files = req.files;

//     if (isValidFiles(files)) {
//       if (files.length > 1 || files[0].fieldname != "productImage")
//         return res.status(400).send({
//           status: false,
//           message: `Only One productImage is allowed by the field name productImage, no any other file or field allowed `,
//         });

//       if (!["image/png", "image/jpeg"].includes(files[0].mimetype))
//         return res.status(400).send({
//           status: false,
//           message: "only png,jpg,jpeg files are allowed from productImage",
//         });

//       userData.productImage = await uploadFile.uploadFile(files[0]);
//     }

//     let updatedProduct = await productModel
//       .findOneAndUpdate({ _id: productId }, productData, { new: true })
//       .select({ createdAt: 0, __v: 0, deletedAt: 0 });

//     res
//       .status(200)
//       .send({ status: true, message: "Success", data: updatedProduct });
//     console.log(updatedProduct);
//   } catch (err) {
//     res.status(500).send({ status: false, message: err.message });
//   }
// };

// const deleteProduct = async (req, res) => {
//   try {
//     let productId = req.params.productId;
//     if (!isValidObjectId(productId)) {
//       return res.status(400).send({
//         status: false,
//         msg: "Productid is invalid Please enter valid ProductId",
//       });
//     }

//     let findProduct = await productModel.findById(productId);
//     if (!findProduct) {
//       return res
//         .status(404)
//         .send({ status: false, msg: "This Product not Found" });
//     }
//     if (findProduct.isDeleted == true) {
//       return res
//         .status(400)
//         .send({ status: true, msg: "Product is already deleted" });
//     }
//     const deletedProduct = await productModel
//       .findOneAndUpdate(
//         { _id: productId },
//         { $set: { isDeleted: true, deletedAt: new Date() } },
//         { new: true }
//       )
//       .select({ _id: 1, title: 1, isDeleted: 1, deletedAt: 1 });
//     res.status(200).send({
//       status: true,
//       message: "Product deleted successfullly.",
//       data: deletedProduct,
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).send({ status: false, msg: error.message });
//   }
// };

// module.exports = {
//   createProduct,
//   deleteProduct,
//   updateProductById,
//   getAllProduct,
//   getProductById,
// };
