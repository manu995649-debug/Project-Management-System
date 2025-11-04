const jwt = require("jsonwebtoken");

const auth = async function (req, res, next) {
  try {
    let token = req.headers["authorization"];
    
    if (!token) {
      return res.status(401).send({ status: false, message: "Missing authentication token in request.", });
    }
    
    token = token.split(' ')[1];
    
    const decoded = jwt.decode(token);
    console.log(decoded);
    if (!decoded) {
      return res.status(400).send({ status: false, message: "Bearer token required." })
    }
    if (Date.now() > (decoded.exp) * 1000) {
      return res.status(440).send({ status: false, message: "Session expired! Please login again." })
    }

    jwt.verify(token, "functionup-project-5", function (err, decoded) {
      if (err) {
        return res.status(401).send({ status: false, message: "The token is invalid." });
      }
      else {
        req.userId = decoded.userId;
        return next();
      }
    });

  }
  catch (error) {
    res.status(500).send({ status: false, message: error.message });
  }
};

module.exports = {auth};