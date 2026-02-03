const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

// Cấu hình DynamoDB Client
// AWS SDK sẽ tự động lấy credentials theo thứ tự:
// 1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
// 2. IAM Role (nếu chạy trên EC2/ECS/Lambda)
// 3. AWS credentials file (~/.aws/credentials)
// 4. EC2 instance metadata (nếu chạy trên EC2)

const clientConfig = {
  region: process.env.AWS_REGION || "ap-southeast-1"
};

// Nếu có access keys trong env (cho local development)
// Nếu không có, AWS SDK sẽ tự động dùng IAM Role trên EC2
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  clientConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  };
}

const client = new DynamoDBClient(clientConfig);

// DynamoDB Document Client để làm việc với JavaScript objects
module.exports = DynamoDBDocumentClient.from(client);
