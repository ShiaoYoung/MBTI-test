(function () {
  'use strict';

  var state = {
    questions: [],
    personalities: [],
    quizQuestions: [],
    currentIndex: 0,
    answers: []
  };

  var typePairs = [
    ['E', 'I'],
    ['S', 'N'],
    ['T', 'F'],
    ['J', 'P']
  ];

  var labels = {
    E: '外向',
    I: '内向',
    S: '实感',
    N: '直觉',
    T: '思考',
    F: '情感',
    J: '判断',
    P: '知觉'
  };

  var introPanel = document.getElementById('intro-panel');
  var quizPanel = document.getElementById('quiz-panel');
  var resultPanel = document.getElementById('result-panel');
  var errorPanel = document.getElementById('error-panel');
  var startButton = document.getElementById('start-button');
  var restartButton = document.getElementById('restart-button');
  var reviewButton = document.getElementById('review-button');
  var questionCount = document.getElementById('question-count');
  var progressTitle = document.getElementById('progress-title');
  var progressNumber = document.getElementById('progress-number');
  var progressFill = document.getElementById('progress-fill');
  var questionText = document.getElementById('question-text');
  var choices = document.getElementById('choices');
  var answerSheet = document.getElementById('answer-sheet');
  var resultType = document.getElementById('result-type');
  var resultSubtitle = document.getElementById('result-subtitle');
  var resultDescription = document.getElementById('result-description');
  var resultContent = document.getElementById('result-content');
  var scoresPanel = document.getElementById('scores-panel');

  function showPanel(panel) {
    [introPanel, quizPanel, resultPanel, errorPanel].forEach(function (item) {
      item.classList.toggle('hidden', item !== panel);
    });
  }

  function showError(message) {
    errorPanel.textContent = message;
    showPanel(errorPanel);
  }

  function shuffle(items) {
    var copy = items.slice();

    for (var index = copy.length - 1; index > 0; index -= 1) {
      var randomIndex = Math.floor(Math.random() * (index + 1));
      var temp = copy[index];
      copy[index] = copy[randomIndex];
      copy[randomIndex] = temp;
    }

    return copy;
  }

  function fetchJson(path) {
    return fetch(path).then(function (response) {
      if (!response.ok) {
        throw new Error('无法读取 ' + path);
      }

      return response.json();
    });
  }

  function loadData() {
    if (Array.isArray(window.MBTI_QUESTIONS) && Array.isArray(window.MBTI_PERSONALITIES)) {
      return Promise.resolve([window.MBTI_QUESTIONS, window.MBTI_PERSONALITIES]);
    }

    return Promise.all([
      fetchJson('./data/questions.json'),
      fetchJson('./data/personality-content.json')
    ]);
  }

  function countAnswers() {
    return state.answers.filter(Boolean).reduce(function (counts, answer) {
      counts[answer] = (counts[answer] || 0) + 1;
      return counts;
    }, {});
  }

  function calculateType(counts) {
    return typePairs.map(function (pair) {
      var first = counts[pair[0]] || 0;
      var second = counts[pair[1]] || 0;
      return first > second ? pair[0] : pair[1];
    }).join('');
  }

  function renderProgress() {
    var answered = state.answers.filter(Boolean).length;
    var total = state.quizQuestions.length;
    var current = Math.min(state.currentIndex + 1, total);
    progressTitle.textContent = '第 ' + current + ' 题';
    progressNumber.textContent = answered + ' / ' + total;
    progressFill.style.width = total === 0 ? '0%' : Math.round((answered / total) * 100) + '%';
  }

  function renderAnswerSheet() {
    answerSheet.innerHTML = state.quizQuestions.map(function (_, index) {
      var classes = ['answer-sheet__item'];

      if (state.answers[index]) {
        classes.push('is-answered');
      }

      if (index === state.currentIndex) {
        classes.push('is-current');
      }

      return '<button class="' + classes.join(' ') + '" type="button" data-index="' + index + '" aria-label="第 ' + (index + 1) + ' 题">' + (index + 1) + '</button>';
    }).join('');
  }

  function renderQuestion() {
    var question = state.quizQuestions[state.currentIndex];

    if (!question) {
      renderResult();
      return;
    }

    renderProgress();
    renderAnswerSheet();
    questionText.textContent = question.question;
    choices.innerHTML = '';

    [question.choice_a, question.choice_b].forEach(function (choice, index) {
      var button = document.createElement('button');
      var mark = document.createElement('span');
      var text = document.createElement('span');

      button.className = 'choice';
      button.type = 'button';
      button.dataset.value = choice.value;

      if (state.answers[state.currentIndex] === choice.value) {
        button.classList.add('is-selected');
      }

      mark.className = 'choice__mark';
      mark.textContent = index === 0 ? 'A' : 'B';
      text.className = 'choice__text';
      text.textContent = choice.text;

      button.appendChild(mark);
      button.appendChild(text);
      choices.appendChild(button);
    });
  }

  function startQuiz() {
    state.quizQuestions = shuffle(state.questions);
    state.currentIndex = 0;
    state.answers = new Array(state.quizQuestions.length).fill(null);
    scoresPanel.classList.add('hidden');
    renderQuestion();
    showPanel(quizPanel);
  }

  function renderScores(counts) {
    scoresPanel.innerHTML = typePairs.map(function (pair) {
      var left = pair[0];
      var right = pair[1];
      var leftScore = counts[left] || 0;
      var rightScore = counts[right] || 0;
      var winner = leftScore > rightScore ? left : right;

      return '<div class="score-card">' +
        '<strong>' + left + '/' + right + ' · ' + labels[winner] + '</strong>' +
        '<span>' + labels[left] + ' ' + leftScore + ' 分 · ' + labels[right] + ' ' + rightScore + ' 分</span>' +
        '</div>';
    }).join('');
  }

  function renderResult() {
    var counts = countAnswers();
    var type = calculateType(counts);
    var personality = state.personalities.find(function (item) {
      return item.type === type;
    });

    if (!personality) {
      showError('已完成测试，但未找到 ' + type + ' 的人格介绍。');
      return;
    }

    progressFill.style.width = '100%';
    resultType.textContent = personality.type;
    resultSubtitle.textContent = personality.subtitle;
    resultDescription.textContent = personality.description;
    resultContent.innerHTML = personality.contentHtml;
    renderScores(counts);
    showPanel(resultPanel);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  choices.addEventListener('click', function (event) {
    var button = event.target.closest('.choice');

    if (!button) {
      return;
    }

    state.answers[state.currentIndex] = button.dataset.value;

    if (state.answers.filter(Boolean).length === state.quizQuestions.length) {
      renderResult();
      return;
    }

    var nextUnanswered = state.answers.findIndex(function (answer, index) {
      return !answer && index > state.currentIndex;
    });

    if (nextUnanswered === -1) {
      nextUnanswered = state.answers.findIndex(function (answer) {
        return !answer;
      });
    }

    state.currentIndex = nextUnanswered === -1 ? state.currentIndex : nextUnanswered;
    renderQuestion();
  });

  answerSheet.addEventListener('click', function (event) {
    var button = event.target.closest('.answer-sheet__item');

    if (!button) {
      return;
    }

    state.currentIndex = Number(button.dataset.index);
    renderQuestion();
  });

  startButton.addEventListener('click', startQuiz);
  restartButton.addEventListener('click', startQuiz);
  reviewButton.addEventListener('click', function () {
    scoresPanel.classList.toggle('hidden');
  });

  loadData().then(function (results) {
    state.questions = results[0];
    state.personalities = results[1];
    questionCount.textContent = state.questions.length + ' 道题 · ' + state.personalities.length + ' 种人格';
    startButton.disabled = false;
  }).catch(function () {
    startButton.disabled = true;
    questionCount.textContent = '题库读取失败';
    showError('数据文件读取失败。请确认 data/questions.json 和 data/personality-content.json 存在，并通过本地服务器打开页面。');
  });
})();
