// ====================================================================
// Lab 3: REST API, query parameters, validation, debugging
// Module: REST API Design, Filtering, Sorting, and Input Validation
// Student: T Abhiram (252U1R1244) | Section: CSE-2E
// ====================================================================

const path = require('path');
const express = require('express');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

// Initialize the Express application
const app = express();

// Middleware to parse incoming JSON request bodies
app.use(express.json());

// Set port from environment variable (for Render deployment) or default to 3000
const PORT = process.env.PORT || 3000;

// Resolve path to the SQLite database file
const dbPath = path.join(__dirname, 'database', 'books.db');

// Declare database variable in outer scope
let db = null;

// Whitelist of allowed columns for order_by to prevent SQL injection
const allowedOrderColumns = ['id', 'title', 'author', 'price', 'pages'];

// Whitelist of allowed sort directions
const allowedOrderDirections = ['ASC', 'DESC'];

// Function to initialize SQLite database and start the server
const initializeDBAndServer = async () => {
    try {
        // Open the SQLite database connection
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });

        // Create the 'book' table if it doesn't already exist
        await db.run(`
            CREATE TABLE IF NOT EXISTS book (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT,
                author TEXT,
                price INTEGER,
                pages INTEGER
            )
        `);

        // Insert 10 realistic sample books if the table is empty
        const countResult = await db.get(`SELECT COUNT(*) AS count FROM book;`);
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
                    `INSERT INTO book (title, author, price, pages) VALUES (?, ?, ?, ?);`,
                    book
                );
            }
            console.log('Database initialized with 10 sample books.');
        }

        // Start listening only after the database connection is established
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.log(`DB Error: ${error.message}`);
        process.exit(1);
    }
};

// Start the database and server
initializeDBAndServer();

// ====================================================================
// RESTful CRUD ROUTES WITH QUERY PARAMETERS & VALIDATION
// ====================================================================

