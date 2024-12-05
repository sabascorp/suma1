document.addEventListener('DOMContentLoaded', function() {
    var dbStatus = document.getElementById('dbStatus');

    // Verificar la conexión con la base de datos
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '../config/check_connection.php', true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            var response = JSON.parse(xhr.responseText);
            if (response.status === 'success') {
                dbStatus.textContent = response.message;
                dbStatus.style.color = 'green';
            } else {
                dbStatus.textContent = response.message;
                dbStatus.style.color = 'red';
            }
        }
    };
    xhr.send();

    var countdownDisplay = document.getElementById('countdown');
    var progressBar = document.getElementById('progressBar');
    var answerInput = document.getElementById('answer');
    var resultDisplay = document.getElementById('result');
    var startButton = document.getElementById('startButton');
    var resetButton = document.getElementById('resetButton');
    var leaderboardBody = document.getElementById('leaderboardBody');
    var userNameInput = document.getElementById('userNameInput');
    var submitNameButton = document.getElementById('submitNameButton');
    var leaderboardCaption = document.getElementById('leaderboardCaption');
    var nameInputContainer = document.getElementById('nameInputContainer');
    var practiceContainer = document.getElementById('practiceContainer');
    var leaderboard = document.getElementById('leaderboard');
    var timer;
    var correctCount = 0;
    var wrongCount = 0;
    var totalAttempts = 0;
    var practiceStarted = false;
    var countdownTimer;
    var userName = '';
    var operationType = 'suma1'; // Tipo de operación
    var eventType = 'practica'; // Tipo de evento

    function getRandomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Función para mostrar operaciones de suma, resta, multiplicaciones, divisiones
    function showOperation() {
        var operationType = getRandomNumber(1, 1); // 1: suma, 2: resta, 3: multiplicacion, 4: division
        var num1, num2;

        switch (operationType) {
            case 1: // Suma
                num1 = getRandomNumber(1, 9);
                num2 = getRandomNumber(1, 9);
                correctAnswer = num1 + num2;
                document.getElementById('operation').innerHTML = '<div>' + num1 + '<br>+ ' + num2 + '</div>';
                break;
            case 2: // Resta
                num1 = getRandomNumber(10, 99);
                num2 = getRandomNumber(1, num1); // Asegurar que el minuendo sea mayor que el sustraendo
                correctAnswer = num1 - num2;
                document.getElementById('operation').innerHTML = '<div>' + num1 + '<br>- ' + num2 + '</div>';
                break;
            case 3: // Multiplicación
                num1 = getRandomNumber(1, 10);
                num2 = getRandomNumber(1, 10);
                correctAnswer = num1 * num2;
                document.getElementById('operation').innerHTML = '<div>' + num1 + '<br>x ' + num2 + '</div>';
                break;
            case 4: // División
                num2 = getRandomNumber(1, 12); // Divisor entre 1 y 12
                var multiple = getRandomNumber(1, 12);
                num1 = num2 * multiple; // Dividendo es múltiplo del divisor
                correctAnswer = multiple;
                document.getElementById('operation').innerHTML = '<div>' + num1 + '<br>÷ ' + num2 + '</div>';
                break;
        }
    }

    function checkAnswer() {
        var userAnswer = parseFloat(answerInput.value);
        if (!isNaN(userAnswer)) {
            totalAttempts++;
            if (userAnswer === correctAnswer) {
                correctCount++;
                answerInput.style.backgroundColor = '#c8e6c9';
            } else {
                wrongCount++;
                answerInput.style.backgroundColor = '#ffcdd2';
            }
            setTimeout(function() {
                answerInput.style.backgroundColor = '';
            }, 50);
            answerInput.value = '';
            showOperation();
            updateStats();
        }
    }

    function startPractice() {
        if (!practiceStarted) {
            practiceStarted = true;
            showOperation();
            startCountdown();
            answerInput.disabled = false;
            answerInput.focus();
            resetButton.style.display = 'none';
        }
    }

    function resetPractice() {
        clearInterval(timer);
        clearInterval(countdownTimer);
        countdownDisplay.textContent = '';
        resultDisplay.textContent = '';
        correctCount = 0;
        wrongCount = 0;
        totalAttempts = 0;
        practiceStarted = false;
        startButton.disabled = false;
        resetButton.style.display = 'none';
        progressBar.style.width = '100%';
        answerInput.disabled = true;
        answerInput.value = '';
        progressBar.className = 'progress-bar progress-bar-green';
        updateStats();
    }

    function showResults() {
        var currentDate = new Date().toLocaleString();
        var newRow = document.createElement('tr');
        var difference = correctCount - wrongCount;
        var classification = '';

        if (difference >= -1000 && difference <= 29) {
            classification = 'N1';
        } else if (difference >= 30 && difference <= 39) {
            classification = 'N2';
        } else if (difference >= 40 && difference <= 59) {
            classification = 'N3';
        } else {
            classification = 'N4';
        }

        newRow.innerHTML = '<td>' + currentDate + '</td>' +
            '<td>' + correctCount + '</td>' +
            '<td>' + wrongCount + '</td>' +
            '<td>' + totalAttempts + '</td>' +
            '<td>' + difference + '</td>' +
            '<td>' + classification + '</td>';
        leaderboardBody.insertBefore(newRow, leaderboardBody.firstChild);

        saveResultsToDatabase(currentDate, correctCount, wrongCount, totalAttempts, difference, classification, operationType, eventType);
    }

    function updateStats() {
    	// Calcula la diferencia (correctos - incorrectos)
    	var difference = correctCount - wrongCount;

    	// Calcula la efectividad (diferencia / correctos), evitando dividir por 0
    	var effectiveness = correctCount > 0 ? ((difference / correctCount) * 100).toFixed(2) : 0;

    	// Actualiza los elementos del DOM
    	document.getElementById('statsAccuracy').textContent = `${correctCount}/${totalAttempts}`;
    	document.getElementById('statsEffectiveness').textContent = `${effectiveness}%`;
    }

    function saveResultsToDatabase(date, correct, wrong, attempts, difference, classification, operationType, eventType) {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '../config/save_results.php', true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                console.log(xhr.responseText);
            }
        };
        xhr.send('username=' + encodeURIComponent(userName) +
            '&date=' + encodeURIComponent(date) +
            '&correct=' + correct +
            '&wrong=' + wrong +
            '&attempts=' + attempts +
            '&difference=' + difference +
            '&classification=' + encodeURIComponent(classification) +
            '&operation=' + encodeURIComponent(operationType) +
            '&event=' + encodeURIComponent(eventType)); // Enviar tipo de operación
    }

    function startCountdownTimer() {
        var countdownTime = 5;
        countdownDisplay.textContent = `${countdownTime} s`;
        startButton.disabled = true;
        countdownTimer = setInterval(function() {
            countdownTime--;
            countdownDisplay.textContent = `${countdownTime} s`;
            if (countdownTime <= 0) {
                clearInterval(countdownTimer);
                countdownDisplay.textContent = `${countdownTime} s`;
                startPractice();
            }
        }, 1000);
    }

    function startCountdown() {
        var totalTime = 60;
        var intervalDuration = 1000;
        var timeLeft = totalTime;
        var progressBarIncrement = 100 / totalTime;

        timer = setInterval(function() {
            timeLeft--;
            countdownDisplay.textContent = `${timeLeft} s`;
            updateProgressBar(progressBarIncrement * timeLeft);
            if (timeLeft <= 0) {
                clearInterval(timer);
                countdownDisplay.textContent = '¡Tiempo!';
                document.getElementById('operation').textContent = '';
                answerInput.disabled = true;
                showResults();
                resetButton.style.display = 'block';
            }
        }, intervalDuration);
    }

    function updateProgressBar(progress) {
        progressBar.style.width = progress + '%';
        if (progress <= 10) {
            progressBar.className = 'progress-bar progress-bar-red';
        } else if (progress <= 50) {
            progressBar.className = 'progress-bar progress-bar-orange';
        } else {
            progressBar.className = 'progress-bar progress-bar-green';
        }
    }

   submitNameButton.addEventListener('click', function () {
    userName = userNameInput.value.trim();
    var dbStatus = document.getElementById('dbStatus'); // Usaremos dbStatus también para el usuario

    if (userName !== '') {
        // Validar si el nombre de usuario existe
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '../config/check_user.php', true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                try {
                    var response = JSON.parse(xhr.responseText);
                    if (response.existe) {
                        // Mostrar mensaje de éxito
                        dbStatus.textContent = 'Usuario verificado. Puedes iniciar la práctica.';
                        dbStatus.style.color = 'green';

                        // Permitir iniciar la práctica
                        nameInputContainer.style.display = 'none';
                        practiceContainer.classList.remove('hidden');
                        leaderboard.classList.remove('hidden');
                        leaderboardCaption.textContent = `Resultados de ${userName}`;
                        startButton.disabled = false;
                        resetButton.style.display = 'none'; // Esto oculta el botón de reiniciar al principio
                    } else {
                        // Mostrar mensaje de error si el usuario no existe
                        dbStatus.textContent = 'El usuario no existe. Por favor, verifica o regístrate.';
                        dbStatus.style.color = 'red';
                    }
                } catch (error) {
                    console.error('Error al procesar la respuesta del servidor:', error);
                    dbStatus.textContent = 'Error al verificar el usuario. Intenta nuevamente.';
                    dbStatus.style.color = 'red';
                }
            }
        };
        xhr.send('username=' + encodeURIComponent(userName));
    } else {
        // Mostrar mensaje si no se ingresó un nombre de usuario
        dbStatus.textContent = 'Por favor, ingresa un nombre de usuario.';
        dbStatus.style.color = 'red';
    }
});

    startButton.addEventListener('click', startCountdownTimer);
    resetButton.addEventListener('click', resetPractice);
    answerInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            checkAnswer();
        }
    });
});
