const express = require('express')
const route = require('./routes/routes.js')
const mongoose = require('mongoose')
const app = express()
const multer = require("multer")

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(multer().any())


mongoose.connect("mongodb+srv://AshutoshGupta:ashutosh54264850@cluster0.ukus0.mongodb.net/group68Database", {
    useNewUrlParser: true
})
    .then(() => console.log("MongoDb is connected"))
    .catch(err => console.log(err));
    

app.use('/', route)

app.listen(process.env.PORT || 3000, function () {
    console.log('Express app running on port: ' + (process.env.PORT || 3000))
}) 