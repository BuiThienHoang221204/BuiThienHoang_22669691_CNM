# 🚀 Hướng dẫn triển khai lên AWS Elastic Beanstalk

## Yêu cầu trước khi bắt đầu

- Tài khoản AWS
- AWS CLI đã cài đặt và cấu hình (`aws configure`)
- EB CLI đã cài đặt (`pip install awsebcli`)
- Node.js >= 18

---

## Bước 1: Chuẩn bị AWS Resources

### 1.1 Tạo DynamoDB Tables
Vào **AWS Console → DynamoDB → Create table**:

| Table Name    | Partition Key       |
|---------------|---------------------|
| Products      | productId (String)  |
| Users         | userId (String)     |
| Categories    | categoryId (String) |
| ProductLogs   | logId (String)      |

### 1.2 Tạo S3 Bucket
Vào **AWS Console → S3 → Create bucket**:
- Tên bucket: `buithienhoang22669691` (hoặc tên khác, phải unique toàn cầu)
- Region: `us-east-1`
- Bỏ chặn public access (để hiển thị ảnh)
- Thêm Bucket Policy cho phép public read:
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::buithienhoang22669691/*"
  }]
}
```

### 1.3 Tạo IAM Role cho EC2
Vào **IAM → Roles → Create role**:
- Trusted entity: EC2
- Gắn các policies:
  - `AmazonDynamoDBFullAccess`
  - `AmazonS3FullAccess`
- Tên role: `eb-ec2-role`

---

## Bước 2: Khởi tạo Elastic Beanstalk

### 2.1 Mở terminal trong thư mục project
```bash
cd d:/DaiHoc/DHCN_Nam4/CNM/Elastic_Beanstalk
```

### 2.2 Khởi tạo EB application
```bash
eb init
```
Chọn:
- **Region**: `us-east-1`
- **Application name**: `ecommerce-app` (hoặc tên bạn muốn)
- **Platform**: `Node.js`
- **Platform version**: chọn bản mới nhất (Node.js 20 hoặc 18)
- **CodeCommit**: `No`
- **SSH**: `Yes` → chọn key pair `ecommerce-keyy` (đã có trong project)

### 2.3 Tạo môi trường (environment)
```bash
eb create ecommerce-env --instance-type t2.micro --single
```
- `--single`: dùng 1 instance (không cần load balancer, tiết kiệm chi phí)
- Quá trình tạo mất khoảng **5-10 phút**

---

## Bước 3: Cấu hình biến môi trường trên EB

Sau khi môi trường đã tạo xong, set environment variables:

```bash
eb setenv \
  AWS_REGION=us-east-1 \
  DYNAMODB_TABLE=Products \
  USERS_TABLE=Users \
  CATEGORIES_TABLE=Categories \
  PRODUCT_LOGS_TABLE=ProductLogs \
  S3_BUCKET_NAME=buithienhoang22669691 \
  SESSION_SECRET=your-very-secret-key-change-this \
  NODE_ENV=production
```

> ⚠️ **KHÔNG** set `AWS_ACCESS_KEY_ID` và `AWS_SECRET_ACCESS_KEY` khi chạy trên EC2.
> Thay vào đó, gắn IAM Role `eb-ec2-role` vào instance profile của EB (xem bước 3.1).

### 3.1 Gắn IAM Role vào EB Instance Profile
```bash
aws elasticbeanstalk update-environment \
  --environment-name ecommerce-env \
  --option-settings Namespace=aws:autoscaling:launchconfiguration,OptionName=IamInstanceProfile,Value=eb-ec2-role
```

Hoặc vào **EB Console → ecommerce-env → Configuration → Security → EC2 instance profile** → chọn `eb-ec2-role`.

---

## Bước 4: Deploy ứng dụng

### 4.1 Tạo file .zip để deploy (nếu dùng Console)
```bash
# Tạo zip, bỏ qua node_modules và .env
zip -r app.zip . \
  --exclude "node_modules/*" \
  --exclude ".env" \
  --exclude ".git/*" \
  --exclude "uploads/*" \
  --exclude "*.pem" \
  --exclude "eb-app/*"
```

### 4.2 Deploy bằng EB CLI (cách dễ nhất)
```bash
eb deploy
```

### 4.3 Mở ứng dụng
```bash
eb open
```

---

## Bước 5: Kiểm tra sau khi deploy

```bash
# Xem logs nếu có lỗi
eb logs

# Xem trạng thái môi trường
eb status

# SSH vào instance để debug
eb ssh
```

---

## Cấu trúc file quan trọng cho EB

```
Elastic_Beanstalk/
├── .ebextensions/
│   └── nodecommand.config   ← Cấu hình EB chạy "npm start"
├── Procfile                  ← Khai báo process: "web: node app.js"
├── package.json              ← scripts.start phải là "node app.js"
├── app.js                    ← Entry point
└── ...
```

---

## Lưu ý quan trọng

| Vấn đề | Giải pháp |
|--------|-----------|
| Port | EB tự set `PORT=8080`, app.js đã dùng `process.env.PORT` ✅ |
| Credentials | Dùng IAM Role, không dùng access key trong code |
| node_modules | **KHÔNG** đưa vào zip, EB tự chạy `npm install` |
| .env | **KHÔNG** đưa vào zip, dùng `eb setenv` để set biến |
| Uploads | Lưu ảnh lên S3, không lưu local (EC2 sẽ mất khi restart) |

---

## Xóa tài nguyên (tránh tốn phí)

```bash
# Xóa environment
eb terminate ecommerce-env

# Xóa application
eb terminate --all
```
