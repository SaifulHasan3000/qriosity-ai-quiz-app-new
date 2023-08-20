document.addEventListener("DOMContentLoaded", () => {
  const startButton = document.getElementById("start");
  const quizContainer = document.getElementById("quiz");
  const topicInput = document.getElementById("topic");
  const numQuestionsInput = document.getElementById("numQuestions");
  const questionElement = document.getElementById("question");
  const optionsContainer = document.getElementById("options");
  const resultElement = document.getElementById("result");
  const nextButton = document.getElementById("next");
  const submitButton = document.getElementById("submit");
  const restartButton = document.getElementById("restart");
  const topicInputContainer = document.getElementById("topic-input");
  const lifelineButton = document.getElementById("lifeline");
  const audiencePollButton = document.getElementById("audiencePoll");
  const audiencePollResults = document.getElementById("audiencePollResults");
  const pollChart = document.getElementById("pollChart");

  let currentQuestionIndex = 0;
  let questions = [];
  let score = 0;
  let hasStarted = false;
  let isQuizFinished = false;
  let lifelineUsed = false;
  let audiencePollUsed = false;

  async function fetchQuestionsFromBackend(topic, numQuestions) {
    try {
      const response = await fetch(`/api/getQuestions?topic=${topic}&numQuestions=${numQuestions}`);
      const data = await response.json();
      questions = data.questions;
      currentQuestionIndex = 0;
      score = 0;
      isQuizFinished = false;
      lifelineUsed = false;
      audiencePollUsed = false;
      displayQuestion();
    } catch (error) {
      console.error("Error fetching questions:", error);
    }
  }

  function displayQuestion() {
    if (isQuizFinished) {
      showScore();
      return;
    }

    const currentQuestion = questions[currentQuestionIndex];
    questionElement.innerHTML = currentQuestion.question.replace(/\n/g, "<br>");
    optionsContainer.innerHTML = "";

    currentQuestion.options.forEach((option, index) => {
      const optionButton = document.createElement("button");
      optionButton.classList.add("option");
      optionButton.textContent = option.replace(/\n/g, "");
      optionButton.dataset.option = index + 1;

      optionButton.addEventListener("mouseover", highlightOption);
      optionButton.addEventListener("mouseout", resetOptionColor);
      optionButton.addEventListener("click", selectAnswer);

      optionsContainer.appendChild(optionButton);
    });

    resultElement.textContent = "";
    nextButton.style.display = "none";
    submitButton.style.display = "none";
    lifelineButton.style.display = lifelineUsed ? "none" : "block";
    audiencePollButton.style.display = audiencePollUsed ? "none" : "block";
    resetPollChart();
    hidePollResults();
  }

  function highlightOption(event) {
    event.target.style.backgroundColor = "#1492FC";
  }

  function resetOptionColor(event) {
    event.target.style.backgroundColor = "#fff";
  }

  function selectAnswer(event) {
    if (isQuizFinished) {
      return;
    }

    const selectedOptionIndex = parseInt(event.target.dataset.option);
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = currentQuestion.correctAnswerIndex === selectedOptionIndex;

    if (isCorrect) {
      event.target.style.backgroundColor = "green";
      score++;
      resultElement.textContent = "Correct!";
    } else {
      event.target.style.backgroundColor = "red";
      resultElement.textContent = "Oops! It's the wrong answer.";
    }

    event.target.removeEventListener("mouseover", highlightOption);
    event.target.removeEventListener("mouseout", resetOptionColor);
    event.target.removeEventListener("click", selectAnswer);

    const optionButtons = document.querySelectorAll(".option");
    optionButtons.forEach(button => button.removeEventListener("click", selectAnswer));

    if (currentQuestionIndex === questions.length - 1) {
      showSubmitButton();
    } else {
      showNextButton();
    }
  }

  function showNextButton() {
    nextButton.style.display = "block";
    submitButton.style.display = "none";
    audiencePollResults.classList.remove("visible");
    audiencePollResults.classList.add("hidden");
  }

  function showSubmitButton() {
    nextButton.style.display = "none";
    submitButton.style.display = "block";
    audiencePollResults.classList.remove("visible");
    audiencePollResults.classList.add("hidden");
  }

  function hideSubmitButton() {
    submitButton.style.display = "none";
  }

  function hidePollResults() {
    audiencePollResults.classList.remove("visible");
    audiencePollResults.classList.add("hidden");
  }

  function showScore() {
    quizContainer.classList.add("hidden");
    resultElement.textContent = `Your Score: ${score} out of ${questions.length}`;
    restartButton.style.display = "block";
    hideSubmitButton();
    lifelineButton.style.display = "none";
    audiencePollButton.style.display = "none";
    hidePollResults();
  }

  function resetLifelineButton() {
    lifelineUsed = false;
    lifelineButton.disabled = false;
    lifelineButton.classList.remove("eliminated-option");
  }

  function resetAudiencePollButton() {
    audiencePollUsed = false;
    audiencePollButton.disabled = false;
    audiencePollButton.classList.remove("eliminated-option");
    hidePollResults();
  }

  function restartQuiz() {
    hasStarted = false;
    isQuizFinished = false;
    restartButton.style.display = "none";
    nextButton.style.display = "none";
    submitButton.style.display = "none";
    startButton.style.display = "block";
    topicInputContainer.classList.remove("hidden");
    questionElement.innerHTML = "";
    optionsContainer.innerHTML = "";
    resultElement.textContent = "";
    resetLifelineButton();
    resetAudiencePollButton();
    resetPollChart();
  }

  async function useLifeline() {
    if (hasStarted && !isQuizFinished && !lifelineUsed) {
      lifelineUsed = true;
      const currentQuestion = questions[currentQuestionIndex];
      const correctAnswerIndex = currentQuestion.correctAnswerIndex;
      const optionButtons = document.querySelectorAll(".option");
      let incorrectOptionsRemaining = 2;

      optionButtons.forEach((button, index) => {
        if (index + 1 !== correctAnswerIndex && incorrectOptionsRemaining > 0) {
          button.disabled = true;
          button.classList.add("eliminated-option");
          incorrectOptionsRemaining--;
        }
      });

      lifelineButton.disabled = true;
      lifelineButton.classList.add("eliminated-option");
    }
  }

  async function useAudiencePoll() {
    if (!audiencePollUsed) {
      audiencePollUsed = true;
      const currentQuestion = questions[currentQuestionIndex];
      const correctAnswerIndex = currentQuestion.correctAnswerIndex;

      const totalVotes = 100;
      const correctOptionVotes = Math.floor(totalVotes * 0.7);
      const incorrectOptionVotes = Math.floor((totalVotes - correctOptionVotes) / 3);

      const pollData = [
        { option: 1, votes: incorrectOptionVotes },
        { option: 2, votes: incorrectOptionVotes },
        { option: 3, votes: incorrectOptionVotes },
        { option: 4, votes: incorrectOptionVotes },
      ];

      pollData[correctAnswerIndex - 1].votes = correctOptionVotes;

      displayPollChart(pollData);
      audiencePollButton.disabled = true;
      audiencePollButton.classList.add("eliminated-option");
    }
  }

  function resetPollChart() {
    audiencePollResults.classList.add("hidden");
  }

  function displayPollChart(pollData) {
    audiencePollResults.classList.remove("hidden");
    audiencePollResults.classList.add("visible");

    const pollOptions = pollData.map(data => data.option);
    const pollVotes = pollData.map(data => data.votes);

    const chartOptions = {
      chart: {
        type: 'column'
      },
      title: {
        text: 'Audience Poll Results'
      },
      xAxis: {
        categories: pollOptions,
        crosshair: true
      },
      yAxis: {
        min: 0,
        max: 100,
        title: {
          text: 'Votes (%)'
        }
      },
      series: [{
        name: 'Votes',
        data: pollVotes
      }]
    };

    Highcharts.chart(pollChart, chartOptions);
  }

  startButton.addEventListener("click", () => {
    const topic = topicInput.value.trim();
    const numQuestions = parseInt(numQuestionsInput.value);

    if (topic === "" || isNaN(numQuestions) || numQuestions < 1 || numQuestions > 10) {
      alert("Please enter a valid topic and number of questions (1-10).");
    } else {
      fetchQuestionsFromBackend(topic, numQuestions);
      hasStarted = true;
      quizContainer.classList.remove("hidden");
      startButton.style.display = "none";
      topicInputContainer.classList.add("hidden");
    }
  });

  nextButton.addEventListener("click", () => {
    currentQuestionIndex++;
    hidePollResults();
    displayQuestion();
  });

  submitButton.addEventListener("click", () => {
    isQuizFinished = true;
    hidePollResults();
    showScore();
  });

  restartButton.addEventListener("click", restartQuiz);

  lifelineButton.addEventListener("click", useLifeline);
  audiencePollButton.addEventListener("click", useAudiencePoll);
});