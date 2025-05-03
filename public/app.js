const socket = io();
let studentId = localStorage.getItem("studentId") || generateStudentId();
localStorage.setItem("studentId", studentId);

function generateStudentId() {
  return "student_" + Math.random().toString(36).substr(2, 9);
}

// Fetch and display available quizzes
async function loadQuizzes() {
  try {
    const response = await fetch("/api/quizzes");
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
    const response = await fetch(`/api/quiz/${quizId}`);
    const quiz = await response.json();

    document.getElementById("quizList").style.display = "none";
    const quizContent = document.getElementById("quizContent");
    quizContent.style.display = "block";

    document.getElementById("quizTitle").textContent = quiz.title;
    document.getElementById("quizDescription").textContent = quiz.description;

    const questionsContainer = document.getElementById("questions");
    questionsContainer.innerHTML = "";

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

    // Join the quiz room for notifications
    socket.emit("join-quiz", quizId);

    // Set up form submission
    const form = document.getElementById("quizForm");
    form.onsubmit = (e) => submitQuiz(e, quizId, quiz.questions);
  } catch (error) {
    console.error("Error loading quiz:", error);
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
    await fetch(`/api/quiz/${quizId}/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        studentId,
        answers,
      }),
    });

    alert("Quiz submitted successfully!");
    document.getElementById("quizContent").style.display = "none";
    document.getElementById("quizList").style.display = "block";
  } catch (error) {
    console.error("Error submitting quiz:", error);
    alert("Failed to submit quiz. Please try again.");
  }
}

// Listen for quiz grading notifications
socket.on("quiz-graded", (data) => {
  if (data.studentId === studentId) {
    alert(
      `Your quiz "${data.quizTitle}" has been graded! Score: ${data.score}%`
    );
  }
});

// Load quizzes when the page loads
loadQuizzes();
