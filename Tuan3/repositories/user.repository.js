const {
  PutCommand,
  GetCommand,
  QueryCommand
} = require("@aws-sdk/lib-dynamodb");

const db = require("../services/dynamodb.service");

const TABLE_NAME = process.env.USERS_TABLE || "Users";

// Tạo user mới
exports.createUser = async (user) => {
  await db.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: user
    })
  );
  return user;
};

// Lấy user theo userId
exports.getUserById = async (userId) => {
  const result = await db.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { userId }
    })
  );
  return result.Item || null;
};

// Lấy user theo username
exports.getUserByUsername = async (username) => {
  // DynamoDB không có JOIN, cần scan hoặc tạo GSI
  // Ở đây dùng scan với filter (không tối ưu nhưng đơn giản)
  // Trong production nên tạo GSI với username làm partition key
  const { ScanCommand } = require("@aws-sdk/lib-dynamodb");
  
  const result = await db.send(
    new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "username = :username",
      ExpressionAttributeValues: {
        ":username": username
      }
    })
  );
  
  return result.Items && result.Items.length > 0 ? result.Items[0] : null;
};

// Lấy tất cả users (admin only)
exports.getAllUsers = async () => {
  const { ScanCommand } = require("@aws-sdk/lib-dynamodb");
  const result = await db.send(
    new ScanCommand({
      TableName: TABLE_NAME
    })
  );
  return result.Items || [];
};
