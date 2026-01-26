# Hướng dẫn thiết lập AWS

## 1. Tạo DynamoDB Table

### Bước 1: Truy cập DynamoDB Console
1. Đăng nhập vào AWS Console
2. Tìm và chọn **DynamoDB**

### Bước 2: Tạo Table
1. Click **Create table**
2. Điền thông tin:
   - **Table name**: `Products`
   - **Partition key**: `id` (String)
   - **Table settings**: Default settings
3. Click **Create table**

### Bước 3: Kiểm tra Table
- Đợi table chuyển sang trạng thái **Active**
- Ghi nhớ **Region** của table (ví dụ: `ap-southeast-1`)

## 2. Tạo S3 Bucket

### Bước 1: Truy cập S3 Console
1. Trong AWS Console, tìm và chọn **S3**

### Bước 2: Tạo Bucket
1. Click **Create bucket**
2. Điền thông tin:
   - **Bucket name**: Tên bucket của bạn (phải unique globally)
   - **Region**: Chọn cùng region với DynamoDB
   - **Block Public Access settings**: 
     - Bỏ chọn "Block all public access" nếu muốn hình ảnh public
     - Hoặc giữ nguyên và cấu hình bucket policy sau
3. Click **Create bucket**

### Bước 3: Cấu hình Bucket Policy (để hình ảnh public)
1. Vào bucket vừa tạo
2. Chọn tab **Permissions**
3. Scroll xuống **Bucket policy**
4. Thêm policy sau (thay `your-bucket-name`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

5. Click **Save changes**

### Bước 4: Cấu hình CORS (nếu cần)
1. Vào tab **Permissions**
2. Scroll xuống **Cross-origin resource sharing (CORS)**
3. Thêm cấu hình:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```

## 3. Tạo IAM User/Role

### Option 1: Sử dụng IAM User (cho local development)

1. Truy cập **IAM Console**
2. Chọn **Users** → **Add users**
3. Đặt tên user (ví dụ: `product-manager-app`)
4. Chọn **Access key - Programmatic access**
5. Attach policies:
   - `AmazonDynamoDBFullAccess` (hoặc tạo custom policy)
   - `AmazonS3FullAccess` (hoặc tạo custom policy)
6. Tạo user và lưu **Access Key ID** và **Secret Access Key**

### Option 2: Sử dụng IAM Role (cho EC2 - Khuyến nghị)

1. Truy cập **IAM Console**
2. Chọn **Roles** → **Create role**
3. Chọn **EC2** làm trusted entity
4. Attach policies:
   - `AmazonDynamoDBFullAccess`
   - `AmazonS3FullAccess`
5. Đặt tên role (ví dụ: `EC2-ProductManager-Role`)
6. Tạo role
7. Gắn role vào EC2 instance:
   - Vào **EC2 Console**
   - Chọn instance → **Actions** → **Security** → **Modify IAM role**
   - Chọn role vừa tạo

### Custom Policy (Tùy chọn - Bảo mật hơn)

Nếu muốn giới hạn quyền, tạo custom policy:

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
        "dynamodb:Scan"
      ],
      "Resource": "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/Products"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::BUCKET_NAME/*"
    }
  ]
}
```

## 4. Cấu hình Environment Variables

### Trên Local (sử dụng .env file)

Tạo file `.env`:

```env
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
DYNAMODB_TABLE=Products
S3_BUCKET_NAME=your-bucket-name
PORT=3000
```

### Trên EC2 (sử dụng IAM Role)

Nếu sử dụng IAM Role, chỉ cần:

```env
AWS_REGION=ap-southeast-1
DYNAMODB_TABLE=Products
S3_BUCKET_NAME=your-bucket-name
PORT=3000
```

Không cần `AWS_ACCESS_KEY_ID` và `AWS_SECRET_ACCESS_KEY`.

## 5. Kiểm tra kết nối

Sau khi cấu hình, chạy ứng dụng và kiểm tra:

1. Thêm sản phẩm mới
2. Kiểm tra DynamoDB table có item mới
3. Kiểm tra S3 bucket có file hình ảnh
4. Kiểm tra hình ảnh hiển thị được trên trang web

## Lưu ý

- **Region**: Đảm bảo tất cả services (DynamoDB, S3, EC2) cùng region để tối ưu performance và chi phí
- **Costs**: DynamoDB và S3 có free tier, nhưng cần theo dõi usage
- **Security**: 
  - Không commit file `.env`
  - Sử dụng IAM Role trên EC2 thay vì Access Keys
  - Giới hạn permissions theo nguyên tắc least privilege
