document.addEventListener('DOMContentLoaded', () => {
    const dragon = document.getElementById('dragon');
    const cactusContainer = document.getElementById('cactusContainer');
    const trophyContainer = document.getElementById('trophyContainer');
    const stageDisplay = document.getElementById('stageDisplay');
    const gameMessage = document.getElementById('gameMessage');

    const sections = ['python', 'how', 'where', 'reviews', 'scores', 'contacts'];
    
    // Состояние
    let gameWon = false;
    let isJumping = false;
    let isSimulating = false; 
    let maxScroll = 0; 
    
    const cactusPositions = [20, 35, 50, 65];
    let cactusPassed = [false, false, false, false];

    const DRAGON_START = 5;
    const DRAGON_MAX = 80;
    const JUMP_OFFSET = 7;       
    const JUMP_DURATION = 450;     
    const TRIGGER_DISTANCE = 4;   

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

    function updateProgress() {
        const dragonLeft = parseFloat(dragon.style.left) || DRAGON_START;
        const progressPercent = ((dragonLeft - DRAGON_START) / (DRAGON_MAX - DRAGON_START)) * 100;
        const index = Math.min(5, Math.floor(progressPercent / 20)); // 0..5
        stageDisplay.textContent = `${index}/5`;
        
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
        const activeLink = document.querySelector(`.nav-link[data-section="${sections[index]}"]`);
        if (activeLink) activeLink.classList.add('active');
    }

    function updateDragonPositionFromScroll() {
        if (gameWon || isJumping || isSimulating) return;
        
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        
        const scrollPercent = (scrollY / (documentHeight - windowHeight)) * 100;
        
        if (scrollPercent > maxScroll) {
            maxScroll = scrollPercent;
        }
        
        const targetLeft = DRAGON_START + (maxScroll / 100) * (DRAGON_MAX - DRAGON_START);
        const currentLeft = parseFloat(dragon.style.left) || DRAGON_START;
        
        if (targetLeft > currentLeft) {
            for (let i = 0; i < cactusPositions.length; i++) {
                if (cactusPassed[i]) continue;
                const cactusLeft = cactusPositions[i];
                if (currentLeft < cactusLeft && targetLeft >= cactusLeft) {
                    jumpOverCactus(i);  
                    return; 
                }
            }
            
            dragon.style.left = Math.min(targetLeft, DRAGON_MAX) + '%';
            updateProgress();
        }
    }

    function jumpOverCactus(cactusIndex) {
        if (gameWon || isJumping || cactusPassed[cactusIndex]) return;
        
        isJumping = true;
        
        const cactusLeft = cactusPositions[cactusIndex];
        const dragonLeft = parseFloat(dragon.style.left) || DRAGON_START;
        
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
                
                cactusPassed[cactusIndex] = true;
                const cactus = document.querySelector(`.cactus[data-index="${cactusIndex}"]`);
                if (cactus) cactus.classList.add('passed');               
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

    function checkCollisions() {
        if (gameWon || isJumping || isSimulating) return;
        
        const dragonLeft = parseFloat(dragon.style.left) || DRAGON_START;
        
        for (let i = 0; i < cactusPositions.length; i++) {
            if (cactusPassed[i]) continue;
            
            const cactusLeft = cactusPositions[i];
            if (dragonLeft > cactusLeft + 2) {
                cactusPassed[i] = true;
                const cactus = document.querySelector(`.cactus[data-index="${i}"]`);
                if (cactus) cactus.classList.add('passed');
                continue;
            }
            
            if (cactusLeft - dragonLeft < TRIGGER_DISTANCE && cactusLeft > dragonLeft) {
                jumpOverCactus(i);
                break; 
            }
        }
    }

    function simulateRunToContacts() {
        if (gameWon || isSimulating) return;
        
        isSimulating = true;
        
        let indices = [];
        for (let i = 0; i < cactusPositions.length; i++) {
            if (!cactusPassed[i]) indices.push(i);
        }
        
        function processNext() {
            if (indices.length === 0) {
                win();
                isSimulating = false;
                return;
            }
            
            const nextIdx = indices.shift();
            jumpOverCactus(nextIdx);
            
            const checkInterval = setInterval(() => {
                if (!isJumping) {
                    clearInterval(checkInterval);
                    processNext();
                }
            }, 50);
        }
        
        processNext();
    }

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

    function checkWinCondition() {
        if (gameWon || isSimulating) return;
        
        const dragonLeft = parseFloat(dragon.style.left) || DRAGON_START;
        if (dragonLeft >= DRAGON_MAX - 1) { 
            win();
        }
    }

    function checkReset() {
        const scrollY = window.scrollY;
        
        if (scrollY < 50) { 
            gameWon = false;
            isJumping = false;
            isSimulating = false;
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

    function onScroll() {
        checkReset();
        if (!gameWon && !isSimulating) {
            updateDragonPositionFromScroll();
        }
    }

    setInterval(() => {
        if (!gameWon && !isJumping && !isSimulating) {
            checkCollisions();
            checkWinCondition();
        }
    }, 100);

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
                    if (link.classList.contains('btn-primary') && href === '#contacts') {
                        setTimeout(simulateRunToContacts, 500);
                    }
                }
            }
        });
    });

    if (!window.confetti) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1';
        document.head.appendChild(script);
    }

    createCacti();
    dragon.style.left = DRAGON_START + '%';
    updateProgress();
    
    window.addEventListener('scroll', () => {
        requestAnimationFrame(onScroll);
    });
    
    console.log('🔥 Дракон едет только вперёд и перепрыгивает кактусы!');
    console.log('🛡️ Добавлена защита от быстрого скролла');
    console.log('🎮 При клике на "Занятия" дракон сам пробежит дистанцию');
});