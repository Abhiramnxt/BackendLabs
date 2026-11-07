// ====================================================================
// Lab 3: REST API, query parameters, validation, debugging
// Module: REST API Design, Filtering, Sorting, and Input Validation
// Student: T Abhiram (252U1R1244) | Section: CSE-2E
// ====================================================================

const fs = require('fs');
const path = require('path');
const express = require('express');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

// Initialize the Express application
const app = express();

// Middleware to parse incoming JSON request bodies
app.use(express.json());

// Set port from environment variable or default to 3000
const PORT = process.env.PORT || 3000;

// Resolve path to the SQLite database file
let dbPath = path.join(__dirname, 'database', 'books.db');

if (process.env.VERCEL) {
    const tmpDbPath = path.join('/tmp', 'books.db');

    try {
        if (!fs.existsSync(tmpDbPath) && fs.existsSync(dbPath)) {
            fs.copyFileSync(dbPath, tmpDbPath);
        }

        if (fs.existsSync(tmpDbPath)) {
            dbPath = tmpDbPath;
        }
    } catch (err) {
        console.warn('Vercel /tmp copy warning:', err.message);
    }
}

// Declare database variable in outer scope
let db = null;

// Whitelist of allowed columns for order_by
const allowedOrderColumns = ['id', 'title', 'author', 'price', 'pages'];

// Whitelist of allowed sort directions
const allowedOrderDirections = ['ASC', 'DESC'];

// Function to initialize SQLite database connection
const initializeDB = async () => {
    if (db) return db;

    // Open the SQLite database connection
    db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    // Create the book table
    await db.run(`
        CREATE TABLE IF NOT EXISTS book (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            author TEXT,
            price INTEGER,
            pages INTEGER
        )
    `);

    // Insert 10 sample books if table is empty
    const countResult = await db.get(
        `SELECT COUNT(*) AS count FROM book;`
    );

    if (countResult.count === 0) {
        const initialBooks = [
            ['The Alchemist', 'Paulo Coelho', 350, 208],
            ['Atomic Habits', 'James Clear', 450, 320],
            ['Clean Code', 'Robert C. Martin', 650, 464],
            ['To Kill a Mockingbird', 'Harper Lee', 399, 281],
            ['1984', 'George Orwell', 299, 328],
            ['The Great Gatsby', 'F. Scott Fitzgerald', 250, 180],
            ['Rich Dad Poor Dad', 'Robert T. Kiyosaki', 399, 336],
            ['Harry Potter and the Sorcerer Stone', 'J.K. Rowling', 499, 309],
            ['The Pragmatic Programmer', 'Andrew Hunt', 750, 352],
            ['Deep Work', 'Cal Newport', 420, 304]
        ];

        for (const book of initialBooks) {
            await db.run(
                `INSERT INTO book (title, author, price, pages)
                 VALUES (?, ?, ?, ?);`,
                book
            );
        }

        console.log('Database initialized with 10 sample books.');
    }

    return db;
};

// Middleware to ensure database is connected
app.use(async (req, res, next) => {
    try {
        if (!db) {
            await initializeDB();
        }

        next();
    } catch (error) {
        console.error('DB Initialization Error:', error.message);

        res.status(500).json({
            message: 'Internal Server Error'
        });
    }
});

// ====================================================================
// ROOT ROUTE
// ====================================================================

app.get('/', (req, res) => {
    res.status(200).json({
        message: "Welcome to Backend Development Fundamentals - Lab 3 (REST API, Query Parameters, Validation & Debugging)",
        student: "Abhiram Thunikipati",
        registrationNumber: "252U1R1244",
        section: "CSE-2E 211",
        college: "Aurora Deemed-to-be-University",
        faculty: "Mr Yugandhar Gurjalwar",
        endpoints: {
            listBooksWithFilters: "GET /books/?search_q=&order_by=id&order=ASC&limit=10&offset=0&min_price=&max_price=",
            getSingleBook: "GET /books/:bookId/",
            addBook: "POST /books/",
            updateBook: "PUT /books/:bookId/",
            deleteBook: "DELETE /books/:bookId/"
        }
    });
});

