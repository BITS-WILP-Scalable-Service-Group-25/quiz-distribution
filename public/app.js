const socket = io();
let studentId = localStorage.getItem("studentId") || generateStudentId();
let authToken = localStorage.getItem("authToken");
localStorage.setItem("studentId", studentId);

function generateStudentId() {
  return "student_" + Math.random().toString(36).substr(2, 9);
}

// Fetch and display available quizzes
async function loadQuizzes() {
  try {
    const response = await fetch("/api/quiz", {
      headers: {
        "x-auth": authToken,
      },
    });
    if (response.status === 401) {
      alert("Please log in to view quizzes");
      return;
    }
    const quizzes = await response.json();
    const quizList = document.getElementById("quizList");
    quizList.innerHTML = "";

    quizzes.forEach((quiz) => {
      const quizCard = document.createElement("div");
      quizCard.className = "col-md-4 quiz-card";
      quizCard.innerHTML = `
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">${quiz.title}</h5>
            <p class="card-text">${quiz.description}</p>
            <button class="btn btn-primary" onclick="startQuiz('${quiz.id}')">Start Quiz</button>
          </div>
        </div>
      `;
      quizList.appendChild(quizCard);
    });
  } catch (error) {
    console.error("Error loading quizzes:", error);
  }
}

// Load and display a specific quiz
async function startQuiz(quizId) {
  try {
    const response = await fetch(`/api/quiz/${quizId}`, {
      headers: {
        "x-auth": authToken,
      },
    });
    if (response.status === 401) {
      alert("Please log in to take the quiz");
      return;
    }
    const quiz = await response.json();

    document.getElementById("quizList").style.display = "none";
    const quizContent = document.getElementById("quizContent");
    quizContent.style.display = "block";

    document.getElementById("quizTitle").textContent = quiz.title;
    document.getElementById("quizDescription").textContent = quiz.description;

    const questionsContainer = document.getElementById("questions");
    questionsContainer.innerHTML = "";

    if (!quiz.questions || quiz.questions.length === 0) {
      questionsContainer.innerHTML =
        "<p>No questions available for this quiz.</p>";
      return;
    }

    quiz.questions.forEach((question, index) => {
      const questionDiv = document.createElement("div");
      questionDiv.className = "question";
      questionDiv.innerHTML = `
        <p><strong>Question ${index + 1}:</strong> ${question.text}</p>
        ${question.options
          .map(
            (option, optIndex) => `
          <div class="form-check">
            <input class="form-check-input" type="radio" 
              name="question${question.id}" 
              value="${optIndex}" 
              id="q${question.id}opt${optIndex}">
            <label class="form-check-label" for="q${question.id}opt${optIndex}">
              ${option}
            </label>
          </div>
        `
          )
          .join("")}
      `;
      questionsContainer.appendChild(questionDiv);
    });

    socket.emit("join-quiz", quizId);

    const form = document.getElementById("quizForm");
    form.onsubmit = (e) => submitQuiz(e, quizId, quiz.questions);
  } catch (error) {
    console.error("Error loading quiz:", error);
    alert("Error loading quiz. Please try again.");
  }
}

