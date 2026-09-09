
import React, { useEffect, useMemo, useState } from "react";
import "./styles.css";

const API = "http://localhost:5000/api";
const SERVER = "http://localhost:5000";

const branchInfo = {
  LS: {
    en: "Life Sciences",
    ar: "علوم الحياة",
    descriptionEn:
      "Access subjects, official exams and educational resources for the Life Sciences branch.",
    descriptionAr:
      "الوصول إلى المواد والامتحانات الرسمية والموارد التعليمية لفرع علوم الحياة.",
  },
  GS: {
    en: "General Sciences",
    ar: "العلوم العامة",
    descriptionEn:
      "Access subjects, official exams and educational resources for the General Sciences branch.",
    descriptionAr:
      "الوصول إلى المواد والامتحانات الرسمية والموارد التعليمية لفرع العلوم العامة.",
  },
  LH: {
    en: "Humanities",
    ar: "الآداب والإنسانيات",
    descriptionEn:
      "Access subjects, official exams and educational resources for the Humanities branch.",
    descriptionAr:
      "الوصول إلى المواد والامتحانات الرسمية والموارد التعليمية لفرع الآداب والإنسانيات.",
  },
  SE: {
    en: "Sociology & Economics",
    ar: "الاجتماع والاقتصاد",
    descriptionEn:
      "Access subjects, official exams and educational resources for the Sociology & Economics branch.",
    descriptionAr:
      "الوصول إلى المواد والامتحانات الرسمية والموارد التعليمية لفرع الاجتماع والاقتصاد.",
  },
};