// 1. GET ALL BOOKS (with search, sort, filter, and pagination): GET /books
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

        // Validation 1: order_by column whitelist check
        const normalizedOrderBy = order_by.toLowerCase();
        if (!allowedOrderColumns.includes(normalizedOrderBy)) {
            return res.status(400).json({
                message: 'Invalid order_by value'
            });
        }

        // Validation 2: order direction whitelist check
        const normalizedOrder = order.toUpperCase();
        if (!allowedOrderDirections.includes(normalizedOrder)) {
            return res.status(400).json({
                message: 'order must be ASC or DESC'
            });
        }

        // Validation 3: min_price must be numeric
        if (min_price !== undefined) {
            if (isNaN(min_price) || min_price.toString().trim() === '') {
                return res.status(400).json({
                    message: 'min_price must be a number'
                });
            }
        }

        // Validation 4: max_price must be numeric
        if (max_price !== undefined) {
            if (isNaN(max_price) || max_price.toString().trim() === '') {
                return res.status(400).json({
                    message: 'max_price must be a number'
                });
            }
        }

        // Validation 5: limit must be a positive integer
        if (limit !== undefined) {
            const parsedLimit = Number(limit);
            if (isNaN(parsedLimit) || !Number.isInteger(parsedLimit) || parsedLimit < 1) {
                return res.status(400).json({
                    message: 'limit must be a positive number'
                });
            }
        }

        // Validation 6: offset must be a non-negative integer
        if (offset !== undefined) {
            const parsedOffset = Number(offset);
            if (isNaN(parsedOffset) || !Number.isInteger(parsedOffset) || parsedOffset < 0) {
                return res.status(400).json({
                    message: 'offset must be a positive number'
                });
            }
        }

        // Construct parameterized SQL query
        const conditions = [];
        const params = [];

        // Partial title search using SQL LIKE
        conditions.push(`title LIKE ?`);
        params.push(`%${search_q}%`);

        // Price range filter
        if (min_price !== undefined) {
            conditions.push(`price >= ?`);
            params.push(Number(min_price));
        }

        if (max_price !== undefined) {
            conditions.push(`price <= ?`);
            params.push(Number(max_price));
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // Safe interpolation of validated whitelist columns + parameters for values
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
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// 2. GET SINGLE BOOK BY ID: GET /books/:bookId
app.get('/books/:bookId', async (req, res) => {
    try {
        const { bookId } = req.params;
        const getBookQuery = `SELECT * FROM book WHERE id = ?;`;
        const book = await db.get(getBookQuery, [bookId]);

        if (book === undefined) {
            return res.status(404).json({
                message: 'Book not found'
            });
        }

        res.status(200).json(book);
    } catch (error) {
        console.log(`Error: ${error.message}`);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// 3. POST ADD NEW BOOK: POST /books
app.post('/books', async (req, res) => {
    try {
        const { title, author, price, pages } = req.body;

        // Validation: Title is required
        if (!title || typeof title !== 'string' || title.trim() === '') {
            return res.status(400).json({
                message: 'Title is required'
            });
        }

        // Validation: Author is required
        if (!author || typeof author !== 'string' || author.trim() === '') {
            return res.status(400).json({
                message: 'Author is required'
            });
        }

        // Validation: Price must be a number
        if (price === undefined || isNaN(price) || typeof price === 'boolean') {
            return res.status(400).json({
                message: 'Price must be a number'
            });
        }

        // Validation: Pages if provided must be a number
        if (pages !== undefined && (isNaN(pages) || typeof pages === 'boolean')) {
            return res.status(400).json({
                message: 'Pages must be a number'
            });
        }

        const addBookQuery = `
            INSERT INTO book (title, author, price, pages)
            VALUES (?, ?, ?, ?);
        `;
        const result = await db.run(addBookQuery, [
            title.trim(),
            author.trim(),
            Number(price),
            pages !== undefined ? Number(pages) : 0
        ]);

        res.status(201).json({
            message: 'Book added successfully',
            bookId: result.lastID
        });
    } catch (error) {
        console.log(`Error: ${error.message}`);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// 4. PUT UPDATE BOOK BY ID: PUT /books/:bookId
app.put('/books/:bookId', async (req, res) => {
    try {
        const { bookId } = req.params;
        const { title, author, price, pages } = req.body;

        // Check if book exists first
        const checkQuery = `SELECT * FROM book WHERE id = ?;`;
        const existingBook = await db.get(checkQuery, [bookId]);

        if (existingBook === undefined) {
            return res.status(404).json({
                message: 'Book not found'
            });
        }

        // Validation: Title is required
        if (!title || typeof title !== 'string' || title.trim() === '') {
            return res.status(400).json({
                message: 'Title is required'
            });
        }

        // Validation: Author is required
        if (!author || typeof author !== 'string' || author.trim() === '') {
            return res.status(400).json({
                message: 'Author is required'
            });
        }

        // Validation: Price must be a number
        if (price === undefined || isNaN(price) || typeof price === 'boolean') {
            return res.status(400).json({
                message: 'Price must be a number'
            });
        }

        // Validation: Pages if provided must be a number
        if (pages !== undefined && (isNaN(pages) || typeof pages === 'boolean')) {
            return res.status(400).json({
                message: 'Pages must be a number'
            });
        }

        const updateBookQuery = `
            UPDATE book
            SET title = ?, author = ?, price = ?, pages = ?
            WHERE id = ?;
        `;
        await db.run(updateBookQuery, [
            title.trim(),
            author.trim(),
            Number(price),
            pages !== undefined ? Number(pages) : existingBook.pages,
            bookId
        ]);

        res.status(200).json({
            message: 'Book updated successfully'
        });
    } catch (error) {
        console.log(`Error: ${error.message}`);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// 5. DELETE BOOK BY ID: DELETE /books/:bookId
app.delete('/books/:bookId', async (req, res) => {
    try {
        const { bookId } = req.params;

        // Check if book exists first
        const checkQuery = `SELECT * FROM book WHERE id = ?;`;
        const existingBook = await db.get(checkQuery, [bookId]);

        if (existingBook === undefined) {
            return res.status(404).json({
                message: 'Book not found'
            });
        }

        const deleteBookQuery = `DELETE FROM book WHERE id = ?;`;
        await db.run(deleteBookQuery, [bookId]);

        res.status(200).json({
            message: 'Book deleted successfully'
        });
    } catch (error) {
        console.log(`Error: ${error.message}`);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

