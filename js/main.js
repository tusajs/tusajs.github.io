document.addEventListener('DOMContentLoaded', () => {
    // Элементы
    const dragon = document.getElementById('dragon');
    const cactusContainer = document.getElementById('cactusContainer');
    const trophyContainer = document.getElementById('trophyContainer');
    const stageDisplay = document.getElementById('stageDisplay');
    const gameMessage = document.getElementById('gameMessage');

    // Секции (только для победы и прогресса)
    const sections = ['python', 'how', 'where', 'reviews', 'scores', 'contacts'];
    
    // Состояние
    let gameWon = false;
    let isJumping = false;
    let maxScroll = 0; // максимальный достигнутый процент скролла
    
    // Кактусы
    const cactusPositions = [20, 35, 50, 65];
    let cactusPassed = [false, false, false, false];

    // Параметры движения
    const DRAGON_START = 5;
    const DRAGON_MAX = 80;
    const JUMP_OFFSET = 7;       // на сколько % перелетаем кактус
    const JUMP_DURATION = 450;     // длительность прыжка в мс
    const TRIGGER_DISTANCE = 4;    // расстояние до кактуса для начала прыжка

    // ===== СОЗДАНИЕ КАКТУСОВ =====
    function createCacti() {
        cactusContainer.innerHTML = '';
        cactusPositions.forEach((pos, index) => {
            const cactus = document.createElement('div');
            cactus.className = 'cactus';
            cactus.dataset.index = index;
            cactus.style.left = pos + '%';
            
            const img = document.createElement('img');
            img.src = 'assets/cactus.png';
            img.className = 'cactus-img';
            cactus.appendChild(img);
            
            cactusContainer.appendChild(cactus);
        });
    }

    // ===== ОБНОВЛЕНИЕ ПРОГРЕССА =====
    function updateProgress() {
        // Определяем текущий раздел по положению дракона
        const dragonLeft = parseFloat(dragon.style.left) || DRAGON_START;
        const progressPercent = ((dragonLeft - DRAGON_START) / (DRAGON_MAX - DRAGON_START)) * 100;
        const index = Math.min(5, Math.floor(progressPercent / 20)); // 0..5
        stageDisplay.textContent = `${index}/5`;
        
        // Подсветка навигации
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
        const activeLink = document.querySelector(`.nav-link[data-section="${sections[index]}"]`);
        if (activeLink) activeLink.classList.add('active');
    }

    // ===== УСТАНОВКА ПОЗИЦИИ ПО СКРОЛЛУ (только вперёд) =====
    // ===== УСТАНОВКА ПОЗИЦИИ ПО СКРОЛЛУ (только вперёд) =====
    function updateDragonPositionFromScroll() {
        if (gameWon || isJumping) return;
        
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        
        // Процент прокрутки (0..100)
        const scrollPercent = (scrollY / (documentHeight - windowHeight)) * 100;
        
        // Обновляем максимальный достигнутый процент
        if (scrollPercent > maxScroll) {
            maxScroll = scrollPercent;
        }
        
        // Позиция дракона: от DRAGON_START до DRAGON_MAX
        const targetLeft = DRAGON_START + (maxScroll / 100) * (DRAGON_MAX - DRAGON_START);
        const currentLeft = parseFloat(dragon.style.left) || DRAGON_START;
        
        // Двигаем только вперёд
        if (targetLeft > currentLeft) {
            // Проверяем, не пересекаем ли мы какой-то непройденный кактус
            for (let i = 0; i < cactusPositions.length; i++) {
                if (cactusPassed[i]) continue;
                const cactusLeft = cactusPositions[i];
                // Если текущая позиция слева от кактуса, а целевая — справа (или на нём)
                if (currentLeft < cactusLeft && targetLeft >= cactusLeft) {
                    jumpOverCactus(i);  // прыгаем через этот кактус
                    return; // прыжок сам обновит позицию, выходим
                }
            }
            
            // Если не пересекли ни одного кактуса — плавно двигаемся
            dragon.style.left = Math.min(targetLeft, DRAGON_MAX) + '%';
            updateProgress();
        }
    }

    // ===== ПРЫЖОК ЧЕРЕЗ КАКТУС =====
    function jumpOverCactus(cactusIndex) {
        if (gameWon || isJumping || cactusPassed[cactusIndex]) return;
        
        isJumping = true;
        
        const cactusLeft = cactusPositions[cactusIndex];
        const dragonLeft = parseFloat(dragon.style.left) || DRAGON_START;
        
        // Цель – приземлиться после кактуса
        const targetLeft = cactusLeft + JUMP_OFFSET;
        
        dragon.classList.add('jump');
        
        const startLeft = dragonLeft;
        const startTime = performance.now();
        
        function animate(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / JUMP_DURATION, 1);
            
            const currentLeft = startLeft + (targetLeft - startLeft) * progress;
            dragon.style.left = Math.min(currentLeft, DRAGON_MAX) + '%';
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                dragon.classList.remove('jump');
                isJumping = false;
                
                // Отмечаем кактус пройденным
                cactusPassed[cactusIndex] = true;
                const cactus = document.querySelector(`.cactus[data-index="${cactusIndex}"]`);
                if (cactus) cactus.classList.add('passed');
                
                // Обновляем maxScroll, чтобы после прыжка дракон не откатился назад
                const newLeft = parseFloat(dragon.style.left);
                const newScrollPercent = ((newLeft - DRAGON_START) / (DRAGON_MAX - DRAGON_START)) * 100;
                if (newScrollPercent > maxScroll) {
                    maxScroll = newScrollPercent;
                }
                
                updateProgress();
            }
        }
        
        requestAnimationFrame(animate);
    }

    // ===== ПРОВЕРКА, НЕ ПОРА ЛИ ПРЫГНУТЬ (с защитой от проскока) =====
    function checkCollisions() {
        if (gameWon || isJumping) return;
        
        const dragonLeft = parseFloat(dragon.style.left) || DRAGON_START;
        
        for (let i = 0; i < cactusPositions.length; i++) {
            if (cactusPassed[i]) continue;
            
            const cactusLeft = cactusPositions[i];
            // Если дракон уже перелетел кактус (оказался справа от него) и кактус ещё не пройден
            if (dragonLeft > cactusLeft + 2) {
                // Принудительно отмечаем кактус пройденным (значит, проскочили)
                cactusPassed[i] = true;
                const cactus = document.querySelector(`.cactus[data-index="${i}"]`);
                if (cactus) cactus.classList.add('passed');
                continue;
            }
            
            // Если дракон подошёл к кактусу достаточно близко и ещё не перепрыгнул
            if (cactusLeft - dragonLeft < TRIGGER_DISTANCE && cactusLeft > dragonLeft) {
                jumpOverCactus(i);
                break; // Прыгаем только через один кактус за раз
            }
        }
    }

    // ===== ПОБЕДА =====
    function win() {
        if (gameWon) return;
        
        gameWon = true;
        dragon.classList.add('win');
        gameMessage.innerHTML = '🏆 ВЫ ПОБЕДИЛИ! 🏆';
        
        trophyContainer.style.display = 'block';
        dragon.style.left = DRAGON_MAX + '%';
        updateProgress();
        
        if (window.confetti) {
            confetti({
                particleCount: 200,
                spread: 100,
                origin: { y: 0.6 }
            });
        }
        
        console.log('🎉 ПОБЕДА НА КОНТАКТАХ!');
    }

    // ===== ПРОВЕРКА ПОБЕДЫ (ПО ДОСТИЖЕНИЮ КОНЦА) =====
    function checkWinCondition() {
        if (gameWon) return;
        
        const dragonLeft = parseFloat(dragon.style.left) || DRAGON_START;
        if (dragonLeft >= DRAGON_MAX - 1) { // почти у финиша
            win();
        }
    }

    // ===== СБРОС ПРИ ВОЗВРАТЕ НАВЕРХ =====
    function checkReset() {
        const scrollY = window.scrollY;
        
        if (scrollY < 50) {   // пользователь в самом верху
            gameWon = false;
            isJumping = false;
            maxScroll = 0;
            cactusPassed = [false, false, false, false];
            
            document.querySelectorAll('.cactus').forEach(c => c.classList.remove('passed'));
            dragon.classList.remove('win', 'jump');
            dragon.style.left = DRAGON_START + '%';
            gameMessage.innerHTML = '';
            trophyContainer.style.display = 'none';
            updateProgress();
        }
    }

    // ===== ОБРАБОТЧИК СКРОЛЛА =====
    function onScroll() {
        checkReset();
        if (!gameWon) {
            updateDragonPositionFromScroll();
            // Не вызываем checkCollisions здесь, чтобы не мешать анимации, но можно оставить для надёжности
            // Но чтобы избежать лишних вызовов, будем полагаться на интервал
        }
    }

    // ===== ИНТЕРВАЛ ДЛЯ ПОДСТРАХОВКИ =====
    setInterval(() => {
        if (!gameWon && !isJumping) {
            checkCollisions();
            checkWinCondition();
        }
    }, 100); // проверяем каждые 100 мс

    // ===== ПЛАВНЫЙ СКРОЛЛ ПО КЛИКУ =====
    document.querySelectorAll('.nav-link, .btn-primary').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    window.scrollTo({
                        top: target.offsetTop - 180,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // ===== ПОДКЛЮЧАЕМ КОНФЕТТИ =====
    if (!window.confetti) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1';
        document.head.appendChild(script);
    }

    // ===== СТАРТ =====
    createCacti();
    dragon.style.left = DRAGON_START + '%';
    updateProgress();
    
    window.addEventListener('scroll', () => {
        requestAnimationFrame(onScroll);
    });
    
    console.log('🔥 Дракон едет только вперёд и перепрыгивает кактусы!');
    console.log('🛡️ Добавлена защита от быстрого скролла');
});