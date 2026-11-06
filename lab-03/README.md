# Lab 3: REST API, query parameters, validation, debugging

## Student Details

<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
  <thead>
    <tr style="background-color: #f2f2f2;">
      <th align="left" width="30%">Field</th>
      <th align="left" width="70%">Details</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><b>Student Name</b></td>
      <td>T Abhiram</td>
    </tr>
    <tr>
      <td><b>Registration Number</b></td>
      <td>252U1R1244</td>
    </tr>
    <tr>
      <td><b>Section</b></td>
      <td>CSE-2E</td>
    </tr>
    <tr>
      <td><b>Lab Title</b></td>
      <td>Lab 3: REST API, query parameters, validation, debugging</td>
    </tr>
    <tr>
      <td><b>Module</b></td>
      <td>REST API Design, Filtering, Sorting, and Input Validation</td>
    </tr>
  </tbody>
</table>

---

## Live Link

| Deployment Platform | Status | URL |
|:---|:---|:---|
| **Vercel** | Pending Deployment | Live URL: Add after Vercel deployment |

---

## Objective
The objective of this lab is to enhance the SQLite book API developed in Lab 2 by implementing robust RESTful API design principles. This includes adding support for query parameters for partial text searching (`LIKE`), column sorting (whitelist-protected `ORDER BY`), price range filtering (`min_price` and `max_price`), and pagination (`limit` and `offset`). It also focuses on request body and query parameter validation, standardizing JSON error messages, utilizing appropriate HTTP status codes (200, 201, 400, 404), preparing the application for **Vercel zero-config serverless deployment**, and practicing backend debugging techniques.

---

## Technologies Used

| Technology | Purpose |
|:---|:---|
| **Node.js** | Server-side JavaScript runtime environment (Node 24.x) |
| **Express.js** | Web application framework for HTTP routing and middleware |
| **SQLite** | Lightweight, zero-configuration relational database engine |
| **sqlite3** | Core Node.js SQLite driver |
| **sqlite** | Promise-based wrapper enabling `async`/`await` database calls |
| **Nodemon** | Development tool that automatically restarts the server on code changes |
| **Vercel** | Cloud platform for serverless and zero-config web deployment |
| **Postman** | API testing client used to send HTTP requests with query parameters and body payloads |

---

## Project Structure

```text
lab-03/
│
├── app.js               # REST API server (Vercel-compatible export + local listen)
├── package.json         # Project metadata, scripts, engines (Node 24.x) & dependencies
├── package-lock.json    # Exact dependency tree lockfile
├── .gitignore           # Ignores node_modules/ and .env (tracks database/books.db)
├── README.md            # Comprehensive documentation, Vercel guide & viva Q&A
├── database/
│   └── books.db         # Persistent SQLite database file storing the book table
└── screenshots/
    └── .gitkeep         # Preserves screenshots directory in Git
```

---

## How to Run Locally

1. Open your terminal and navigate to `lab-03`:
   ```bash
   cd lab-03
   ```

2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```

3. Start the application:
   - **Development mode (with auto-reload using Nodemon):**
     ```bash
     npm run dev
     ```
   - **Standard mode:**
     ```bash
     npm start
     ```

4. The server runs locally on:
   ```text
   http://localhost:3000
   ```

---

## API Endpoints

| Method | Endpoint | Description | Status Code |
|:---:|:---|:---|:---:|
| **GET** | `/` | API status and route directory | `200 OK` |
| **GET** | `/books` | Retrieve books with optional search, filter, sort, and pagination | `200 OK` / `400 Bad Request` |
| **GET** | `/books/:bookId` | Retrieve a single book by ID | `200 OK` / `404 Not Found` |
| **POST** | `/books` | Create a new book with input validation | `201 Created` / `400 Bad Request` |
| **PUT** | `/books/:bookId` | Update an existing book by ID | `200 OK` / `400 Bad Request` / `404 Not Found` |
| **DELETE** | `/books/:bookId` | Delete a book by ID | `200 OK` / `404 Not Found` |

---

## Query Parameters (`GET /books`)

Every query parameter has a sensible default. The API supports:

| Parameter | Type | Default | Description | Example URL |
|:---|:---:|:---:|:---|:---|
| `search_q` | String | `""` | Case-insensitive partial title search (`title LIKE ?`) | `/books?search_q=harry` |
| `order_by` | String | `"id"` | Column to sort by (`id`, `title`, `author`, `price`, `pages`) | `/books?order_by=price` |
| `order` | String | `"ASC"` | Sort direction (`ASC` or `DESC`) | `/books?order=DESC` |
| `limit` | Integer | `10` | Maximum number of books to return (must be positive) | `/books?limit=5` |
| `offset` | Integer | `0` | Number of records to skip for pagination | `/books?offset=5` |
| `min_price` | Number | None | Filters books with `price >= min_price` | `/books?min_price=300` |
| `max_price` | Number | None | Filters books with `price <= max_price` | `/books?max_price=500` |

### Combined Query Example:
```text
GET /books?search_q=the&order_by=price&order=ASC&limit=5&offset=0
```

---

## POST, PUT, and DELETE Examples

### 1. POST `/books` (Add Book)
- **Method:** `POST`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "title": "Clean Architecture",
    "author": "Robert C. Martin",
    "price": 550,
    "pages": 432
  }
  ```
