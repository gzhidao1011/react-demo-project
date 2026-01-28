#!/bin/bash
# 第二阶段 2.3.4 接口测试 - curl 用例
# 使用方式：先启动 user-service（端口 8001），再执行本脚本
# 项目使用 /api/auth（非 /api/v1/auth），端口 8001

BASE_URL="${BASE_URL:-http://localhost:8001/api/auth}"

echo "=== 1. 注册接口（成功） ==="
curl -s -w "\nHTTP_STATUS:%{http_code}\n" -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123!"}'

echo ""
echo "=== 2. 弱密码（预期失败 code=40003） ==="
curl -s -w "\nHTTP_STATUS:%{http_code}\n" -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test2@example.com","password":"weak"}'

echo ""
echo "=== 3. 登录接口（成功） ==="
curl -s -w "\nHTTP_STATUS:%{http_code}\n" -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123!","rememberMe":false}'

echo ""
echo "=== 4. 记住我登录（成功） ==="
curl -s -w "\nHTTP_STATUS:%{http_code}\n" -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123!","rememberMe":true}'

echo ""
echo "=== 5. 错误密码（预期失败 code=40100） ==="
curl -s -w "\nHTTP_STATUS:%{http_code}\n" -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrongpassword"}'

echo ""
echo "=== 6. 响应头校验（Cache-Control: no-store） ==="
curl -s -I -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"header-check@example.com","password":"Password123!"}' | grep -i cache-control

echo "完成。"
