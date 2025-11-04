
const mongoose = require("mongoose")

const isValidObject = (data) => {
    if (Object.keys(data).length === 0){
        return false
    }
    return true
}

const isValid = (value) => {
    if(typeof(value) == "undefined" || value == null)return false
    if(typeof(value) == "string" && value.trim().length === 0) return false
    if(typeof(value) == "number" && value === null) return false
    return true
}

const isValidPhone = (value) => {
    return /^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[6789]\d{9}$/.test(value)
}

const isValidEmail = (value) => {
    return /^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(value.trim())
}

const isValidPW = (value) => {
    return /^[a-zA-Z0-9'@&#.\s]{8,15}$/.test(value.trim())
}


const isValidObjectId = (value) => {
    return mongoose.Types.ObjectId.isValid(value)

}

const isValidSize = function (title) {
    return ["S", "XS","M","X", "L","XXL", "XL"].indexOf(title) !== -1
}

const isValidString = (value) => {
    return /^[a-zA-Z -]+$/.test(value)
}

const isValidPincode = (value) =>{
    return /^[1-9][0-9]{5}$/.test(value)
   }


module.exports.isValidObject = isValidObject
module.exports.isValid = isValid
module.exports.isValidPhone = isValidPhone
module.exports.isValidEmail = isValidEmail
module.exports.isValidPW = isValidPW
module.exports.isValidObjectId = isValidObjectId
module.exports.isValidSize = isValidSize
module.exports.isValidString = isValidString
module.exports.isValidPincode=isValidPincode