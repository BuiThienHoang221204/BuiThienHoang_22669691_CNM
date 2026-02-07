require("dotenv").config();
const AWS = require("aws-sdk");
const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
});
module.exports = s3;
