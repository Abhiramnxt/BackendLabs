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

| Deployment Platform | Live URL | Status |
|:---|:---|:---|
| **Render** | [Add deployed URL after deployment] | Pending Deployment |

---

## Objective
The objective of this lab is to enhance the SQLite book API developed in Lab 2 by implementing robust RESTful API design principles. This includes adding support for query parameters for partial text searching (`LIKE`), column sorting (whitelist-protected `ORDER BY`), price range filtering (`min_price` and `max_price`), and pagination (`limit` and `offset`). It also focuses on rigorous request body and query parameter validation, standardizing JSON error messages, utilizing appropriate HTTP status codes (200, 201, 400, 404), and learning essential backend debugging techniques.

---

## Technologies Used

| Technology | Purpose |
|:---|:---|
| **Node.js** | Server-side JavaScript runtime environment |
| **Express.js** | Web application framework for HTTP routing and middleware |
| **SQLite** | Lightweight, zero-configuration relational database engine |
| **sqlite3** | Core Node.js SQLite driver |
| **sqlite** | Promise-based wrapper enabling `async`/`await` database calls |
| **Nodemon** | Development tool that automatically restarts the server on code changes |
| **Postman** | API testing client used to send HTTP requests with query parameters and body payloads |

---

## Project Structure

```text
lab-03/
│
├── app.js               # REST API server with query parameters, validation, and CRUD
├── package.json         # Project metadata, scripts, and dependencies
├── package-lock.json    # Exact dependency tree lockfile
├── .gitignore           # Ignores node_modules/ and .env (tracks database/books.db)
├── README.md            # Comprehensive documentation, debugging guide, and viva Q&A
├── database/
│   └── books.db         # Persistent SQLite database file storing the book table
└── screenshots/
    └── .gitkeep         # Preserves screenshots directory in Git
```

---

## Installation

1. Navigate to the `lab-03` folder:
   ```bash
   cd lab-03
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

---

## Run

| Mode | Command | Description |
|:---|:---|:---|
| **Development** | `npm run dev` | Runs with **Nodemon** (auto-restart on file save) |
| **Standard / Production** | `npm start` *(or `node app.js`)* | Runs with standard **Node.js** |

Server runs locally on:
```text
http://localhost:3000
```

---

## API Endpoints

| Method | Endpoint | Description | Status Code |
|:---:|:---|:---|:---:|
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

## Postman Testing

### Success Tests
1. `GET http://localhost:3000/books` (All books)
2. `GET http://localhost:3000/books?search_q=harry` (Search by title)
3. `GET http://localhost:3000/books?order_by=price&order=DESC` (Sort by highest price)
4. `GET http://localhost:3000/books?limit=5&offset=0` (Pagination)
5. `GET http://localhost:3000/books?min_price=200&max_price=500` (Price range filter)
6. `GET http://localhost:3000/books?search_q=the&order_by=price&order=ASC&limit=5&offset=0` (Combined query)
7. `GET http://localhost:3000/books/1` (Single book)
8. `POST http://localhost:3000/books` with body:
   ```json
   {
     "title": "New Book",
     "author": "New Author",
     "price": 400,
     "pages": 300
   }
   ```
9. `PUT http://localhost:3000/books/1` with body:
   ```json
   {
     "title": "Updated Book",
     "author": "Updated Author",
     "price": 500,
     "pages": 350
   }
   ```
10. `DELETE http://localhost:3000/books/1`

### Failure & Validation Tests
11. `GET http://localhost:3000/books/999` &rarr; Status `404 Not Found`
12. `POST http://localhost:3000/books` without `title` &rarr; Status `400 Bad Request`
13. `POST http://localhost:3000/books` without `author` &rarr; Status `400 Bad Request`
14. `POST http://localhost:3000/books` with `"price": "abc"` &rarr; Status `400 Bad Request`
15. `GET http://localhost:3000/books?order=INVALID` &rarr; Status `400 Bad Request`
16. `GET http://localhost:3000/books?order_by=invalid` &rarr; Status `400 Bad Request`
17. `GET http://localhost:3000/books?limit=abc` &rarr; Status `400 Bad Request`
18. `GET http://localhost:3000/books?min_price=abc` &rarr; Status `400 Bad Request`

### Screenshot Previews

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
- **Explanation:** Another process (often a previous running instance of Node or Nodemon) is already bound to port 3000.
- **How to debug:**
  - Press `Ctrl + C` in the existing terminal to terminate the previous process.
  - In Windows PowerShell, find and kill the process:
    ```powershell
    Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
    ```
  - Or run on an alternative port: `PORT=4000 npm start`.

### 2. Wrong Import Path (`Cannot find module ...`)
- **Explanation:** Node cannot locate the required file or installed package.
- **How to debug:**
  - Check the exact relative path (e.g., `./database/books.db` vs `database/books.db`).
  - Verify package installation in `package.json` (`npm install package-name`).
  - Check spelling and case sensitivity (Node modules are case-sensitive on Linux/macOS).

### 3. SQLite Table-Name Typo (`SQLITE_ERROR: no such table: books`)
- **Explanation:** The database query references a plural table name `books`, whereas the table was defined as singular `book`.
- **How to debug:**
  - Run `sqlite3 database/books.db` followed by `.tables` to inspect the exact schema table names.
  - Match your SQL queries to the exact table identifier: `SELECT * FROM book;`.