// ====================================================================
// 1. GET ALL BOOKS
// ====================================================================

app.get('/books', async (req, res) => {
    try {
        const {
            search_q = '',
            order_by = 'id',
            order = 'ASC',
            limit = 10,
            offset = 0,
            min_price,
            max_price
        } = req.query;

        // Validate order_by
        const normalizedOrderBy = order_by.toLowerCase();

        if (!allowedOrderColumns.includes(normalizedOrderBy)) {
            return res.status(400).json({
                message: 'Invalid order_by value'
            });
        }

        // Validate order
        const normalizedOrder = order.toUpperCase();

        if (!allowedOrderDirections.includes(normalizedOrder)) {
            return res.status(400).json({
                message: 'order must be ASC or DESC'
            });
        }

        // Validate min_price
        if (min_price !== undefined) {
            if (isNaN(min_price) || min_price.toString().trim() === '') {
                return res.status(400).json({
                    message: 'min_price must be a number'
                });
            }
        }

        // Validate max_price
        if (max_price !== undefined) {
            if (isNaN(max_price) || max_price.toString().trim() === '') {
                return res.status(400).json({
                    message: 'max_price must be a number'
                });
            }
        }

        // Validate limit
        if (limit !== undefined) {
            const parsedLimit = Number(limit);

            if (
                isNaN(parsedLimit) ||
                !Number.isInteger(parsedLimit) ||
                parsedLimit < 1
            ) {
                return res.status(400).json({
                    message: 'limit must be a positive number'
                });
            }
        }

        // Validate offset
        if (offset !== undefined) {
            const parsedOffset = Number(offset);

            if (
                isNaN(parsedOffset) ||
                !Number.isInteger(parsedOffset) ||
                parsedOffset < 0
            ) {
                return res.status(400).json({
                    message: 'offset must be a positive number'
                });
            }
        }

        // Build SQL query
        const conditions = [];
        const params = [];

        conditions.push(`title LIKE ?`);
        params.push(`%${search_q}%`);

        if (min_price !== undefined) {
            conditions.push(`price >= ?`);
            params.push(Number(min_price));
        }

        if (max_price !== undefined) {
            conditions.push(`price <= ?`);
            params.push(Number(max_price));
        }

        const whereClause =
            conditions.length > 0
                ? `WHERE ${conditions.join(' AND ')}`
                : '';

        const getBooksQuery = `
            SELECT * FROM book
            ${whereClause}
            ORDER BY ${normalizedOrderBy} ${normalizedOrder}
            LIMIT ? OFFSET ?;
        `;

        params.push(Number(limit), Number(offset));

        const books = await db.all(getBooksQuery, params);

        res.status(200).json(books);

    } catch (error) {
        console.log(`Error: ${error.message}`);

        res.status(500).json({
            message: 'Internal Server Error'
        });
    }
});

// ====================================================================
// 2. GET SINGLE BOOK
// ====================================================================

app.get('/books/:bookId', async (req, res) => {
    try {
        const { bookId } = req.params;

        const getBookQuery = `
            SELECT * FROM book
            WHERE id = ?;
        `;

        const book = await db.get(getBookQuery, [bookId]);

        if (book === undefined) {
            return res.status(404).json({
                message: 'Book not found'
            });
        }

        res.status(200).json(book);

    } catch (error) {
        console.log(`Error: ${error.message}`);

        res.status(500).json({
            message: 'Internal Server Error'
        });
    }
});

// ====================================================================
// 3. POST ADD NEW BOOK
// ====================================================================

