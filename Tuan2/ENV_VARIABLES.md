# Danh sách các biến môi trường cần thiết

## 📋 Các biến BẮT BUỘC

### 1. AWS_REGION
- **Mô tả**: Region của AWS (ví dụ: ap-southeast-1, us-east-1)
- **Ví dụ**: `AWS_REGION=ap-southeast-1`
- **Mặc định**: `ap-southeast-1` (nếu không có)
- **Sử dụng**: Cấu hình cho DynamoDB và S3 client

### 2. DYNAMODB_TABLE
- **Mô tả**: Tên bảng DynamoDB chứa dữ liệu sản phẩm
- **Ví dụ**: `DYNAMODB_TABLE=Products`
- **Mặc định**: `Products` (nếu không có)
- **Sử dụng**: Tất cả các thao tác CRUD với DynamoDB

### 3. S3_BUCKET_NAME
- **Mô tả**: Tên S3 bucket để lưu trữ hình ảnh sản phẩm
- **Ví dụ**: `S3_BUCKET_NAME=my-product-images-bucket`
- **Lưu ý**: Tên bucket phải unique globally trên AWS
- **Sử dụng**: Upload và xóa hình ảnh sản phẩm

## 🔐 Các biến cho AWS Credentials (Chọn 1 trong 2 cách)

### Cách 1: Sử dụng Access Keys (Cho local development)

#### AWS_ACCESS_KEY_ID
- **Mô tả**: AWS Access Key ID của IAM user
- **Ví dụ**: `AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE`
- **Lưu ý**: Chỉ dùng cho development local, không dùng trên production

#### AWS_SECRET_ACCESS_KEY
- **Mô tả**: AWS Secret Access Key của IAM user
- **Ví dụ**: `AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`
- **Lưu ý**: Giữ bí mật, không commit vào git

### Cách 2: Sử dụng IAM Role (Khuyến nghị cho EC2)
- **Không cần** `AWS_ACCESS_KEY_ID` và `AWS_SECRET_ACCESS_KEY`
- AWS SDK sẽ tự động lấy credentials từ IAM Role gắn vào EC2 instance
- An toàn hơn và không cần quản lý keys

## ⚙️ Các biến TÙY CHỌN

### PORT
- **Mô tả**: Port mà server sẽ chạy
- **Ví dụ**: `PORT=3000`
- **Mặc định**: `3000` (nếu không có)
- **Sử dụng**: Cấu hình port cho Express server

## 📝 Ví dụ file .env đầy đủ

### Cho Local Development (với Access Keys):
```env
# AWS Configuration
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

# DynamoDB Configuration
DYNAMODB_TABLE=Products

# S3 Configuration
S3_BUCKET_NAME=my-product-images-bucket

# Server Configuration
PORT=3000
```

### Cho EC2 (với IAM Role):
```env
# AWS Configuration
AWS_REGION=ap-southeast-1
# Không cần AWS_ACCESS_KEY_ID và AWS_SECRET_ACCESS_KEY
# AWS SDK sẽ tự động sử dụng IAM Role

# DynamoDB Configuration
DYNAMODB_TABLE=Products

# S3 Configuration
S3_BUCKET_NAME=my-product-images-bucket

# Server Configuration
PORT=3000
```

## 🔍 Kiểm tra biến môi trường

Sau khi tạo file `.env`, bạn có thể kiểm tra bằng cách:

1. **Chạy ứng dụng**: `npm start`
2. **Xem console logs**: Server sẽ hiển thị:
   - DynamoDB Table name
   - S3 Bucket name
3. **Test chức năng**: Thử thêm sản phẩm mới để kiểm tra kết nối

## ⚠️ Lưu ý bảo mật

1. **KHÔNG commit file `.env`** vào git
2. File `.env` đã được thêm vào `.gitignore`
3. Trên EC2, nên sử dụng IAM Role thay vì Access Keys
4. Nếu phải dùng Access Keys, giữ bí mật và rotate định kỳ

## 📚 Tham khảo

- Xem `AWS_SETUP.md` để biết cách tạo các tài nguyên AWS
- Xem `README.md` để biết cách cài đặt và chạy ứng dụng
