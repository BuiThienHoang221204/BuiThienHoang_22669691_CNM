const { v4: uuidv4 } = require("uuid");
const productLogRepository = require("../repositories/productLog.repository");

const buildLog = (productId, action, userId) => ({
  logId: uuidv4(),
  productId,
  action, // CREATE | UPDATE | DELETE
  userId: userId || "unknown",
  time: new Date().toISOString()
});

exports.logCreate = async (productId, userId) => {
  return await productLogRepository.createLog(buildLog(productId, "CREATE", userId));
};

exports.logUpdate = async (productId, userId) => {
  return await productLogRepository.createLog(buildLog(productId, "UPDATE", userId));
};

exports.logDelete = async (productId, userId) => {
  return await productLogRepository.createLog(buildLog(productId, "DELETE", userId));
};