- **Response (HTTP 201 Created):**
  ```json
  {
    "message": "Book added successfully",
    "bookId": 11
  }
  ```

### 2. PUT `/books/:bookId` (Update Book)
- **Method:** `PUT`
- **URL:** `/books/1`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "title": "The Alchemist (25th Anniversary Edition)",
    "author": "Paulo Coelho",
    "price": 450,
    "pages": 208
  }
  ```
- **Response (HTTP 200 OK):**
  ```json
  {
    "message": "Book updated successfully"
  }
  ```

### 3. DELETE `/books/:bookId` (Delete Book)
- **Method:** `DELETE`
- **URL:** `/books/1`
- **Response (HTTP 200 OK):**
  ```json
  {
    "message": "Book deleted successfully"
  }
  ```

---

## Validation Rules

1. **`order_by` Whitelist:**
   - Allowed columns: `id`, `title`, `author`, `price`, `pages`.
   - Invalid value returns HTTP 400: `{"message": "Invalid order_by value"}`.
2. **`order` Direction Whitelist:**
   - Allowed values: `ASC`, `DESC`.
   - Invalid value returns HTTP 400: `{"message": "order must be ASC or DESC"}`.
3. **Numeric Query Parameters:**
   - `min_price` must be a valid number (else 400: `{"message": "min_price must be a number"}`).
   - `max_price` must be a valid number (else 400: `{"message": "max_price must be a number"}`).
   - `limit` must be a positive integer (else 400: `{"message": "limit must be a positive number"}`).
   - `offset` must be a non-negative integer (else 400: `{"message": "offset must be a positive number"}`).
4. **POST & PUT Body Validation:**
   - `title`: Required non-empty string (else 400: `{"message": "Title is required"}`).
   - `author`: Required non-empty string (else 400: `{"message": "Author is required"}`).
   - `price`: Required valid number (else 400: `{"message": "Price must be a number"}`).
   - `pages`: If provided, must be numeric (else 400: `{"message": "Pages must be a number"}`).

---

## Status Codes Used

| Status Code | Meaning | When it is returned |
|:---:|:---|:---|
| **`200 OK`** | Request Succeeded | Successful `GET`, `PUT`, and `DELETE` operations |
| **`201 Created`** | Resource Created | Successful `POST /books` operation |
| **`400 Bad Request`** | Client Validation Error | Missing fields, non-numeric values, or invalid query parameters |
| **`404 Not Found`** | Resource Not Found | When `bookId` does not exist in the database |
| **`500 Internal Error`** | Server-side Exception | Unexpected database or internal failure |

---

## How to Deploy to Vercel

Vercel supports Express.js applications with **zero configuration** when the app is properly exported (`module.exports = app`) and root directory is selected.

### Step-by-Step Instructions:

1. **Push your code to GitHub:**
   ```bash
   git add lab-03/
   git commit -m "Configure lab-03 for Vercel deployment"
   git push origin main
   ```

2. **Open Vercel:**
   - Go to [vercel.com](https://vercel.com) and log in with your GitHub account.
   - Click **Add New...** &rarr; **Project**.

3. **Import Your Repository:**
   - Select your **`BackendLabs`** repository.

4. **Configure Project Settings:**
   - **Framework Preset:** Select **Other** (or leave as auto-detected).
   - **Root Directory:** Click **Edit** and choose **`lab-03`**.
   - **Build Command:** Leave default (`npm run build` or empty).
   - **Install Command:** Leave default (`npm install`).
   - **Output Directory:** Leave default.

5. **Deploy:**
   - Click **Deploy**.
   - Vercel will install dependencies, recognize `app.js` as the Express serverless function entrypoint, and deploy the project.

6. **Test Live Endpoints:**
   - `https://your-project.vercel.app/`
   - `https://your-project.vercel.app/books`
   - `https://your-project.vercel.app/books/1`
   - `https://your-project.vercel.app/books?search_q=harry`
   - `https://your-project.vercel.app/books?order_by=price&order=DESC`

7. **Update Live URL:**
   - Copy your assigned Vercel URL and paste it under the `## Live Link` table above!

> [!NOTE]
> **SQLite on Vercel Serverless:**  
> Vercel executes code in a serverless, read-only filesystem environment. Our `app.js` automatically copies `database/books.db` into Vercel's writable `/tmp` directory during cold starts, allowing both read operations (`GET`) and write operations (`POST`, `PUT`, `DELETE`). Like all serverless hosting, changes in `/tmp` are ephemeral and will reset when serverless container instances recycle.

---

## Postman Testing Placeholders

