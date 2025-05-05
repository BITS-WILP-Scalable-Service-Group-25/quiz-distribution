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

// Initialize the app
init();
