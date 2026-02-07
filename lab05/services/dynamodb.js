require("dotenv").config();
const AWS = require("aws-sdk");

const isLocal = process.env.DYNAMODB_ENDPOINT; // nếu có endpoint thì dùng local

AWS.config.update({
  region: process.env.AWS_REGION || "local",

  // cần cho DynamoDB Local
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || "fake",
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "fake",
});

const dynamoDB = new AWS.DynamoDB.DocumentClient({
  endpoint: isLocal || undefined,
});

module.exports = dynamoDB;