function App() {
  const [lang, setLang] = useState("en");

  const [branches, setBranches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [books, setBooks] = useState([]);
  const [exams, setExams] = useState([]);

  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [examSearch, setExamSearch] = useState("");

  const ar = lang === "ar";

  useEffect(() => {
    loadBranches();
  }, []);

  async function loadBranches() {
    try {
      setLoading(true);

      const response = await fetch(`${API}/branches`);

      if (!response.ok) {
        throw new Error("Failed to load branches");
      }

      const data = await response.json();

      setBranches(data);
      setError("");
    } catch (err) {
      console.error(err);

      setError(
        ar
          ? "تعذر الاتصال بقاعدة البيانات."
          : "Could not connect to the database."
      );
    } finally {
      setLoading(false);
    }
  }

  async function openBranch(branch) {
    try {
      setSelectedBranch(branch);
      setSelectedSubject(null);
      setBooks([]);
      setExams([]);
      setSearch("");
      setExamSearch("");
      setLoading(true);

      const response = await fetch(
        `${API}/branches/${branch.branch_id}/subjects`
      );

      if (!response.ok) {
        throw new Error("Failed to load subjects");
      }

      const data = await response.json();

      setSubjects(data);
      setError("");
    } catch (err) {
      console.error(err);

      setError(
        ar ? "تعذر تحميل المواد." : "Could not load subjects."
      );
    } finally {
      setLoading(false);
    }
  }

  async function openSubject(subject) {
    try {
      setSelectedSubject(subject);
      setSearch("");
      setExamSearch("");
      setLoading(true);

      const baseUrl = `${API}/branches/${selectedBranch.branch_id}/subjects/${subject.subject_id}`;

      const [booksResponse, examsResponse] = await Promise.all([
        fetch(`${baseUrl}/books`),
        fetch(`${baseUrl}/exams`),
      ]);

      if (!booksResponse.ok) {
        throw new Error("Failed to load books");
      }

      if (!examsResponse.ok) {
        throw new Error("Failed to load exams");
      }

      const booksData = await booksResponse.json();
      const examsData = await examsResponse.json();

      setBooks(booksData);
      setExams(examsData);
      setError("");
    } catch (err) {
      console.error(err);

      setError(
        ar
          ? "تعذر تحميل الكتب والامتحانات."
          : "Could not load books and exams."
      );
    } finally {
      setLoading(false);
    }
  }

  function goHome() {
    setSelectedBranch(null);
    setSelectedSubject(null);
    setSubjects([]);
    setBooks([]);
    setExams([]);
    setSearch("");
    setExamSearch("");
  }

  function goToBranch() {
    setSelectedSubject(null);
    setBooks([]);
    setExams([]);
    setSearch("");
    setExamSearch("");
  }

  const filteredBooks = useMemo(() => {
    return books.filter((book) =>
      book.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [books, search]);

  const filteredExams = useMemo(() => {
    const query = examSearch.toLowerCase().trim();

    if (!query) {
      return exams;
    }

    return exams.filter((exam) => {
      return (
        String(exam.year).includes(query) ||
        String(exam.session || "")
          .toLowerCase()
          .includes(query) ||
        String(exam.exam_type || "")
          .toLowerCase()
          .includes(query) ||
        String(exam.title || "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [exams, examSearch]);

  return (
    <div className={ar ? "app rtl" : "app"} dir={ar ? "rtl" : "ltr"}>
      <header className="navbar">
        <div className="brand" onClick={goHome}>
          <div className="brandMark">LB</div>

          <div>
            <strong>
              {ar ? "الامتحانات الرسمية" : "Official Exams"}
            </strong>

            <span>
              {ar ? "الأرشيف اللبناني" : "Lebanon Archive"}
            </span>
          </div>
        </div>

        <div className="navActions">
          <div className="databaseIndicator">
            <span className="statusDot"></span>
            {ar ? "متصل" : "Database Connected"}
          </div>

          <button
            className="languageBtn"
            onClick={() => setLang(ar ? "en" : "ar")}
          >
            {ar ? "English" : "العربية"}
          </button>
        </div>
      </header>

      <main className="main">
        {error && (
          <div className="errorBox">
            <strong>{ar ? "خطأ" : "Error"}</strong>
            <span>{error}</span>
          </div>
        )}

        {!selectedBranch ? (
          <>
            <section className="hero">
              <div className="heroTag">
                {ar
                  ? "الامتحانات الرسمية اللبنانية"
                  : "LEBANESE OFFICIAL EXAMS"}
              </div>

              <h1>
                {ar ? (
                  <>
                    اختار فرعك.
                    <span> كل شي بمحل واحد.</span>
                  </>
                ) : (
                  <>
                    Choose your branch.
                    <span> Everything in one place.</span>
                  </>
                )}
              </h1>

              <p>
                {ar
                  ? "تصفح المواد والكتب والامتحانات الرسمية اللبنانية من مكان واحد، مع بيانات يتم تحميلها مباشرة من قاعدة البيانات."
                  : "Browse Lebanese subjects, educational books and official exam resources from one place, powered directly by your database."}
              </p>
            </section>

            <section className="section">
              <div className="sectionHeading">
                <div>
                  <span>{ar ? "الفروع" : "BRANCHES"}</span>

                  <h2>
                    {ar
                      ? "اختر فرع البكالوريا"
                      : "Choose your Baccalaureate branch"}
                  </h2>
                </div>

                <div className="countBadge">
                  {branches.length} {ar ? "فروع" : "Branches"}
                </div>
              </div>

              {loading ? (
                <Loading />
              ) : (
                <div className="branchGrid">
                  {branches.map((branch, index) => {
                    const code = branch.code;
                    const info = branchInfo[code];

                    return (
                      <button
                        className="branchCard"
                        key={branch.branch_id}
                        onClick={() => openBranch(branch)}
                      >
                        <div className="cardTop">
                          <span className="cardNumber">
                            {String(index + 1).padStart(2, "0")}
                          </span>

                          <span className="cardArrow">↗</span>
                        </div>

                        <div className="cardCode">{code}</div>

                        <h3>
                          {ar
                            ? info?.ar || branch.name
                            : info?.en || branch.name}
                        </h3>

                        <p>
                          {ar
                            ? info?.descriptionAr
                            : info?.descriptionEn}
                        </p>

                        <div className="cardBottom">
                          <span>
                            {ar ? "فتح الفرع" : "Open branch"}
                          </span>

                          <span className="roundArrow">→</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        ) : (
          <>
            <div className="breadcrumb">
              <button onClick={goHome}>
                {ar ? "الرئيسية" : "Home"}
              </button>

              <span> / </span>

              <button onClick={goToBranch}>
                {branchInfo[selectedBranch.code]?.[
                  ar ? "ar" : "en"
                ] || selectedBranch.name}
              </button>

              {selectedSubject && (
                <>
                  <span> / </span>
                  <span>{selectedSubject.name}</span>
                </>
              )}
            </div>

            {!selectedSubject ? (
              <section className="categoryPage">
                <div className="categoryHero">
                  <div className="categoryLabel">
                    {selectedBranch.code}
                  </div>

                  <h1>
                    {branchInfo[selectedBranch.code]?.[
                      ar ? "ar" : "en"
                    ] || selectedBranch.name}
                  </h1>

                  <p>
                    {ar
                      ? "اختر المادة للوصول إلى الكتب والامتحانات الرسمية."
                      : "Choose a subject to access its books and official exams."}
                  </p>
                </div>

                <section className="section">
                  <div className="sectionHeading">
                    <div>
                      <span>{ar ? "المواد" : "SUBJECTS"}</span>

                      <h2>
                        {ar
                          ? "مواد هذا الفرع"
                          : "Subjects in this branch"}
                      </h2>
                    </div>

                    <div className="countBadge">
                      {subjects.length}
                    </div>
                  </div>

                  {loading ? (
                    <Loading />
                  ) : (
                    <div className="subjectGrid">
                      {subjects.map((subject) => (
                        <button
                          className="subjectCard"
                          key={subject.subject_id}
                          onClick={() => openSubject(subject)}
                        >
                          <div className="subjectIcon">
                            {getSubjectIcon(subject.name)}
                          </div>

                          <div className="subjectInfo">
                            <span className="subjectNumber">
                              SUBJECT
                            </span>

                            <h3>{subject.name}</h3>

                            <p>
                              {ar
                                ? "عرض الكتب والامتحانات"
                                : "View books & exams"}
                            </p>
                          </div>

                          <span className="subjectArrow">→</span>
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              </section>
            ) : (
              <section className="categoryPage">
                <button className="backBtn" onClick={goToBranch}>
                  {ar ? "→ رجوع للمواد" : "← Back to subjects"}
                </button>

                <div className="categoryHero compact">
                  <div className="categoryLabel">
                    {selectedBranch.code} / {selectedSubject.name}
                  </div>

                  <h1>{selectedSubject.name}</h1>

                  <p>
                    {ar
                      ? "الكتب الدراسية والامتحانات الرسمية المتوفرة."
                      : "Study books and official exams available for this subject."}
                  </p>
                </div>

                {/* OFFICIAL EXAMS */}

                <section className="section">
                  <div className="booksHeader">
                    <div>
                      <span>
                        {ar ? "الأرشيف الرسمي" : "OFFICIAL ARCHIVE"}
                      </span>

                      <h2>
                        {ar
                          ? "الامتحانات الرسمية"
                          : "Official Exams"}
                      </h2>
                    </div>

                    <div className="searchBox">
                      <span>⌕</span>

                      <input
                        value={examSearch}
                        onChange={(e) =>
                          setExamSearch(e.target.value)
                        }
                        placeholder={
                          ar
                            ? "ابحث بالسنة أو الدورة..."
                            : "Search by year or session..."
                        }
                      />
                    </div>
                  </div>

                  {loading ? (
                    <Loading />
                  ) : filteredExams.length === 0 ? (
                    <div className="emptyBox">
                      <div>📝</div>

                      <h3>
                        {ar
                          ? "لا توجد امتحانات"
                          : "No exams found"}
                      </h3>

                      <p>
                        {ar
                          ? "لا توجد امتحانات مطابقة للبحث."
                          : "No official exams match your search."}
                      </p>
                    </div>
                  ) : (
                    <div className="examGrid">
                      {filteredExams.map((exam) => (
                        <ExamCard
                          key={exam.exam_id}
                          exam={exam}
                          ar={ar}
                        />
                      ))}
                    </div>
                  )}
                </section>

                {/* BOOKS */}

                <section className="section">
                  <div className="booksHeader">
                    <div>
                      <span>{ar ? "المكتبة" : "LIBRARY"}</span>

                      <h2>
                        {ar ? "الكتب الدراسية" : "Study Books"}
                      </h2>
                    </div>

                    <div className="searchBox">
                      <span>⌕</span>

                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={
                          ar
                            ? "ابحث عن كتاب..."
                            : "Search books..."
                        }
                      />
                    </div>
                  </div>

                  {loading ? (
                    <Loading />
                  ) : filteredBooks.length === 0 ? (
                    <div className="emptyBox">
                      <div>📚</div>

                      <h3>
                        {ar ? "لا توجد كتب" : "No books found"}
                      </h3>

                      <p>
                        {ar
                          ? "لا توجد كتب مطابقة للبحث."
                          : "No books match your search."}
                      </p>
                    </div>
                  ) : (
                    <div className="bookGrid">
                      {filteredBooks.map((book) => (
                        <BookCard
                          key={book.book_id}
                          book={book}
                          ar={ar}
                        />
                      ))}
                    </div>
                  )}
                </section>
              </section>
            )}
          </>
        )}
      </main>

      <footer>
        <div>
          <strong>
            {ar
              ? "أرشيف الامتحانات الرسمية اللبنانية"
              : "Lebanon Official Exams Archive"}
          </strong>

          <span>
            {ar
              ? "منصة تعليمية للوصول إلى المصادر الرسمية."
              : "A centralized platform for official educational resources."}
          </span>
        </div>

        <span>© 2026</span>
      </footer>
    </div>
  );
}

function BookCard({ book, ar }) {
  const language =
    book.language?.toUpperCase() === "FR"
      ? "French"
      : "English";

  return (
    <article className="bookCard">
      <div className="bookCover">
        <div className="bookPattern"></div>

        <div className="bookIcon">📖</div>

        <span className="bookLanguage">
          {language}
        </span>
      </div>

      <div className="bookContent">
        <span className="bookSubject">
          {book.subject_name || "Study Material"}
        </span>

        <h3>{book.title}</h3>

        <div className="bookMeta">
          <span>{book.edition_year || "Official"}</span>

          {book.publisher && (
            <span>{book.publisher}</span>
          )}
        </div>

        <a
          className="bookButton"
          href={`${SERVER}${book.file_url}`}
          target="_blank"
          rel="noreferrer"
        >
          {ar ? "فتح الكتاب" : "Open book"}

          <span>↗</span>
        </a>
      </div>
    </article>
  );
}

function ExamCard({ exam, ar }) {
  const session = formatSession(exam.session, ar);
  const examType = formatExamType(exam.exam_type, ar);

  return (
    <article className="examCard">
      <div className="examTop">
        <div className="examYear">
          {exam.year}
        </div>

        <div className="examIcon">
          📝
        </div>
      </div>

      <div className="examContent">
        <span className="examSubject">
          {exam.subject_name || "Official Exam"}
        </span>

        <h3>
          {exam.title ||
            `${exam.year} ${ar ? "Official Exam" : "Official Exam"}`}
        </h3>

        <div className="examMeta">
          {session && <span>{session}</span>}

          {examType && <span>{examType}</span>}
        </div>

        <a
          className="bookButton"
          href={`${SERVER}${exam.file_url}`}
          target="_blank"
          rel="noreferrer"
        >
          {ar ? "فتح الامتحان" : "Open exam"}

          <span>↗</span>
        </a>
      </div>
    </article>
  );
}

function formatSession(session, ar) {
  if (!session) {
    return "";
  }

  const value = String(session).toLowerCase().trim();

  const translations = {
    "1": ar ? "الدورة الأولى" : "Session 1",
    "2": ar ? "الدورة الثانية" : "Session 2",
    first: ar ? "الدورة الأولى" : "First Session",
    second: ar ? "الدورة الثانية" : "Second Session",
    main: ar ? "الدورة العادية" : "Main Session",
    normal: ar ? "الدورة العادية" : "Normal Session",
    supplementary: ar ? "الدورة الاستثنائية" : "Supplementary Session",
  };

  return translations[value] || session;
}

function formatExamType(type, ar) {
  if (!type) {
    return "";
  }

  const value = String(type).toLowerCase().trim();

  const translations = {
    official: ar ? "رسمي" : "Official",
    solution: ar ? "حل" : "Solution",
    sol: ar ? "حل" : "Solution",
    questions: ar ? "أسئلة" : "Questions",
    makfoufen: ar ? "للمكفوفين" : "For visually impaired students",
    ehteyejet: ar ? "احتياجات خاصة" : "Special Needs",
  };

  return translations[value] || type;
}

function Loading() {
  return (
    <div className="loading">
      <div className="spinner"></div>

      <span>Loading...</span>
    </div>
  );
}

function getSubjectIcon(subject) {
  const icons = {
    Arabic: "ع",
    French: "Fr",
    English: "En",
    Civics: "⚖",
    History: "◷",
    Geography: "⌖",
    Mathematics: "∑",
    Physics: "ϟ",
    Chemistry: "⚗",
    Biology: "⌬",
    Sociology: "◉",
    Economics: "₿",
    Philosophy: "Φ",
  };

  return icons[subject] || "•";
}

export default App;
