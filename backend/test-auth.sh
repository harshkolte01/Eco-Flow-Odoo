#!/bin/bash

# ECOFlow Auth System Test Script
# Run this to verify the auth implementation

echo "🧪 ECOFlow Auth System Test"
echo "============================"
echo ""

BASE_URL="http://localhost:5001"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo -e "${YELLOW}Test 1: Health Check${NC}"
HEALTH=$(curl -s $BASE_URL/health)
if echo "$HEALTH" | grep -q '"status":"ok"'; then
  echo -e "${GREEN}✓ Server is running${NC}"
else
  echo -e "${RED}✗ Server health check failed${NC}"
  echo "Response: $HEALTH"
  exit 1
fi
echo ""

# Test 2: Signup
echo -e "${YELLOW}Test 2: User Signup${NC}"
SIGNUP_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test'$(date +%s)'@example.com",
    "password": "TestPass123"
  }')

if echo "$SIGNUP_RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✓ User signup successful${NC}"
  TOKEN=$(echo "$SIGNUP_RESPONSE" | grep -o '"token":"[^"]*"' | sed 's/"token":"//;s/"//')
  USER_EMAIL=$(echo "$SIGNUP_RESPONSE" | grep -o '"email":"[^"]*"' | sed 's/"email":"//;s/"//')
  echo "Token: ${TOKEN:0:50}..."
else
  echo -e "${RED}✗ Signup failed${NC}"
  echo "Response: $SIGNUP_RESPONSE"
  exit 1
fi
echo ""

# Test 3: Login
echo -e "${YELLOW}Test 3: User Login${NC}"
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$USER_EMAIL\",
    \"password\": \"TestPass123\"
  }")

if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✓ Login successful${NC}"
  TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | sed 's/"token":"//;s/"//')
else
  echo -e "${RED}✗ Login failed${NC}"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi
echo ""

# Test 4: Get Current User (Protected Route)
echo -e "${YELLOW}Test 4: Get Current User (Protected)${NC}"
ME_RESPONSE=$(curl -s -X GET $BASE_URL/api/auth/me \
  -H "Authorization: Bearer $TOKEN")

if echo "$ME_RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✓ Protected route works${NC}"
  echo "$ME_RESPONSE" | grep -o '"role":"[^"]*"'
else
  echo -e "${RED}✗ Protected route failed${NC}"
  echo "Response: $ME_RESPONSE"
  exit 1
fi
echo ""

# Test 5: Invalid Token
echo -e "${YELLOW}Test 5: Invalid Token (Should Fail)${NC}"
INVALID_RESPONSE=$(curl -s -X GET $BASE_URL/api/auth/me \
  -H "Authorization: Bearer invalid_token_12345")

if echo "$INVALID_RESPONSE" | grep -q '"success":false'; then
  echo -e "${GREEN}✓ Invalid token rejected correctly${NC}"
else
  echo -e "${RED}✗ Invalid token test failed${NC}"
  echo "Response: $INVALID_RESPONSE"
  exit 1
fi
echo ""

# Test 6: Missing Token
echo -e "${YELLOW}Test 6: Missing Token (Should Fail)${NC}"
NO_TOKEN_RESPONSE=$(curl -s -X GET $BASE_URL/api/auth/me)

if echo "$NO_TOKEN_RESPONSE" | grep -q '"success":false'; then
  echo -e "${GREEN}✓ Missing token rejected correctly${NC}"
else
  echo -e "${RED}✗ Missing token test failed${NC}"
  echo "Response: $NO_TOKEN_RESPONSE"
  exit 1
fi
echo ""

# Test 7: Admin Endpoint (Should Fail - Non-Admin User)
echo -e "${YELLOW}Test 7: Admin Endpoint with Non-Admin Token (Should Fail)${NC}"
USERS_RESPONSE=$(curl -s -X GET $BASE_URL/api/users \
  -H "Authorization: Bearer $TOKEN")

if echo "$USERS_RESPONSE" | grep -q '"message":"Insufficient permissions"'; then
  echo -e "${GREEN}✓ Admin endpoint protected correctly${NC}"
else
  echo -e "${RED}✗ Admin protection test failed${NC}"
  echo "Response: $USERS_RESPONSE"
  exit 1
fi
echo ""

# Test 8: Invalid Signup Data
echo -e "${YELLOW}Test 8: Invalid Signup Data (Should Fail)${NC}"
INVALID_SIGNUP=$(curl -s -X POST $BASE_URL/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "A",
    "email": "not-an-email",
    "password": "123"
  }')

if echo "$INVALID_SIGNUP" | grep -q '"success":false'; then
  echo -e "${GREEN}✓ Validation working correctly${NC}"
else
  echo -e "${RED}✗ Validation test failed${NC}"
  echo "Response: $INVALID_SIGNUP"
  exit 1
fi
echo ""

# Summary
echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✅ All Tests Passed!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Auth system is working correctly:"
echo "  ✓ Server health check"
echo "  ✓ User signup with validation"
echo "  ✓ User login"
echo "  ✓ Protected routes with JWT"
echo "  ✓ Token validation"
echo "  ✓ Role-based access control"
echo "  ✓ Input validation"
echo ""
echo "Your JWT token (save this for testing):"
echo "$TOKEN"
echo ""
echo "Test complete! 🎉"
