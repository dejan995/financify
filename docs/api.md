# API Documentation

This document provides comprehensive information about the Personal Finance Tracker API endpoints.

## Base URL

All API endpoints are relative to the base URL:
```
http://localhost:5000/api  (development)
https://your-domain.com/api  (production)
```

## Authentication

The API uses session-based authentication with secure HTTP-only cookies.

### Authentication Flow
1. **Login**: `POST /api/auth/login`
2. **Session**: Maintained via secure cookies
3. **Logout**: `POST /api/auth/logout`

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "data": {}, // Response data
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "error": "Error message",
  "message": "Detailed error description",
  "statusCode": 400
}
```

## Authentication Endpoints

### POST /api/auth/login
Authenticate user and create session.

**Request Body:**
```json
{
  "username": "admin",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "data": {
    "id": "user_id",
    "username": "admin",
    "role": "admin"
  },
  "message": "Login successful"
}
```

### POST /api/auth/logout
End user session.

**Response:**
```json
{
  "message": "Logout successful"
}
```

### GET /api/user
Get current authenticated user information.

**Response:**
```json
{
  "data": {
    "id": "user_id",
    "username": "admin",
    "role": "admin"
  }
}
```

## Account Management

### GET /api/accounts
List all accounts for the authenticated user.

**Query Parameters:**
- `type` (optional): Filter by account type (checking, savings, credit, investment)

**Response:**
```json
{
  "data": [
    {
      "id": "account_id",
      "name": "Main Checking",
      "type": "checking",
      "balance": 1500.00,
      "userId": "user_id",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/accounts
Create a new account.

**Request Body:**
```json
{
  "name": "Savings Account",
  "type": "savings",
  "balance": 5000.00
}
```

### PUT /api/accounts/:id
Update an existing account.

**Request Body:**
```json
{
  "name": "Updated Account Name",
  "balance": 1750.00
}
```

### DELETE /api/accounts/:id
Delete an account.

**Response:**
```json
{
  "message": "Account deleted successfully"
}
```

## Transaction Management

### GET /api/transactions
List transactions with optional filtering.

**Query Parameters:**
- `accountId`: Filter by account
- `categoryId`: Filter by category
- `startDate`: Filter by date range start (ISO 8601)
- `endDate`: Filter by date range end (ISO 8601)
- `type`: Filter by type (income, expense)
- `limit`: Number of results (default: 50)
- `offset`: Pagination offset (default: 0)

**Response:**
```json
{
  "data": [
    {
      "id": "transaction_id",
      "amount": -25.50,
      "description": "Coffee Shop",
      "date": "2025-01-15",
      "type": "expense",
      "accountId": "account_id",
      "categoryId": "category_id",
      "userId": "user_id"
    }
  ]
}
```

### POST /api/transactions
Create a new transaction.

**Request Body:**
```json
{
  "amount": -45.20,
  "description": "Grocery Store",
  "date": "2025-01-15",
  "type": "expense",
  "accountId": "account_id",
  "categoryId": "category_id"
}
```

### PUT /api/transactions/:id
Update a transaction.

### DELETE /api/transactions/:id
Delete a transaction.

## Category Management

### GET /api/categories
List all expense/income categories.

**Response:**
```json
{
  "data": [
    {
      "id": "category_id",
      "name": "Food & Dining",
      "color": "#FF6B6B",
      "type": "expense",
      "userId": "user_id"
    }
  ]
}
```

### POST /api/categories
Create a new category.

**Request Body:**
```json
{
  "name": "Entertainment",
  "color": "#4ECDC4",
  "type": "expense"
}
```

### PUT /api/categories/:id
Update a category.

### DELETE /api/categories/:id
Delete a category.

## Budget Management

### GET /api/budgets
List user budgets.

**Response:**
```json
{
  "data": [
    {
      "id": "budget_id",
      "name": "Monthly Food Budget",
      "amount": 500.00,
      "period": "monthly",
      "categoryId": "category_id",
      "userId": "user_id",
      "spent": 125.50,
      "remaining": 374.50
    }
  ]
}
```

### POST /api/budgets
Create a new budget.

**Request Body:**
```json
{
  "name": "Monthly Transportation",
  "amount": 300.00,
  "period": "monthly",
  "categoryId": "category_id"
}
```

### PUT /api/budgets/:id
Update a budget.

### DELETE /api/budgets/:id
Delete a budget.

## Goal Management

### GET /api/goals
List financial goals.

**Response:**
```json
{
  "data": [
    {
      "id": "goal_id",
      "name": "Emergency Fund",
      "targetAmount": 10000.00,
      "currentAmount": 2500.00,
      "targetDate": "2025-12-31",
      "userId": "user_id",
      "progress": 25.0
    }
  ]
}
```

### POST /api/goals
Create a new goal.

**Request Body:**
```json
{
  "name": "Vacation Fund",
  "targetAmount": 3000.00,
  "currentAmount": 0.00,
  "targetDate": "2025-08-01"
}
```

### PUT /api/goals/:id
Update a goal.

### DELETE /api/goals/:id
Delete a goal.

## Bill Management

### GET /api/bills
List recurring bills.

**Response:**
```json
{
  "data": [
    {
      "id": "bill_id",
      "name": "Electric Bill",
      "amount": 120.00,
      "dueDate": "2025-02-01",
      "frequency": "monthly",
      "categoryId": "category_id",
      "accountId": "account_id",
      "userId": "user_id",
      "isPaid": false
    }
  ]
}
```

### POST /api/bills
Create a new bill.

**Request Body:**
```json
{
  "name": "Internet Bill",
  "amount": 80.00,
  "dueDate": "2025-02-05",
  "frequency": "monthly",
  "categoryId": "category_id",
  "accountId": "account_id"
}
```

### PUT /api/bills/:id
Update a bill.

### DELETE /api/bills/:id
Delete a bill.

## Product Management

### GET /api/products
List products in the database (for receipt scanning).

**Response:**
```json
{
  "data": [
    {
      "id": "product_id",
      "name": "Organic Milk",
      "brand": "Local Farm",
      "categoryId": "category_id",
      "price": 4.99,
      "userId": "user_id"
    }
  ]
}
```

### POST /api/products
Add a new product.

**Request Body:**
```json
{
  "name": "Greek Yogurt",
  "brand": "Premium Brand",
  "categoryId": "category_id",
  "price": 3.49
}
```

### PUT /api/products/:id
Update a product.

### DELETE /api/products/:id
Delete a product.

## Analytics Endpoints

### GET /api/analytics/balance
Get current account balance summary.

**Response:**
```json
{
  "data": {
    "totalBalance": 5250.00,
    "checkingBalance": 1500.00,
    "savingsBalance": 3500.00,
    "creditBalance": -250.00,
    "investmentBalance": 500.00
  }
}
```

### GET /api/analytics/monthly
Get monthly income and expense data.

**Query Parameters:**
- `months`: Number of months to include (default: 12)

**Response:**
```json
{
  "data": [
    {
      "month": "2025-01",
      "income": 4500.00,
      "expenses": 3200.00,
      "net": 1300.00
    }
  ]
}
```

### GET /api/analytics/category-spending
Get spending breakdown by category.

**Query Parameters:**
- `startDate`: Start date for analysis (ISO 8601)
- `endDate`: End date for analysis (ISO 8601)

**Response:**
```json
{
  "data": [
    {
      "categoryId": "category_id",
      "categoryName": "Food & Dining",
      "amount": 650.00,
      "percentage": 35.5
    }
  ]
}
```

## Administration Endpoints

### GET /api/admin/users
List all users (admin only).

**Response:**
```json
{
  "data": [
    {
      "id": "user_id",
      "username": "admin",
      "role": "admin",
      "createdAt": "2025-01-01T00:00:00Z",
      "lastLogin": "2025-01-15T10:30:00Z"
    }
  ]
}
```

### POST /api/admin/users
Create a new user (admin only).

**Request Body:**
```json
{
  "username": "newuser",
  "password": "secure_password",
  "role": "user"
}
```

### PUT /api/admin/users/:id
Update a user (admin only).

**Request Body:**
```json
{
  "username": "updated_username",
  "role": "admin"
}
```

### DELETE /api/admin/users/:id
Delete a user (admin only).

### GET /api/admin/system/stats
Get system statistics (admin only).

**Response:**
```json
{
  "data": {
    "totalUsers": 5,
    "totalTransactions": 1250,
    "totalAccounts": 15,
    "databaseSize": "45.2 MB",
    "uptime": "7 days, 3 hours",
    "version": "1.0.0"
  }
}
```

## System Endpoints

### GET /api/health
Health check endpoint for monitoring.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00Z",
  "uptime": 259200,
  "version": "1.0.0"
}
```

### GET /api/initialization/status
Check if the application has been initialized.

**Response:**
```json
{
  "data": {
    "isInitialized": true,
    "adminUser": {
      "id": "admin_id",
      "username": "admin"
    },
    "databaseType": "supabase"
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 200  | Success |
| 201  | Created |
| 400  | Bad Request |
| 401  | Unauthorized |
| 403  | Forbidden |
| 404  | Not Found |
| 409  | Conflict |
| 422  | Unprocessable Entity |
| 500  | Internal Server Error |

## Rate Limiting

- **Authentication endpoints**: 5 requests per minute
- **General API endpoints**: 100 requests per minute
- **Analytics endpoints**: 20 requests per minute

## Data Types

### Account Types
- `checking`: Checking account
- `savings`: Savings account  
- `credit`: Credit card account
- `investment`: Investment account

### Transaction Types
- `income`: Money coming in
- `expense`: Money going out

### Budget Periods
- `weekly`: Weekly budget period
- `monthly`: Monthly budget period
- `yearly`: Annual budget period

### Bill Frequencies
- `weekly`: Weekly bills
- `monthly`: Monthly bills
- `quarterly`: Quarterly bills
- `yearly`: Annual bills

## SDK Examples

### JavaScript/Node.js
```javascript
const apiRequest = async (endpoint, options = {}) => {
  const response = await fetch(`/api${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Include session cookies
    ...options,
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  
  return response.json();
};

// Example: Get transactions
const transactions = await apiRequest('/transactions');

// Example: Create transaction
const newTransaction = await apiRequest('/transactions', {
  method: 'POST',
  body: JSON.stringify({
    amount: -25.50,
    description: 'Coffee',
    date: '2025-01-15',
    type: 'expense',
    accountId: 'account_id',
    categoryId: 'category_id'
  }),
});
```

### cURL Examples
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}' \
  -c cookies.txt

# Get transactions (with session)
curl http://localhost:5000/api/transactions \
  -b cookies.txt

# Create transaction
curl -X POST http://localhost:5000/api/transactions \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "amount": -45.20,
    "description": "Grocery Store",
    "date": "2025-01-15",
    "type": "expense",
    "accountId": "account_id",
    "categoryId": "category_id"
  }'
```

## Webhooks

The API supports webhooks for real-time notifications:

### Supported Events
- `transaction.created`
- `transaction.updated`
- `budget.exceeded`
- `bill.due_soon`
- `goal.achieved`

### Webhook Configuration
Webhooks can be configured through the admin interface or API endpoints (coming soon).

## Changelog

### API v1.0 (Current)
- Initial API release
- Full CRUD operations for all entities
- Session-based authentication
- Analytics and reporting endpoints
- Admin functionality
- Health monitoring

---

For more information or support, please refer to the main [README.md](../README.md) or open an issue on GitHub.