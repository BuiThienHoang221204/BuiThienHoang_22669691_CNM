const { PutCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const db = require("../services/dynamodb.service");

const TABLE_NAME = process.env.PRODUCT_LOGS_TABLE || "ProductLogs";

exports.createLog = async (log) => {
  await db.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: log
    })
  );
  return log;
};

// Lấy log theo productId (đơn giản dùng Scan + Filter)
exports.getLogsByProductId = async (productId) => {
  const result = await db.send(
    new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "productId = :pid",
      ExpressionAttributeValues: {
        ":pid": productId
      }
    })
  );
  return result.Items || [];
};