![Get Books](screenshots/get-books.png)

![Search](screenshots/search.png)

![Sorting](screenshots/sorting.png)

![Price Filter](screenshots/price-filter.png)

![Get One Book](screenshots/get-one-book.png)

![Add Book](screenshots/add-book.png)

![Update Book](screenshots/update-book.png)

![Delete Book](screenshots/delete-book.png)

![Validation Error](screenshots/validation-error.png)

![404 Error](screenshots/404-error.png)

---

## Debugging Practice

### 1. `EADDRINUSE` (Address / Port in Use)
- **Explanation:** Another process is already bound to port 3000.
- **Fix:** Terminate previous process with `Ctrl + C` or change port: `PORT=4000 npm start`.

### 2. Wrong Import Path (`Cannot find module ...`)
- **Explanation:** Node cannot locate the required file or installed package.
- **Fix:** Check relative file paths (`./database/books.db`) and ensure `npm install` was run.

### 3. SQLite Table-Name Typo (`SQLITE_ERROR: no such table: books`)
- **Explanation:** Querying `books` (plural) instead of `book` (singular).
- **Fix:** Ensure all queries reference the singular table name: `SELECT * FROM book;`.

### 4. Missing `await` in Database Calls
- **Explanation:** Omitting `await` returns an unresolved Promise object `{}` instead of the data.
- **Fix:** Always write `const books = await db.all("SELECT * FROM book;");`.

---

## SQL Injection Protection

### Why Parameterized Queries are Essential
- **Vulnerable:** `const query = "SELECT * FROM book WHERE title LIKE '%" + search_q + "%'";`  
  *Allows attackers to inject malicious SQL commands.*
- **Secure (Parameterized):** `const query = "SELECT * FROM book WHERE title LIKE ?;";` with `[`%${search_q}%`]`  
  *Ensures input is strictly treated as string data, never as executable code.*
- **Whitelist Protection:** Dynamic column names and order directions cannot be parameterized with `?`. We validate them against strict whitelist arrays (`allowedOrderColumns`, `allowedOrderDirections`) before query execution.

---

## Problems Faced and Solutions

| Possible Issue | Cause | Solution |
|:---|:---|:---|
| **Vercel Read-Only Filesystem error** | Vercel's root directory is read-only in serverless mode. | Automatically copied `database/books.db` to `/tmp/books.db` when `process.env.VERCEL` is detected. |
| **Invalid `order_by` injection attempt** | User submitted a column that doesn't exist or SQL fragment. | Implemented whitelist validation check; rejected non-whitelisted columns with HTTP 400. |
| **Numeric price filter failing** | User submitted alphabetical string in `min_price`. | Used `isNaN()` validation to reject invalid price inputs before query generation. |

---

## Viva Questions and Answers

| # | Question | Simple Answer |
|:---:|:---|:---|
| **1** | **What is a query parameter?** | Optional key-value pairs appended after `?` in the URL (e.g., `?search_q=harry&limit=5`) used for filtering, sorting, and pagination. |
| **2** | **What is a path parameter?** | A dynamic URL segment prefixed with `:` (e.g., `/books/:bookId`) used to identify a specific single resource. |
| **3** | **Difference between query and path parameter?** | Path parameters identify a specific resource (`/books/5`). Query parameters filter, sort, or paginate a list of resources (`/books?price=300`). |
| **4** | **What does REST API mean?** | Representational State Transfer — an architectural style that uses HTTP methods (GET, POST, PUT, DELETE) on resource nouns (`/books`). |
| **5** | **What does stateless mean?** | The server does not store client session state between requests; every HTTP request must contain all information needed to process it. |
| **6** | **Which status code is used for bad input?** | `400 Bad Request` — signals that the client provided missing or malformed input. |
| **7** | **Which status code is used when a record does not exist?** | `404 Not Found` — indicates the requested resource ID was not found in the database. |
| **8** | **Why do we use 201 after POST?** | HTTP 201 stands for "Created", confirming that a new row was successfully added to the database. |
| **9** | **Why do we use 404?** | To explicitly inform the client that the server is working, but the requested endpoint or resource does not exist. |
| **10** | **What is SQL injection?** | A security attack where untrusted user input contains malicious SQL statements that execute and tamper with the database. |
| **11** | **How do parameterized queries prevent SQL injection?** | The query structure is compiled first, and the placeholder (`?`) values are treated strictly as literal data, never as executable SQL code. |
| **12** | **Why do we validate user input?** | To reject malformed data, prevent application crashes, and protect against security vulnerabilities. |
| **13** | **Why do we use a whitelist for `order_by`?** | SQL column names cannot be passed as `?` parameters in SQLite, so a whitelist guarantees that only valid, existing column names are used. |
| **14** | **What does `req.query` contain?** | An object containing URL query parameters after the `?` mark (e.g., `req.query.search_q`). |
| **15** | **What does `req.params` contain?** | An object containing route path parameters (e.g., `req.params.bookId`). |
