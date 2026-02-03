const {
  PutCommand,
  GetCommand,
  ScanCommand,
  UpdateCommand,
  QueryCommand
} = require("@aws-sdk/lib-dynamodb");

const db = require("../services/dynamodb.service");

const TABLE_NAME = process.env.DYNAMODB_TABLE || "Products";

// Tạo product mới
exports.createProduct = async (product) => {
  await db.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: product
    })
  );
  return product;
};

// Lấy product theo id
exports.getProductById = async (id) => {
  const result = await db.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { id }
    })
  );
  return result.Item || null;
};

// Lấy tất cả products (không bao gồm soft deleted)
exports.getAllProducts = async () => {
  const result = await db.send(
    new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "attribute_not_exists(isDeleted) OR isDeleted = :false",
      ExpressionAttributeValues: {
        ":false": false
      }
    })
  );
  return result.Items || [];
};

// Lấy products với filter và pagination
exports.getProductsWithFilter = async (filters = {}, limit = 10, lastEvaluatedKey = null) => {
  let filterExpressions = [];
  let expressionAttributeValues = {};
  let expressionAttributeNames = {};

  // Filter: isDeleted = false
  filterExpressions.push("(attribute_not_exists(isDeleted) OR isDeleted = :false)");
  expressionAttributeValues[":false"] = false;

  // Filter: categoryId
  if (filters.categoryId) {
    filterExpressions.push("categoryId = :categoryId");
    expressionAttributeValues[":categoryId"] = filters.categoryId;
  }

  // Filter: price range
  if (filters.minPrice !== undefined) {
    filterExpressions.push("price >= :minPrice");
    expressionAttributeValues[":minPrice"] = filters.minPrice;
  }
  if (filters.maxPrice !== undefined) {
    filterExpressions.push("price <= :maxPrice");
    expressionAttributeValues[":maxPrice"] = filters.maxPrice;
  }

  // Filter: name contains (scan required - tốn chi phí)
  // Lưu ý: Scan tốn chi phí vì phải đọc toàn bộ bảng
  // Query chỉ dùng được với partition key và sort key
  // Để tối ưu, nên tạo GSI với name làm sort key hoặc dùng Elasticsearch
  const scanParams = {
    TableName: TABLE_NAME,
    FilterExpression: filterExpressions.join(" AND "),
    ExpressionAttributeValues: expressionAttributeValues,
    Limit: limit
  };

  if (lastEvaluatedKey) {
    scanParams.ExclusiveStartKey = lastEvaluatedKey;
  }

  // Nếu có filter theo name, thêm vào FilterExpression
  if (filters.name) {
    scanParams.FilterExpression += " AND contains(#n, :name)";
    expressionAttributeNames["#n"] = "name";
    expressionAttributeValues[":name"] = filters.name;
    scanParams.ExpressionAttributeNames = expressionAttributeNames;
  }

  const result = await db.send(new ScanCommand(scanParams));

  return {
    items: result.Items || [],
    lastEvaluatedKey: result.LastEvaluatedKey || null,
    count: result.Count || 0
  };
};

// Cập nhật product
exports.updateProduct = async (id, updateData) => {
  const updateExpression = [];
  const expressionAttributeNames = {};
  const expressionAttributeValues = {};

  if (updateData.name !== undefined) {
    updateExpression.push("#n = :n");
    expressionAttributeNames["#n"] = "name";
    expressionAttributeValues[":n"] = updateData.name;
  }

  if (updateData.price !== undefined) {
    updateExpression.push("price = :p");
    expressionAttributeValues[":p"] = updateData.price;
  }

  if (updateData.quantity !== undefined) {
    updateExpression.push("quantity = :q");
    expressionAttributeValues[":q"] = updateData.quantity;
  }

  if (updateData.categoryId !== undefined) {
    updateExpression.push("categoryId = :c");
    expressionAttributeValues[":c"] = updateData.categoryId;
  }

  if (updateData.url_image !== undefined) {
    updateExpression.push("url_image = :img");
    expressionAttributeValues[":img"] = updateData.url_image;
  }

  if (updateData.isDeleted !== undefined) {
    updateExpression.push("isDeleted = :del");
    expressionAttributeValues[":del"] = updateData.isDeleted;
  }

  await db.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { id },
      UpdateExpression: "SET " + updateExpression.join(", "),
      ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
      ExpressionAttributeValues: expressionAttributeValues
    })
  );

  return await this.getProductById(id);
};

// Soft delete product
exports.softDeleteProduct = async (id) => {
  return await this.updateProduct(id, { isDeleted: true });
};

// Hard delete product (xóa thật sự)
exports.deleteProduct = async (id) => {
  const { DeleteCommand } = require("@aws-sdk/lib-dynamodb");
  await db.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { id }
    })
  );
};
