# 🚀 HƯỚNG DẪN SETUP HỆ THỐNG MỞ RỘNG TRÊN AWS

## 📋 MỤC LỤC
1. [Tạo DynamoDB Tables](#1-tạo-dynamodb-tables)
2. [Cấu hình S3 Bucket](#2-cấu-hình-s3-bucket)
3. [Cấu hình IAM Role cho EC2](#3-cấu-hình-iam-role-cho-ec2)
4. [Setup EC2 Instance](#4-setup-ec2-instance)
5. [Deploy Application](#5-deploy-application)
6. [Tạo Admin User đầu tiên](#6-tạo-admin-user-đầu-tiên)
7. [Kiểm tra hệ thống](#7-kiểm-tra-hệ-thống)

---

## 1️⃣ TẠO DYNAMODB TABLES

### 1.1. Tạo Table Users

```bash
aws dynamodb create-table \
  --table-name Users \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

**Hoặc từ AWS Console:**
- Vào **DynamoDB Console** → **Tables** → **Create table**
- Table name: `Users`
- Partition key: `userId` (String)
- Billing mode: **On-demand**
- Create table

### 1.2. Tạo Table Categories

```bash
aws dynamodb create-table \
  --table-name Categories \
  --attribute-definitions \
    AttributeName=categoryId,AttributeType=S \
  --key-schema \
    AttributeName=categoryId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

**Hoặc từ AWS Console:**
- Table name: `Categories`
- Partition key: `categoryId` (String)
- Billing mode: **On-demand**

### 1.3. Cập nhật Table Products (thêm attributes)

⚠️ **Lưu ý:** DynamoDB là schema-less, bạn chỉ cần thêm attributes khi insert/update items.

Nếu table Products chưa có, tạo mới:

```bash
aws dynamodb create-table \
  --table-name Products \
  --attribute-definitions \
    AttributeName=id,AttributeType=S \
  --key-schema \
    AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### 1.4. Tạo Table ProductLogs (cho audit)

```bash
aws dynamodb create-table \
  --table-name ProductLogs \
  --attribute-definitions \
    AttributeName=logId,AttributeType=S \
  --key-schema \
    AttributeName=logId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### 1.5. Tạo Global Secondary Index cho ProductLogs (optional)

Để query logs theo productId:

```bash
aws dynamodb update-table \
  --table-name ProductLogs \
  --attribute-definitions \
    AttributeName=productId,AttributeType=S \
  --global-secondary-index-updates \
    "[{\"Create\":{\"IndexName\":\"productId-index\",\"KeySchema\":[{\"AttributeName\":\"productId\",\"KeyType\":\"HASH\"}],\"Projection\":{\"ProjectionType\":\"ALL\"},\"ProvisionedThroughput\":{\"ReadCapacityUnits\":5,\"WriteCapacityUnits\":5}}}]"
```

---

## 2️⃣ CẤU HÌNH S3 BUCKET

### 2.1. Tạo S3 Bucket (nếu chưa có)

```bash
aws s3 mb s3://buitrienhoang-22669691-products \
  --region us-east-1
```

### 2.2. Cấu hình Public Access Block

```bash
aws s3api put-public-access-block \
  --bucket buitrienhoang-22669691-products \
  --public-access-block-configuration \
    "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
```

### 2.3. Cấu hình Bucket Policy

Tạo file `bucket-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::buitrienhoang-22669691-products/*"
    }
  ]
}
```

Apply policy:

```bash
aws s3api put-bucket-policy \
  --bucket buitrienhoang-22669691-products \
  --policy file://bucket-policy.json
```

---

## 3️⃣ CẤU HÌNH IAM ROLE CHO EC2

### 3.1. Tạo Trust Policy

Tạo file `ec2-trust-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

### 3.2. Tạo IAM Role

```bash
aws iam create-role \
  --role-name EC2-ProductApp-ExtendedRole \
  --assume-role-policy-document file://ec2-trust-policy.json
```

### 3.3. Tạo Inline Policy cho Role

Tạo file `ec2-permissions-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Scan",
        "dynamodb:Query"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-east-1:*:table/Products",
        "arn:aws:dynamodb:us-east-1:*:table/Users",
        "arn:aws:dynamodb:us-east-1:*:table/Categories",
        "arn:aws:dynamodb:us-east-1:*:table/ProductLogs"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::buitrienhoang-22669691-products",
        "arn:aws:s3:::buitrienhoang-22669691-products/*"
      ]
    }
  ]
}
```

Apply policy:

```bash
aws iam put-role-policy \
  --role-name EC2-ProductApp-ExtendedRole \
  --policy-name EC2-DynamoDB-S3-Access \
  --policy-document file://ec2-permissions-policy.json
```

### 3.4. Tạo Instance Profile

```bash
# Tạo instance profile
aws iam create-instance-profile \
  --instance-profile-name EC2-ProductApp-ExtendedProfile

# Attach role vào instance profile
aws iam add-role-to-instance-profile \
  --instance-profile-name EC2-ProductApp-ExtendedProfile \
  --role-name EC2-ProductApp-ExtendedRole
```

---

## 4️⃣ SETUP EC2 INSTANCE

### 4.1. Launch EC2 Instance

**Từ AWS Console:**

1. **EC2 Console** → **Launch Instance**
2. **Name:** `ProductApp-Extended-Server`
3. **AMI:** Amazon Linux 2023 hoặc Ubuntu 22.04
4. **Instance type:** t2.micro (Free tier)
5. **Key pair:** Tạo mới hoặc chọn existing
6. **Network settings:**
   - Auto-assign public IP: **Enable**
   - Security group: Tạo mới với rules:
     - SSH (22): Your IP
     - HTTP (80): Anywhere
     - Custom TCP (3000): Anywhere
7. **Advanced details:**
   - IAM instance profile: `EC2-ProductApp-ExtendedProfile`
8. **Launch instance**

### 4.2. Connect to EC2

```bash
# Chmod key file
chmod 400 your-key.pem

# SSH vào EC2
ssh -i "your-key.pem" ec2-user@<EC2-PUBLIC-IP>
# hoặc với Ubuntu:
ssh -i "your-key.pem" ubuntu@<EC2-PUBLIC-IP>
```

### 4.3. Cài đặt Dependencies trên EC2

```bash
# Update system
sudo yum update -y  # Amazon Linux
# hoặc
sudo apt update && sudo apt upgrade -y  # Ubuntu

# Cài đặt Node.js 18.x
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -  # Amazon Linux
sudo yum install -y nodejs

# Hoặc với Ubuntu:
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Cài đặt Git
sudo yum install git -y  # Amazon Linux
# hoặc
sudo apt install git -y  # Ubuntu

# Cài đặt PM2 (process manager)
sudo npm install -g pm2

# Verify installations
node --version
npm --version
git --version
pm2 --version
```

---

## 5️⃣ DEPLOY APPLICATION

### 5.1. Clone Repository

```bash
# Tạo thư mục app
mkdir -p ~/apps
cd ~/apps

# Clone repository
git clone https://github.com/BuiThienHoang221204/BuiThienHoang_22669691_CNM.git
cd BuiThienHoang_22669691_CNM/Tuan3

# Hoặc upload code bằng SCP
# Từ local machine:
scp -i "your-key.pem" -r Tuan3/ ec2-user@<EC2-PUBLIC-IP>:~/apps/
```

### 5.2. Cấu hình Environment Variables

```bash
# Tạo file .env
nano .env
```

Thêm nội dung:

```env
# AWS Configuration
AWS_REGION=us-east-1

# DynamoDB Tables
DYNAMODB_TABLE=Products
DYNAMODB_USERS_TABLE=Users
DYNAMODB_CATEGORIES_TABLE=Categories
DYNAMODB_PRODUCT_LOGS_TABLE=ProductLogs

# S3 Configuration
S3_BUCKET_NAME=buitrienhoang-22669691-products

# Application Configuration
PORT=3000
NODE_ENV=production

# Session Secret (tạo random string)
SESSION_SECRET=your-super-secret-key-change-this-in-production

# Optional: Database prefix (nếu muốn thêm prefix cho tables)
# TABLE_PREFIX=prod_
```

**Tạo SESSION_SECRET ngẫu nhiên:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy output và paste vào SESSION_SECRET.

### 5.3. Cài đặt Dependencies

```bash
npm install
```

### 5.4. Test chạy application

```bash
# Test run
npm start

# Mở browser và truy cập: http://<EC2-PUBLIC-IP>:3000
# Nhấn Ctrl+C để stop
```

### 5.5. Deploy với PM2

```bash
# Start app with PM2
pm2 start app.js --name "product-app-extended"

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Copy và chạy command mà PM2 suggest

# Xem logs
pm2 logs product-app-extended

# Xem status
pm2 status

# Restart app
pm2 restart product-app-extended

# Stop app
pm2 stop product-app-extended
```

### 5.6. Setup Nginx Reverse Proxy (Optional nhưng khuyến nghị)

```bash
# Cài đặt Nginx
sudo yum install nginx -y  # Amazon Linux
# hoặc
sudo apt install nginx -y  # Ubuntu

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

Cấu hình Nginx:

```bash
sudo nano /etc/nginx/conf.d/product-app.conf
```

Thêm nội dung:

```nginx
server {
    listen 80;
    server_name <EC2-PUBLIC-IP-OR-DOMAIN>;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Test và reload Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Bây giờ truy cập: `http://<EC2-PUBLIC-IP>` (không cần port 3000)

---

## 6️⃣ TẠO ADMIN USER ĐẦU TIÊN

### 6.1. Tạo script tạo admin

Trên EC2, tạo file `create-admin.js`:

```bash
nano create-admin.js
```

Nội dung:

```javascript
require("dotenv").config();
const bcrypt = require("bcrypt");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");

const client = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });
const docClient = DynamoDBDocumentClient.from(client);

async function createAdminUser() {
  try {
    const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE || "Users";
    
    // Kiểm tra xem đã có admin chưa
    const scanCommand = new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: "#role = :role",
      ExpressionAttributeNames: { "#role": "role" },
      ExpressionAttributeValues: { ":role": "admin" }
    });
    
    const existingAdmins = await docClient.send(scanCommand);
    
    if (existingAdmins.Items && existingAdmins.Items.length > 0) {
      console.log("⚠️  Admin user đã tồn tại!");
      console.log("Danh sách admin hiện có:");
      existingAdmins.Items.forEach(admin => {
        console.log(`  - Username: ${admin.username}`);
      });
      return;
    }
    
    // Tạo admin user
    const hashedPassword = await bcrypt.hash("admin123", 10);
    
    const adminUser = {
      userId: uuidv4(),
      username: "admin",
      password: hashedPassword,
      role: "admin",
      createdAt: new Date().toISOString()
    };
    
    const putCommand = new PutCommand({
      TableName: USERS_TABLE,
      Item: adminUser
    });
    
    await docClient.send(putCommand);
    
    console.log("✅ Tạo admin user thành công!");
    console.log("📝 Thông tin đăng nhập:");
    console.log("   Username: admin");
    console.log("   Password: admin123");
    console.log("⚠️  Hãy đổi mật khẩu sau khi đăng nhập!");
    
  } catch (error) {
    console.error("❌ Lỗi:", error);
    process.exit(1);
  }
}

createAdminUser();
```

### 6.2. Chạy script

```bash
node create-admin.js
```

Output:
```
✅ Tạo admin user thành công!
📝 Thông tin đăng nhập:
   Username: admin
   Password: admin123
⚠️  Hãy đổi mật khẩu sau khi đăng nhập!
```

### 6.3. Tạo thêm categories mẫu (optional)

```bash
nano create-sample-data.js
```

```javascript
require("dotenv").config();
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");

const client = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });
const docClient = DynamoDBDocumentClient.from(client);

async function createSampleCategories() {
  const CATEGORIES_TABLE = process.env.DYNAMODB_CATEGORIES_TABLE || "Categories";
  
  const categories = [
    { name: "Điện thoại", description: "Điện thoại thông minh các loại" },
    { name: "Laptop", description: "Máy tính xách tay" },
    { name: "Phụ kiện", description: "Phụ kiện điện tử" },
    { name: "Tablet", description: "Máy tính bảng" }
  ];
  
  for (const cat of categories) {
    const category = {
      categoryId: uuidv4(),
      name: cat.name,
      description: cat.description,
      createdAt: new Date().toISOString()
    };
    
    await docClient.send(new PutCommand({
      TableName: CATEGORIES_TABLE,
      Item: category
    }));
    
    console.log(`✅ Tạo category: ${cat.name}`);
  }
  
  console.log("🎉 Hoàn thành!");
}

createSampleCategories();
```

Chạy:
```bash
node create-sample-data.js
```

---

## 7️⃣ KIỂM TRA HỆ THỐNG

### 7.1. Test đăng nhập

1. Mở browser: `http://<EC2-PUBLIC-IP>`
2. Hệ thống sẽ redirect đến `/login`
3. Đăng nhập với:
   - Username: `admin`
   - Password: `admin123`

### 7.2. Test chức năng

**✅ Kiểm tra quyền Admin:**
- [x] Xem danh sách sản phẩm
- [x] Thêm sản phẩm mới (với category)
- [x] Sửa sản phẩm
- [x] Xóa sản phẩm (soft delete)
- [x] Quản lý categories
- [x] Xem inventory status
- [x] Xem logs

**✅ Tạo user staff để test phân quyền:**
1. Admin → `/admin/register`
2. Tạo user với role `staff`
3. Logout
4. Login với staff user
5. Kiểm tra: staff chỉ xem được, không CRUD

### 7.3. Kiểm tra DynamoDB

```bash
# Kiểm tra table Users
aws dynamodb scan --table-name Users --region us-east-1

# Kiểm tra table Categories
aws dynamodb scan --table-name Categories --region us-east-1

# Kiểm tra table Products
aws dynamodb scan --table-name Products --region us-east-1

# Kiểm tra table ProductLogs
aws dynamodb scan --table-name ProductLogs --region us-east-1
```

### 7.4. Kiểm tra S3

```bash
# List objects trong bucket
aws s3 ls s3://buitrienhoang-22669691-products/

# Test upload
echo "test" > test.txt
aws s3 cp test.txt s3://buitrienhoang-22669691-products/
```

### 7.5. Monitor logs

```bash
# PM2 logs
pm2 logs product-app-extended

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Application logs
tail -f ~/.pm2/logs/product-app-extended-out.log
tail -f ~/.pm2/logs/product-app-extended-error.log
```

---

## 8️⃣ TROUBLESHOOTING

### Lỗi: Cannot connect to DynamoDB

**Nguyên nhân:** IAM Role chưa attach đúng hoặc thiếu quyền

**Giải pháp:**
```bash
# Kiểm tra IAM role của instance
aws ec2 describe-instances --instance-ids <INSTANCE-ID> \
  --query 'Reservations[0].Instances[0].IamInstanceProfile'

# Attach lại role nếu cần
aws ec2 associate-iam-instance-profile \
  --instance-id <INSTANCE-ID> \
  --iam-instance-profile Name=EC2-ProductApp-ExtendedProfile
```

### Lỗi: Images not loading from S3

**Nguyên nhân:** Bucket policy chưa đúng hoặc CORS

**Giải pháp:**
```bash
# Kiểm tra bucket policy
aws s3api get-bucket-policy --bucket buitrienhoang-22669691-products

# Cấu hình CORS
cat > cors.json << EOF
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF

aws s3api put-bucket-cors --bucket buitrienhoang-22669691-products --cors-configuration file://cors.json
```

### Lỗi: Session not working

**Nguyên nhân:** SESSION_SECRET chưa set hoặc cookie config sai

**Giải pháp:**
1. Kiểm tra `.env` có SESSION_SECRET
2. Nếu dùng HTTPS, set `cookie.secure = true` trong `app.js`
3. Restart app: `pm2 restart product-app-extended`

### Port 3000 không truy cập được

**Nguyên nhân:** Security Group chưa mở port

**Giải pháp:**
```bash
# Thêm inbound rule cho port 3000
aws ec2 authorize-security-group-ingress \
  --group-id <SECURITY-GROUP-ID> \
  --protocol tcp \
  --port 3000 \
  --cidr 0.0.0.0/0
```

---

## 9️⃣ BẢO MẬT

### 9.1. Đổi mật khẩu admin

Sau khi đăng nhập lần đầu, tạo admin user mới và xóa user mặc định.

### 9.2. Giới hạn SSH access

```bash
# Chỉ cho phép SSH từ IP của bạn
aws ec2 authorize-security-group-ingress \
  --group-id <SECURITY-GROUP-ID> \
  --protocol tcp \
  --port 22 \
  --cidr <YOUR-IP>/32
```

### 9.3. Enable HTTPS với Let's Encrypt (Production)

```bash
# Cài đặt Certbot
sudo yum install certbot python3-certbot-nginx -y  # Amazon Linux
# hoặc
sudo apt install certbot python3-certbot-nginx -y  # Ubuntu

# Lấy SSL certificate (cần domain name)
sudo certbot --nginx -d yourdomain.com
```

### 9.4. Environment Variables Security

```bash
# Đảm bảo .env không được commit
echo ".env" >> .gitignore

# Set proper permissions
chmod 600 .env
```

---

## 🔟 BACKUP & MONITORING

### 10.1. Backup DynamoDB

```bash
# Enable Point-in-Time Recovery
aws dynamodb update-continuous-backups \
  --table-name Products \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true

aws dynamodb update-continuous-backups \
  --table-name Users \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true

aws dynamodb update-continuous-backups \
  --table-name Categories \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true

aws dynamodb update-continuous-backups \
  --table-name ProductLogs \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true
```

### 10.2. S3 Versioning

```bash
# Enable versioning
aws s3api put-bucket-versioning \
  --bucket buitrienhoang-22669691-products \
  --versioning-configuration Status=Enabled
```

### 10.3. CloudWatch Monitoring

Metrics được tự động collect cho DynamoDB, S3, EC2.

Xem metrics tại: **CloudWatch Console** → **Metrics** → **All metrics**

---

## 📚 TÀI LIỆU THAM KHẢO

- [AWS DynamoDB Documentation](https://docs.aws.amazon.com/dynamodb/)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS IAM Documentation](https://docs.aws.amazon.com/iam/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)

---

## ✅ CHECKLIST HOÀN THÀNH

- [ ] Tạo 4 DynamoDB tables (Users, Categories, Products, ProductLogs)
- [ ] Cấu hình S3 bucket với public access
- [ ] Tạo IAM Role và Instance Profile
- [ ] Launch EC2 instance với IAM role
- [ ] Cài đặt Node.js, Git, PM2 trên EC2
- [ ] Clone/upload code lên EC2
- [ ] Cấu hình .env file
- [ ] Deploy app với PM2
- [ ] Setup Nginx reverse proxy
- [ ] Tạo admin user đầu tiên
- [ ] Tạo categories mẫu
- [ ] Test đăng nhập và các chức năng
- [ ] Kiểm tra phân quyền admin/staff
- [ ] Test upload ảnh lên S3
- [ ] Kiểm tra soft delete
- [ ] Kiểm tra inventory status
- [ ] Kiểm tra logs
- [ ] Cấu hình Security Group
- [ ] Enable backup và monitoring

---

## 🎯 KẾT LUẬN

Sau khi hoàn thành các bước trên, bạn đã có:

✅ Hệ thống quản lý sản phẩm đầy đủ trên AWS  
✅ Authentication & Authorization  
✅ Category management  
✅ Advanced search & filter  
✅ Inventory tracking  
✅ Audit logs  
✅ Soft delete  
✅ Scalable architecture với DynamoDB  
✅ Cloud storage với S3  
✅ Production-ready deployment  

**🚀 Hệ thống đã sẵn sàng cho production!**