### 4. Missing `await` in Database Calls
- **Explanation:** Database calls are asynchronous and return Promises. Omitting `await` causes the function to return a pending Promise instead of actual data, resulting in empty responses or undefined variables.
- **Example Bug:**
  ```javascript
  // BUG: Missing await returns a Promise object instead of the book array
  const books = db.all("SELECT * FROM book;");
  res.json(books); // Sends empty Promise {}
  ```
- **Correction:**
  ```javascript
  // FIXED: await resolves the Promise to the actual query results
  const books = await db.all("SELECT * FROM book;");
  res.json(books);
  ```

---

## SQL Injection Protection

### Why Parameterized Queries are Essential
User input must never be interpolated directly into SQL statements.
- **Dangerous:**
  ```javascript
  // VULNERABLE TO SQL INJECTION
  const query = `SELECT * FROM book WHERE title LIKE '%${search_q}%';`;
  ```
  If an attacker sends `search_q = "' OR 1=1 --"`, they can bypass filters or manipulate the query logic.

- **Safe (Parameterized):**
  ```javascript
  // SECURE: Parameterized Query
  const query = `SELECT * FROM book WHERE title LIKE ?;`;
  await db.all(query, [`%${search_q}%`]);
  ```
  With `?` placeholders, the SQLite engine treats the value strictly as literal string data. It is never parsed as executable SQL code.

### Whitelist for Identifiers
SQL column names and sort directions (`order_by`, `order`) cannot be parameterized with `?`. Therefore, we protect them using an explicit whitelist array (`allowedOrderColumns = ['id', 'title', 'author', 'price', 'pages']`). Any value not in the whitelist is rejected with HTTP 400.

---

## Problems Faced and Solutions

| Possible Issue | Cause | Solution |
|:---|:---|:---|
| **Invalid `order_by` injection attempt** | User submitted a column that doesn't exist or SQL fragment. | Implemented whitelist validation check; rejected non-whitelisted columns with HTTP 400. |
| **Numeric price filter failing** | User submitted alphabetical string in `min_price`. | Used `isNaN()` validation to reject invalid price inputs before query generation. |
| **Nodemon crashing on syntax error** | Typos in route declarations or missing brackets. | Check terminal stack trace line numbers and fix syntax; Nodemon reloads automatically. |

---

## Viva Questions and Answers

| # | Question | Simple Answer |
|:---:|:---|:---|
| **1** | **What is a query parameter?** | Optional key-value pairs appended after `?` in the URL (e.g., `?search_q=harry&limit=5`) used for filtering, sorting, and pagination. |
| **2** | **What is a path parameter?** | A dynamic URL segment prefixed with `:` (e.g., `/books/:bookId`) used to identify a specific single resource. |
| **3** | **Difference between query and path parameter?** | Path parameters identify a specific resource (`/books/5`). Query parameters filter, sort, or paginate a list of resources (`/books?price=300`). |
| **4** | **What does REST API mean?** | Representational State Transfer — an architectural style that uses HTTP methods (GET, POST, PUT, DELETE) on resource nouns (`/books`). |
| **5** | **What does stateless mean?** | The server does not store client session state between requests; every HTTP request must contain all the information necessary to process it. |
| **6** | **Which status code is used for bad input?** | `400 Bad Request` — signals that the client provided missing or invalid data. |
| **7** | **Which status code is used when a record does not exist?** | `404 Not Found` — indicates the requested resource ID was not found in the database. |
| **8** | **Why do we use 201 after POST?** | HTTP 201 means "Created", confirming that a new database record was successfully created. |
| **9** | **Why do we use 404?** | To clearly communicate to the client that the server is working, but the requested endpoint or resource ID doesn't exist. |
| **10** | **What is SQL injection?** | An attack where malicious SQL statements are injected into input fields to manipulate or corrupt the database. |
| **11** | **How do parameterized queries prevent SQL injection?** | They separate code from data. The query structure is compiled first, and the placeholder (`?`) values are treated strictly as data literals. |
| **12** | **Why do we validate user input?** | To prevent runtime crashes, reject malformed data, and protect against security vulnerabilities like SQL injection. |
| **13** | **Why do we use a whitelist for `order_by`?** | SQL column names cannot be passed as `?` parameters in SQLite, so a whitelist ensures only authorized, existing column names can be used. |
| **14** | **What does `req.query` contain?** | An object containing URL query parameters after the `?` mark (e.g., `req.query.search_q`). |
| **15** | **What does `req.params` contain?** | An object containing route path parameters (e.g., `req.params.bookId`). |

---

## Deployment on Render

### Steps:
1. Commit and push `lab-03` to your GitHub repository.
2. In [Render Dashboard](https://dashboard.render.com/), create a **New Web Service**.
3. Select your repository.
4. Configure service settings:
   - **Root Directory:** `lab-03`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** `Node`
5. Click **Deploy Web Service**.
6. When deployment finishes, test:
   - `https://your-service.onrender.com/books`
   - `https://your-service.onrender.com/books/1`
   - `https://your-service.onrender.com/books?search_q=the`
   - `https://your-service.onrender.com/books?order_by=price&order=DESC`

### ⚠️ Ephemeral Storage Note:
Render free tier uses an **ephemeral filesystem**. Any new books added or modified will revert to the committed Git state whenever the free service goes to sleep or redeploys.

