const express = require("express");
const cors = require("cors");
require("./db/config");

const User = require("./db/User");
const Product = require("./db/Product");
const jwt = require("jsonwebtoken");
const jwtKey = "e-comm";

const app = express();
app.use(express.json());
app.use(cors());
app.post("/register", async (req, resp) => {
  let user = new User(req.body);
  let result = await user.save();
  result = result.toObject();
  delete result.password;
  jwt.sign({ result }, jwtKey, { expiresIn: "2h" }, (error, token) => {
    if (error) {
      resp.send({ result: "something went wrong" });
    }
    resp.send({ result, token: token });
  });
  // resp.send(result);
});

app.post("/login", async (req, resp) => {
  console.log(req.body);
  if (req.body.password && req.body.email) {
    let user = await User.findOne(req.body).select("-password");
    if (user) {
      jwt.sign({ user }, jwtKey, { expiresIn: "2h" }, (error, token) => {
        if (error) {
          resp.send({ result: "something went wrong" });
        }
        resp.send({ user, token: token });
      });
    } else {
      resp.send({ result: "No User Found" });
    }
  } else {
    resp.send({ result: "No User Found" });
  }
});

app.post("/add-product", verifyToken, async (req, resp) => {
  let product = new Product(req.body);
  let result = await product.save();
  resp.send(result);
});
app.get("/products", verifyToken, async (req, resp) => {
  let products = await Product.find();
  if (products.length > 0) {
    resp.send(products);
  } else {
    resp.send({ result: "no product found" });
  }
});
// for delete
app.delete("/product/:id", verifyToken, async (req, resp) => {
  const result = await Product.deleteOne({ _id: req.params.id });
  resp.send(result);
});

// update for single product
app.get("/product/:id", verifyToken, async (req, resq) => {
  let result = await Product.findOne({ _id: req.params.id });
  if (result) {
    resq.send(result);
  } else {
    resq.send({ result: "No Result Found" });
  }
});
// update product
app.put("/product/:id", verifyToken, async (req, resp) => {
  let result = await Product.updateOne(
    { _id: req.params.id },
    {
      $set: req.body,
    }
  );
  resp.send(result);
});
// search api
app.get("/search/:key", verifyToken, async (req, resp) => {
  let result = await Product.find({
    $or: [
      { name: { $regex: req.params.key } },
      { company: { $regex: req.params.key } },
      { category: { $regex: req.params.key } },
    ],
  });
  resp.send(result);
});

// midleware
// verify token
function verifyToken(req, resp, next) {
  let token = req.headers["authorization"];
  if (token) {
    token = token.split(" ")[0];
    jwt.verify(token, jwtKey, (err, valid) => {
      if (err) {
        resp
          .status(404)
          .send({ result: "please provide valid token with header" });
      } else {
        next();
      }
    });
  } else {
    resp.status(403).send({ result: "please add token with header" });
  }
}
app.listen(5000);
