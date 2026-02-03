const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { 
  DynamoDBDocumentClient, 
  GetCommand, 
  PutCommand, 
  ScanCommand,
  UpdateCommand 
} = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");

// Cấu hình DynamoDB Client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1"
});

const docClient = DynamoDBDocumentClient.from(client);

const PRODUCTS_TABLE = process.env.DYNAMODB_TABLE || "Products";
const PRODUCT_LOGS_TABLE = process.env.DYNAMODB_PRODUCT_LOGS_TABLE || "ProductLogs";

class ProductRepository {
  // Tạo product mới
  async createProduct(productData) {
    const { name, price, quantity, categoryId, url_image } = productData;
    
    const product = {
      id: uuidv4(),
      name,
      price: Number(price),
      quantity: Number(quantity),
      categoryId: categoryId || null,
      url_image: url_image || null,
      isDeleted: false,
      createdAt: new Date().toISOString()
    };

    const command = new PutCommand({
      TableName: PRODUCTS_TABLE,
      Item: product
    });

    await docClient.send(command);
    return product;
  }

  // Lấy tất cả products (không bị xóa)
  async getAllProducts(filters = {}) {
    const { categoryId, minPrice, maxPrice, name, includeDeleted = false } = filters;
    
    let filterExpression = includeDeleted ? "" : "isDeleted = :isDeleted";
    const expressionAttributeValues = includeDeleted ? {} : { ":isDeleted": false };
    const expressionAttributeNames = {};

    // Filter by category
    if (categoryId) {
      if (filterExpression) filterExpression += " AND ";
      filterExpression += "categoryId = :categoryId";
      expressionAttributeValues[":categoryId"] = categoryId;
    }

    // Filter by price range
    if (minPrice !== undefined) {
      if (filterExpression) filterExpression += " AND ";
      filterExpression += "price >= :minPrice";
      expressionAttributeValues[":minPrice"] = Number(minPrice);
    }

    if (maxPrice !== undefined) {
      if (filterExpression) filterExpression += " AND ";
      filterExpression += "price <= :maxPrice";
      expressionAttributeValues[":maxPrice"] = Number(maxPrice);
    }

    // Filter by name (contains)
    if (name) {
      if (filterExpression) filterExpression += " AND ";
      filterExpression += "contains(#name, :name)";
      expressionAttributeNames["#name"] = "name";
      expressionAttributeValues[":name"] = name;
    }

    const command = new ScanCommand({
      TableName: PRODUCTS_TABLE,
      FilterExpression: filterExpression || undefined,
      ExpressionAttributeValues: Object.keys(expressionAttributeValues).length > 0 ? expressionAttributeValues : undefined,
      ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined
    });

    const result = await docClient.send(command);
    return result.Items || [];
  }

  // Tìm product theo ID
  async findById(productId, includeDeleted = false) {
    const command = new GetCommand({
      TableName: PRODUCTS_TABLE,
      Key: { id: productId }
    });

    const result = await docClient.send(command);
    const product = result.Item;
    
    if (!product || (!includeDeleted && product.isDeleted)) {
      return null;
    }
    
    return product;
  }

  // Cập nhật product
  async updateProduct(productId, updateData) {
    const { name, price, quantity, categoryId, url_image } = updateData;
    
    const updateExpression = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    if (name) {
      updateExpression.push("#name = :name");
      expressionAttributeNames["#name"] = "name";
      expressionAttributeValues[":name"] = name;
    }

    if (price !== undefined) {
      updateExpression.push("price = :price");
      expressionAttributeValues[":price"] = Number(price);
    }

    if (quantity !== undefined) {
      updateExpression.push("quantity = :quantity");
      expressionAttributeValues[":quantity"] = Number(quantity);
    }

    if (categoryId !== undefined) {
      updateExpression.push("categoryId = :categoryId");
      expressionAttributeValues[":categoryId"] = categoryId;
    }

    if (url_image !== undefined) {
      updateExpression.push("url_image = :url_image");
      expressionAttributeValues[":url_image"] = url_image;
    }

    if (updateExpression.length === 0) {
      throw new Error("Không có dữ liệu để cập nhật");
    }

    const command = new UpdateCommand({
      TableName: PRODUCTS_TABLE,
      Key: { id: productId },
      UpdateExpression: `SET ${updateExpression.join(", ")}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
      ConditionExpression: "attribute_exists(id) AND isDeleted = :false",
      ExpressionAttributeValues: {
        ...expressionAttributeValues,
        ":false": false
      },
      ReturnValues: "ALL_NEW"
    });

    const result = await docClient.send(command);
    return result.Attributes;
  }

  // Soft delete product
  async softDeleteProduct(productId) {
    const command = new UpdateCommand({
      TableName: PRODUCTS_TABLE,
      Key: { id: productId },
      UpdateExpression: "SET isDeleted = :true",
      ExpressionAttributeValues: {
        ":true": true,
        ":false": false
      },
      ConditionExpression: "attribute_exists(id) AND isDeleted = :false",
      ReturnValues: "ALL_NEW"
    });

    const result = await docClient.send(command);
    return result.Attributes;
  }

  // Khôi phục product
  async restoreProduct(productId) {
    const command = new UpdateCommand({
      TableName: PRODUCTS_TABLE,
      Key: { id: productId },
      UpdateExpression: "SET isDeleted = :false",
      ExpressionAttributeValues: {
        ":false": false,
        ":true": true
      },
      ConditionExpression: "attribute_exists(id) AND isDeleted = :true",
      ReturnValues: "ALL_NEW"
    });

    const result = await docClient.send(command);
    return result.Attributes;
  }

  // Lấy products theo inventory status
  async getProductsByInventoryStatus() {
    const products = await this.getAllProducts();
    
    return {
      inStock: products.filter(p => p.quantity > 5),
      lowStock: products.filter(p => p.quantity > 0 && p.quantity <= 5),
      outOfStock: products.filter(p => p.quantity === 0)
    };
  }

  // Log product action
  async logProductAction(productId, action, userId) {
    const logEntry = {
      logId: uuidv4(),
      productId,
      action, // CREATE, UPDATE, DELETE
      userId,
      timestamp: new Date().toISOString()
    };

    const command = new PutCommand({
      TableName: PRODUCT_LOGS_TABLE,
      Item: logEntry
    });

    await docClient.send(command);
    return logEntry;
  }

  // Lấy logs của product
  async getProductLogs(productId) {
    const command = new ScanCommand({
      TableName: PRODUCT_LOGS_TABLE,
      FilterExpression: "productId = :productId",
      ExpressionAttributeValues: {
        ":productId": productId
      }
    });

    const result = await docClient.send(command);
    return result.Items || [];
  }
}

module.exports = new ProductRepository();