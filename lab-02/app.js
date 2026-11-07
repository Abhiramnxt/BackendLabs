// ====================================================================
// Lab 2: SQLite Database and CRUD Routes
// Course: Backend Development Fundamentals – Year II Term II
// Student: Abhiram Thunikipati (252U1R1244) | Section: CSE-2E
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
                ['Harry Potter and the Sorcerer\'s Stone', 'J.K. Rowling', 499, 309],
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
// CRUD ROUTES
// ====================================================================

// 1. GET ALL BOOKS: GET /books/
app.get('/books/', async (req, res) => {
    try {
        const getBooksQuery = `SELECT * FROM book;`;
        const books = await db.all(getBooksQuery);
        res.status(200).json(books);
    } catch (error) {
        console.log(`Error: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 2. GET ONE BOOK BY ID: GET /books/:bookId/
app.get('/books/:bookId/', async (req, res) => {
    try {
        const { bookId } = req.params;
        const getBookQuery = `SELECT * FROM book WHERE id = ?;`;
        const book = await db.get(getBookQuery, [bookId]);

        // If no book matches the given ID, return 404
        if (book === undefined) {
            return res.status(404).json({
                error: 'Book not found'
            });
        }

        res.status(200).json(book);
    } catch (error) {
        console.log(`Error: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 3. POST A NEW BOOK: POST /books/
app.post('/books/', async (req, res) => {
    try {
        const { title, author, price, pages } = req.body;

        // Basic validation for required fields
        if (!title || !author || price === undefined || pages === undefined) {
            return res.status(400).json({
                error: 'All fields (title, author, price, pages) are required'
            });
        }

        const addBookQuery = `
            INSERT INTO book (title, author, price, pages)
            VALUES (?, ?, ?, ?);
        `;
        const result = await db.run(addBookQuery, [title, author, price, pages]);

        res.status(201).json({
            message: 'Book added successfully',
            bookId: result.lastID
        });
    } catch (error) {
        console.log(`Error: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 4. PUT UPDATE A BOOK BY ID: PUT /books/:bookId/
app.put('/books/:bookId/', async (req, res) => {
    try {
        const { bookId } = req.params;
        const { title, author, price, pages } = req.body;

        // Check if book exists first
        const checkBookQuery = `SELECT * FROM book WHERE id = ?;`;
        const existingBook = await db.get(checkBookQuery, [bookId]);

        if (existingBook === undefined) {
            return res.status(404).json({
                error: 'Book not found'
            });
        }

        // Validate required fields
        if (!title || !author || price === undefined || pages === undefined) {
            return res.status(400).json({
                error: 'All fields (title, author, price, pages) are required'
            });
        }

        const updateBookQuery = `
            UPDATE book
            SET title = ?, author = ?, price = ?, pages = ?
            WHERE id = ?;
        `;
        await db.run(updateBookQuery, [title, author, price, pages, bookId]);

        res.status(200).json({
            message: 'Book updated successfully'
        });
    } catch (error) {
        console.log(`Error: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 5. DELETE A BOOK BY ID: DELETE /books/:bookId/
app.delete('/books/:bookId/', async (req, res) => {
    try {
        const { bookId } = req.params;

        // Check if book exists first
        const checkBookQuery = `SELECT * FROM book WHERE id = ?;`;
        const existingBook = await db.get(checkBookQuery, [bookId]);

        if (existingBook === undefined) {
            return res.status(404).json({
                error: 'Book not found'
            });
        }

        const deleteBookQuery = `DELETE FROM book WHERE id = ?;`;
        await db.run(deleteBookQuery, [bookId]);

        res.status(200).json({
            message: 'Book deleted successfully'
        });
    } catch (error) {
        console.log(`Error: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

