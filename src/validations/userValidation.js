const mongoose = require("mongoose");

const isValid = (value) => {
  if (typeof value == "undefined" || value == null) return false;
  if (typeof value == "string" && value.trim().length === 0) return false;
  if (typeof value == "number" && value === null) return false;
  return true;
};

const isValidRequestBody = (data) => {
  if (Object.keys(data).length === 0) {
    return false;
  }
  return true;
};

const isValidPhone = (value) => {
  return /^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[6789]\d{9}$/.test(value);
};

const isValidPassword = (value) => {
  return /^[a-zA-Z0-9'@&#.\s]{8,15}$/.test(value.trim());
};

const isValidObjectId = (value) => {
  return mongoose.Types.ObjectId.isValid(value);
};

const isValidSize = function (size) {
  let flag = 0;
  for (x in size) {
    let res = ["S", "XS", "M", "X", "L", "XXL", "XL"].indexOf(size) != -1;
    if (!res) {
      flag = 1;
      break;
    }
  }
  if (flag == 1) return false;
  else return true;
};

const isValidString = (value) => {
  return /^[a-zA-Z -]+$/.test(value);
};
 const isValidNumber=(num) =>{
  if( num || num=="string" || num ==undefined || num== null) return false;
  return true;
 }

// const isValidPincode = (value) => {
//   // if( value || value=="string" || value ==undefined || value== null) return false;
//   let regex= "^[1-9]{1}[0-9]{2}\\s{0, 1}[0-9]{3}$";
//   return regex.test(value)
// };
const isValidPincode = function (value){
  if(typeof value == '' || value === null) return false;
  if(value[0] == '0') return false;
  return true;
}

const isValidFiles = (files) => {
  if (files && files.length > 0) return true;
};
const isValidName = function (val) {
  let regx = /^[a-zA-z]+([\s][a-zA-Z]+)*$/;
  return regx.test(val);
};

const isValidEmail = (value) => {
  return /^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(value.trim());
};
const isvalidaddress = function (val) {
  let regx = /^[a-zA-Z0-9\s,.'-]{3,}$/ ;
  return regx.test(val);
};
const isVlidPrice = (price) => {
  let regex = /^(?:0|[1-9]\d*)(?:\.(?!.*000)\d+)?$/;
  return regex.test(price);
};

module.exports = {
  isValidFiles,
  isValidPincode,
  isValidString,
  isValidSize,
  isValidObjectId,
  isValidPassword,
  isValidPhone,
  isValid,
  isValidRequestBody,
  isValidName,
  isValidEmail,
  isvalidaddress,
  isVlidPrice,
  isValidNumber
};
