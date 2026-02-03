const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { 
  DynamoDBDocumentClient, 
  GetCommand, 
  PutCommand, 
  ScanCommand,
  UpdateCommand,
  DeleteCommand 
} = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");

// Cấu hình DynamoDB Client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1"
});

const docClient = DynamoDBDocumentClient.from(client);

const CATEGORIES_TABLE = process.env.DYNAMODB_CATEGORIES_TABLE || "Categories";

class CategoryRepository {
  // Tạo category mới
  async createCategory(categoryData) {
    const { name, description = "" } = categoryData;
    
    const category = {
      categoryId: uuidv4(),
      name,
      description,
      createdAt: new Date().toISOString()
    };

    const command = new PutCommand({
      TableName: CATEGORIES_TABLE,
      Item: category
    });

    await docClient.send(command);
    return category;
  }

  // Lấy tất cả categories
  async getAllCategories() {
    const command = new ScanCommand({
      TableName: CATEGORIES_TABLE
    });

    const result = await docClient.send(command);
    return result.Items || [];
  }

  // Tìm category theo ID
  async findById(categoryId) {
    const command = new GetCommand({
      TableName: CATEGORIES_TABLE,
      Key: { categoryId }
    });

    const result = await docClient.send(command);
    return result.Item || null;
  }

  // Cập nhật category
  async updateCategory(categoryId, updateData) {
    const { name, description } = updateData;
    
    const updateExpression = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    if (name) {
      updateExpression.push("#name = :name");
      expressionAttributeNames["#name"] = "name";
      expressionAttributeValues[":name"] = name;
    }

    if (description !== undefined) {
      updateExpression.push("description = :description");
      expressionAttributeValues[":description"] = description;
    }

    if (updateExpression.length === 0) {
      throw new Error("Không có dữ liệu để cập nhật");
    }

    const command = new UpdateCommand({
      TableName: CATEGORIES_TABLE,
      Key: { categoryId },
      UpdateExpression: `SET ${updateExpression.join(", ")}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
      ReturnValues: "ALL_NEW"
    });

    const result = await docClient.send(command);
    return result.Attributes;
  }

  // Xóa category
  async deleteCategory(categoryId) {
    const command = new DeleteCommand({
      TableName: CATEGORIES_TABLE,
      Key: { categoryId }
    });

    await docClient.send(command);
    return true;
  }

  // Kiểm tra category có tồn tại không
  async exists(categoryId) {
    const category = await this.findById(categoryId);
    return !!category;
  }
}

module.exports = new CategoryRepository();