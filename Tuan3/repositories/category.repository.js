const {
  PutCommand,
  GetCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand
} = require("@aws-sdk/lib-dynamodb");

const db = require("../services/dynamodb.service");

const TABLE_NAME = process.env.CATEGORIES_TABLE || "Categories";

// Tạo category mới
exports.createCategory = async (category) => {
  await db.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: category
    })
  );
  return category;
};

// Lấy category theo categoryId
exports.getCategoryById = async (categoryId) => {
  const result = await db.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { categoryId }
    })
  );
  return result.Item || null;
};

// Lấy tất cả categories
exports.getAllCategories = async () => {
  const result = await db.send(
    new ScanCommand({
      TableName: TABLE_NAME
    })
  );
  return result.Items || [];
};

// Cập nhật category
exports.updateCategory = async (categoryId, updateData) => {
  const updateExpression = [];
  const expressionAttributeNames = {};
  const expressionAttributeValues = {};

  if (updateData.name !== undefined) {
    updateExpression.push("#n = :n");
    expressionAttributeNames["#n"] = "name";
    expressionAttributeValues[":n"] = updateData.name;
  }

  if (updateData.description !== undefined) {
    updateExpression.push("description = :d");
    expressionAttributeValues[":d"] = updateData.description;
  }

  await db.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { categoryId },
      UpdateExpression: "SET " + updateExpression.join(", "),
      ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
      ExpressionAttributeValues: expressionAttributeValues
    })
  );

  return await this.getCategoryById(categoryId);
};

// Xóa category
exports.deleteCategory = async (categoryId) => {
  await db.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { categoryId }
    })
  );
};
