const express = require("express");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");
const dynamodb = require("../services/dynamodb");
const s3 = require("../services/s3");
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
require("dotenv").config();
router.get("/", async (req, res) => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
  };
  const data = await dynamodb.scan(params).promise();
  res.render("list", { products: data.Items });
});

router.get("/add", (req, res) => {
  res.render("add");
});

router.post("/add", upload.single("image"), async (req, res) => {
  const { name, price } = req.body;
  const id = uuidv4();

  let url_image = "";

  // Lấy tên file nếu có upload
  if (req.file) {
    url_image = req.file.originalname;
  }

  // Lưu DynamoDB
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Item: {
      id,
      name,
      price: Number(price),
      url_image: url_image,
    },
  };

  await dynamodb.put(params).promise();
  res.redirect("/");
});

router.get("/edit/:id", async (req, res) => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Key: { id: req.params.id },
  };

  const data = await dynamodb.get(params).promise();
  res.render("edit", { product: data.Item });
});
router.post("/edit/:id", upload.single("image"), async (req, res) => {
  const { name, price } = req.body;
  let url_image = "";

  // Lấy tên file nếu có upload mới, nếu không giữ file cũ
  if (req.file) {
    url_image = req.file.originalname;
  } else {
    // Lấy ảnh cũ từ database nếu không có upload mới
    const getParams = {
      TableName: process.env.DYNAMODB_TABLE,
      Key: { id: req.params.id },
    };
    const oldData = await dynamodb.get(getParams).promise();
    url_image = oldData.Item.url_image;
  }

  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Key: { id: req.params.id },
    UpdateExpression:
      "set #n=:n, price=:p, url_image=:i",
    ExpressionAttributeNames: {
      "#n": "name",
    },
    ExpressionAttributeValues: {
      ":n": name,
      ":p": Number(price),
      ":i": url_image,
    },
  };

  await dynamodb.update(params).promise();
  res.redirect("/");
});

router.get("/delete/:id", async (req, res) => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Key: { id: req.params.id },
  };

  await dynamodb.delete(params).promise();
  res.redirect("/");
});

module.exports = router;