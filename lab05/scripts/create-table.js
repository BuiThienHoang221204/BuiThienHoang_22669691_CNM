require('dotenv').config();
const AWS = require('aws-sdk');

const tableName = process.env.DYNAMODB_TABLE || 'products';
const endpoint = process.env.DYNAMODB_ENDPOINT || undefined;
const region = process.env.AWS_REGION || 'us-east-1';

const dynamodb = new AWS.DynamoDB({ endpoint, region });

async function tableExists(name) {
  try {
    await dynamodb.describeTable({ TableName: name }).promise();
    return true;
  } catch (err) {
    if (err.code === 'ResourceNotFoundException') return false;
    // Fallback: try listTables (handles some DynamoDB Local errors)
    try {
      const tables = await dynamodb.listTables().promise();
      return tables.TableNames && tables.TableNames.includes(name);
    } catch (e) {
      // if listTables also fails, rethrow original error
      throw err;
    }
  }
}

async function createTable(name) {
  const params = {
    TableName: name,
    AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    BillingMode: 'PAY_PER_REQUEST',
  };

  console.log(`Creating table ${name}...`);
  try {
    const result = await dynamodb.createTable(params).promise();
    console.log('CreateTable response:', result);
  } catch (err) {
    // If create fails but table appears in list, treat as success
    if (err.code === 'InternalFailure') {
      console.warn('CreateTable reported InternalFailure; checking existing tables...');
      const tables = await dynamodb.listTables().promise();
      if (tables.TableNames && tables.TableNames.includes(name)) {
        console.log(`Table "${name}" already exists (detected after InternalFailure).`);
        return;
      }
    }
    throw err;
  }
}

(async () => {
  try {
    const exists = await tableExists(tableName);
    if (exists) {
      console.log(`Table "${tableName}" already exists.`);
      process.exit(0);
    }

    await createTable(tableName);

    // Wait for table to become active
    console.log('Waiting for table to become ACTIVE...');
    await dynamodb.waitFor('tableExists', { TableName: tableName }).promise();
    console.log(`Table "${tableName}" is now ACTIVE.`);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();