app.post('/books', async (req, res) => {
    try {
        const {
            title,
            author,
            price,
            pages
        } = req.body;

        // Validation: Title is required
        if (
            !title ||
            typeof title !== 'string' ||
            title.trim() === ''
        ) {
            return res.status(400).json({
                message: 'Title is required'
            });
        }

        // Validation: Author is required
        if (
            !author ||
            typeof author !== 'string' ||
            author.trim() === ''
        ) {
            return res.status(400).json({
                message: 'Author is required'
            });
        }

        // Validation: Price must be a non-negative number
        if (
            price === undefined ||
            isNaN(price) ||
            typeof price === 'boolean' ||
            Number(price) < 0
        ) {
            return res.status(400).json({
                message: 'price is required and must be a non-negative number'
            });
        }

        // Validation: Pages if provided must be a number
        if (
            pages !== undefined &&
            (isNaN(pages) || typeof pages === 'boolean')
        ) {
            return res.status(400).json({
                message: 'Pages must be a number'
            });
        }

        const addBookQuery = `
            INSERT INTO book (title, author, price, pages)
            VALUES (?, ?, ?, ?);
        `;

        const result = await db.run(
            addBookQuery,
            [
                title.trim(),
                author.trim(),
                Number(price),
                pages !== undefined ? Number(pages) : 0
            ]
        );

        res.status(201).json({
            message: 'Book added successfully',
            bookId: result.lastID
        });

    } catch (error) {
        console.log(`Error: ${error.message}`);

        res.status(500).json({
            message: 'Internal Server Error'
        });
    }
});

// ====================================================================
// 4. PUT UPDATE BOOK
// ====================================================================

app.put('/books/:bookId', async (req, res) => {
    try {
        const { bookId } = req.params;

        const {
            title,
            author,
            price,
            pages
        } = req.body;

        // Check if book exists
        const checkQuery = `
            SELECT * FROM book
            WHERE id = ?;
        `;

        const existingBook = await db.get(
            checkQuery,
            [bookId]
        );

        if (existingBook === undefined) {
            return res.status(404).json({
                message: 'Book not found'
            });
        }

        // Validation: Title is required
        if (
            !title ||
            typeof title !== 'string' ||
            title.trim() === ''
        ) {
            return res.status(400).json({
                message: 'Title is required'
            });
        }

        // Validation: Author is required
        if (
            !author ||
            typeof author !== 'string' ||
            author.trim() === ''
        ) {
            return res.status(400).json({
                message: 'Author is required'
            });
        }

        // Validation: Price must be a number
        if (
            price === undefined ||
            isNaN(price) ||
            typeof price === 'boolean'
        ) {
            return res.status(400).json({
                message: 'Price must be a number'
            });
        }

        // Validation: Pages must be a number
        if (
            pages !== undefined &&
            (isNaN(pages) || typeof pages === 'boolean')
        ) {
            return res.status(400).json({
                message: 'Pages must be a number'
            });
        }

        const updateBookQuery = `
            UPDATE book
            SET title = ?, author = ?, price = ?, pages = ?
            WHERE id = ?;
        `;

        await db.run(
            updateBookQuery,
            [
                title.trim(),
                author.trim(),
                Number(price),
                pages !== undefined
                    ? Number(pages)
                    : existingBook.pages,
                bookId
            ]
        );

        res.status(200).json({
            message: 'Book updated successfully'
        });

    } catch (error) {
        console.log(`Error: ${error.message}`);

        res.status(500).json({
            message: 'Internal Server Error'
        });
    }
});

// ====================================================================
// 5. DELETE BOOK
// ====================================================================

app.delete('/books/:bookId', async (req, res) => {
    try {
        const { bookId } = req.params;

        // Check if book exists
        const checkQuery = `
            SELECT * FROM book
            WHERE id = ?;
        `;

        const existingBook = await db.get(
            checkQuery,
            [bookId]
        );

        if (existingBook === undefined) {
            return res.status(404).json({
                message: 'Book not found'
            });
        }

        const deleteBookQuery = `
            DELETE FROM book
            WHERE id = ?;
        `;

        await db.run(
            deleteBookQuery,
            [bookId]
        );

        res.status(200).json({
            message: 'Book deleted successfully'
        });

    } catch (error) {
        console.log(`Error: ${error.message}`);

        res.status(500).json({
            message: 'Internal Server Error'
        });
    }
});

// ====================================================================
// START SERVER
// ====================================================================

if (!process.env.VERCEL) {
    initializeDB()
        .then(() => {
            app.listen(PORT, () => {
                console.log(`Server running on port ${PORT}`);
            });
        })
        .catch((error) => {
            console.log(`DB Error: ${error.message}`);
            process.exit(1);
        });
}

// Export Express app for Vercel
module.exports = app;