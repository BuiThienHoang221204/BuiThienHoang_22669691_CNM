const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

// Cấu hình DynamoDB Client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1"
});

const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE || "Users";

class UserRepository {
  // Tạo user mới
  async createUser(userData) {
    const { username, password, role = "staff" } = userData;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = {
      userId: uuidv4(),
      username,
      password: hashedPassword,
      role,
      createdAt: new Date().toISOString()
    };

    const command = new PutCommand({
      TableName: USERS_TABLE,
      Item: user,
      ConditionExpression: "attribute_not_exists(username)" // Đảm bảo username unique
    });

    await docClient.send(command);
    
    // Không return password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // Tìm user theo username
  async findByUsername(username) {
    const command = new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: "username = :username",
      ExpressionAttributeValues: {
        ":username": username
      }
    });

    const result = await docClient.send(command);
    return result.Items?.[0] || null;
  }

  // Tìm user theo ID
  async findById(userId) {
    const command = new GetCommand({
      TableName: USERS_TABLE,
      Key: { userId }
    });

    const result = await docClient.send(command);
    return result.Item || null;
  }

  // Xác thực user
  async authenticate(username, password) {
    const user = await this.findByUsername(username);
    if (!user) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return null;
    }

    // Không return password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // Lấy tất cả users
  async getAllUsers() {
    const command = new ScanCommand({
      TableName: USERS_TABLE,
      ProjectionExpression: "userId, username, #role, createdAt",
      ExpressionAttributeNames: {
        "#role": "role" // role là reserved word trong DynamoDB
      }
    });

    const result = await docClient.send(command);
    return result.Items || [];
  }
}

module.exports = new UserRepository();