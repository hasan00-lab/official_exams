require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

app.use(cors());
app.use(express.json());

/*
|--------------------------------------------------------------------------
| DATABASE
|--------------------------------------------------------------------------
*/
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on("error", (err) => {
  console.error("PostgreSQL error:", err);
});

/*
|--------------------------------------------------------------------------
| DATABASE TEST
|--------------------------------------------------------------------------
*/

app.get("/api/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      status: "ok",
      database: "connected",
      time: result.rows[0].now,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      status: "error",
      database: "disconnected",
      message: error.message,
    });
  }
});

/*
|--------------------------------------------------------------------------
| BRANCHES
|--------------------------------------------------------------------------
*/

app.get("/api/branches", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        branch_id,
        code,
        name
      FROM branches
      ORDER BY branch_id
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to load branches",
    });
  }
});

/*
|--------------------------------------------------------------------------
| SUBJECTS BY BRANCH
|--------------------------------------------------------------------------
*/

app.get("/api/branches/:branchId/subjects", async (req, res) => {
  const { branchId } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT DISTINCT
        s.subject_id,
        s.name
      FROM subjects s
      INNER JOIN books b
        ON b.subject_id = s.subject_id
      WHERE b.branch_id = $1
      ORDER BY s.subject_id
      `,
      [branchId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to load subjects",
    });
  }
});

/*
|--------------------------------------------------------------------------
| BOOKS BY BRANCH + SUBJECT
|--------------------------------------------------------------------------
*/

app.get(
  "/api/branches/:branchId/subjects/:subjectId/books",
  async (req, res) => {
    const { branchId, subjectId } = req.params;

    try {
      const result = await pool.query(
        `
        SELECT
          b.book_id,
          b.title,
          b.subject_id,
          b.branch_id,
          b.edition_year,
          b.publisher,
          b.description,
          b.file_path,
          b.language,
          s.name AS subject_name
        FROM books b
        LEFT JOIN subjects s
          ON s.subject_id = b.subject_id
        WHERE b.branch_id = $1
          AND b.subject_id = $2
        ORDER BY b.title
        `,
        [branchId, subjectId]
      );

      const books = result.rows.map((book) => ({
        ...book,

        file_url:
          "/books/" +
          book.file_path.replaceAll("\\", "/"),
      }));

      res.json(books);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: "Failed to load books",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| EXAMS BY BRANCH + SUBJECT
|--------------------------------------------------------------------------
*/

app.get(
  "/api/branches/:branchId/subjects/:subjectId/exams",
  async (req, res) => {
    const { branchId, subjectId } = req.params;

    try {
      const result = await pool.query(
        `
        SELECT
          e.exam_id,
          e.year,
          e.subject_id,
          e.branch_id,
          e.session,
          e.exam_type,
          e.title,
          e.file_path,
          s.name AS subject_name
        FROM exams e
        LEFT JOIN subjects s
          ON s.subject_id = e.subject_id
        WHERE e.branch_id = $1
          AND e.subject_id = $2
        ORDER BY
          e.year DESC,
          e.session ASC NULLS LAST,
          e.exam_id ASC
        `,
        [branchId, subjectId]
      );

      const exams = result.rows.map((exam) => ({
        ...exam,

        file_url:
          "/exams/" +
          exam.file_path.replaceAll("\\", "/"),
      }));

      res.json(exams);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: "Failed to load exams",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| ALL EXAMS
|--------------------------------------------------------------------------
|
| Useful for searching/filtering exams later.
|
*/

app.get("/api/exams", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        e.exam_id,
        e.year,
        e.subject_id,
        e.branch_id,
        e.session,
        e.exam_type,
        e.title,
        e.file_path,
        s.name AS subject_name,
        b.code AS branch_code,
        b.name AS branch_name
      FROM exams e
      LEFT JOIN subjects s
        ON s.subject_id = e.subject_id
      LEFT JOIN branches b
        ON b.branch_id = e.branch_id
      ORDER BY
        e.year DESC,
        b.branch_id,
        s.subject_id,
        e.session ASC NULLS LAST,
        e.exam_id
    `);

    const exams = result.rows.map((exam) => ({
      ...exam,

      file_url:
        "/exams/" +
        exam.file_path.replaceAll("\\", "/"),
    }));

    res.json(exams);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to load exams",
    });
  }
});

/*
|--------------------------------------------------------------------------
| SERVE BOOK PDF FILES
|--------------------------------------------------------------------------
*/

const booksDirectory =
  "C:/Users/PC/Desktop/official_exams/crdp ebooks";

app.use(
  "/books",
  express.static(booksDirectory)
);

/*
|--------------------------------------------------------------------------
| SERVE EXAM PDF FILES
|--------------------------------------------------------------------------
*/

const examsDirectory =
  "C:/Users/PC/Desktop/official_exams/exams/exams";

app.use(
  "/exams",
  express.static(examsDirectory)
);

/*
|--------------------------------------------------------------------------
| START SERVER
|--------------------------------------------------------------------------
*/

const PORT = 5000;

app.listen(PORT, () => {
  console.log("");
  console.log("======================================");
  console.log(" Lebanon Official Exams API");
  console.log("======================================");
  console.log(`API: http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
  console.log(`Books: http://localhost:${PORT}/books`);
  console.log(`Exams: http://localhost:${PORT}/exams`);
  console.log("");
});