// Submit quiz answers
async function submitQuiz(event, quizId, questions) {
  event.preventDefault();

  const answers = questions.map((question) => {
    const selected = document.querySelector(
      `input[name="question${question.id}"]:checked`
    );
    return selected ? parseInt(selected.value) : null;
  });

  try {
    const response = await fetch(`/api/quiz/${quizId}/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-auth": authToken,
      },
      body: JSON.stringify({
        answers,
      }),
    });

    if (response.status === 401) {
      alert("Your session has expired. Please log in again.");
      return;
    }

    alert("Quiz submitted successfully!");
    document.getElementById("quizContent").style.display = "none";
    document.getElementById("quizList").style.display = "block";
    loadQuizzes();
  } catch (error) {
    console.error("Error submitting quiz:", error);
    alert("Failed to submit quiz. Please try again.");
  }
}

socket.on("quiz-graded", (data) => {
  if (data.studentId === studentId) {
    alert(
      `Your quiz "${data.quizTitle}" has been graded! Score: ${data.score}%`
    );
  }
});

// Navigation functions
function showQuizList() {
  document.querySelector(".nav-tabs .nav-link").classList.add("active");
  document
    .querySelector(".nav-tabs .nav-link:last-child")
    .classList.remove("active");
  document.getElementById("quizList").style.display = "flex";
  document.getElementById("quizContent").style.display = "none";
  document.getElementById("reviewSection").style.display = "none";
  loadQuizzes();
}

function showReviewPage() {
  document.querySelector(".nav-tabs .nav-link").classList.remove("active");
  document
    .querySelector(".nav-tabs .nav-link:last-child")
    .classList.add("active");
  document.getElementById("quizList").style.display = "none";
  document.getElementById("quizContent").style.display = "none";
  document.getElementById("reviewSection").style.display = "block";
  loadQuizzesForReview();
}

// Load quizzes for review dropdown
async function loadQuizzesForReview() {
  try {
    const response = await fetch("/api/quiz", {
      headers: {
        "x-auth": authToken,
      },
    });
    if (response.status === 401) {
      alert("Please log in to view quizzes");
      return;
    }
    const quizzes = await response.json();
    const quizSelector = document.getElementById("quizSelector");
    quizSelector.innerHTML =
      '<option value="">Select a quiz to review</option>';

    quizzes.forEach((quiz) => {
      const option = document.createElement("option");
      option.value = quiz.id;
      option.textContent = quiz.title;
      quizSelector.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading quizzes:", error);
  }
}

// Load submissions for a specific quiz
async function loadSubmissions(quizId) {
  if (!quizId) return;

  try {
    const response = await fetch(`/api/quiz/${quizId}/submissions`, {
      headers: {
        "x-auth": authToken,
      },
    });

    if (response.status === 401) {
      alert("Please log in to view submissions");
      return;
    }

    if (response.status === 403) {
      alert("You are not authorized to view submissions");
      return;
    }

    const submissions = await response.json();
    const submissionsList = document.getElementById("submissionsList");
    submissionsList.innerHTML = "";

    submissions.forEach((submission) => {
      const submissionCard = document.createElement("div");
      submissionCard.className = "submission-card p-3 mb-3";
      submissionCard.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-2">
          <h5>Student ID: ${submission.studentId}</h5>
          <span class="status-${
            submission.status
          }">${submission.status.toUpperCase()}</span>
        </div>
        <p>Submitted: ${new Date(submission.submittedAt).toLocaleString()}</p>
        ${
          submission.reviewedAt
            ? `<p>Reviewed: ${new Date(
                submission.reviewedAt
              ).toLocaleString()}</p>`
            : ""
        }
        ${submission.feedback ? `<p>Feedback: ${submission.feedback}</p>` : ""}
        ${
          submission.status === "pending"
            ? `
          <div class="mt-3">
            <textarea class="form-control mb-2" placeholder="Enter feedback..." id="feedback-${submission._id}"></textarea>
            <button class="btn btn-success me-2" onclick="reviewSubmission('${quizId}', '${submission._id}', 'approved')">
              Approve
            </button>
            <button class="btn btn-danger" onclick="reviewSubmission('${quizId}', '${submission._id}', 'rejected')">
              Reject
            </button>
          </div>
        `
            : ""
        }
      `;
      submissionsList.appendChild(submissionCard);
    });

    if (submissions.length === 0) {
      submissionsList.innerHTML = "<p>No submissions found for this quiz.</p>";
    }
  } catch (error) {
    console.error("Error loading submissions:", error);
    alert("Error loading submissions. Please try again.");
  }
}

// Review a submission
async function reviewSubmission(quizId, submissionId, status) {
  try {
    const feedbackElement = document.getElementById(`feedback-${submissionId}`);
    const feedback = feedbackElement ? feedbackElement.value : "";

    const response = await fetch(
      `/api/quiz/${quizId}/submissions/${submissionId}/review`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-auth": authToken,
        },
        body: JSON.stringify({
          status,
          feedback,
        }),
      }
    );

    if (response.status === 401) {
      alert("Your session has expired. Please log in again.");
      return;
    }

    if (response.status === 403) {
      alert("You are not authorized to review submissions");
      return;
    }

    if (response.ok) {
      alert(`Submission ${status} successfully!`);
      loadSubmissions(quizId);
    } else {
      const error = await response.json();
      alert(error.error || "Failed to review submission");
    }
  } catch (error) {
    console.error("Error reviewing submission:", error);
    alert("Failed to review submission. Please try again.");
  }
}

// Handle login form submission
async function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  // Test credentials
  if (email === "test@example.com" && password === "password123") {
    // Simulate successful login with a test token
    authToken = "test-token-123";
    localStorage.setItem("authToken", authToken);
    document.getElementById("loginForm").style.display = "none";
    document.getElementById("mainContent").style.display = "block";
    loadQuizzes();
    return;
  }

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      const data = await response.json();
      authToken = data.token;
      localStorage.setItem("authToken", authToken);
      document.getElementById("loginForm").style.display = "none";
      document.getElementById("mainContent").style.display = "block";
      loadQuizzes();
    } else {
      alert("Invalid credentials");
    }
  } catch (error) {
    console.error("Login error:", error);
    alert("Login failed. Please try again.");
  }
}

// Check auth token and load quizzes if authenticated
function init() {
  if (authToken) {
    document.getElementById("loginForm").style.display = "none";
    document.getElementById("mainContent").style.display = "block";
    loadQuizzes();
  } else {
    document.getElementById("loginForm").style.display = "block";
    document.getElementById("mainContent").style.display = "none";
  }
}

// Listen for submission review notifications
socket.on("submission-reviewed", (data) => {
  alert(
    `Your quiz submission has been ${data.status}. ${
      data.feedback ? `Feedback: ${data.feedback}` : ""
    }`
  );
});

// Initialize the app
init();
