document.addEventListener('DOMContentLoaded', () => {
    const lottoNumbersDiv = document.getElementById('lotto-numbers');
    const generateBtn = document.getElementById('generate-btn');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const body = document.body;

    // Theme switcher logic
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            body.classList.add('dark-mode');
            themeToggleBtn.textContent = '☀️';
        } else {
            body.classList.remove('dark-mode');
            themeToggleBtn.textContent = '🌙';
        }
    };

    themeToggleBtn.addEventListener('click', () => {
        const isDarkMode = body.classList.contains('dark-mode');
        const newTheme = isDarkMode ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    });

    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);


    // Lotto generator logic
    const getNumberColor = (number) => {
        if (number <= 10) return '#f39c12'; // 주황색
        if (number <= 20) return '#3498db'; // 파란색
        if (number <= 30) return '#e74c3c'; // 빨간색
        if (number <= 40) return '#9b59b6'; // 보라색
        return '#2ecc71'; // 녹색
    };

    const generateNumbers = () => {
        generateBtn.disabled = true;
        lottoNumbersDiv.innerHTML = '';
        for (let i = 0; i < 6; i++) {
            const placeholder = document.createElement('span');
            placeholder.className = 'placeholder';
            placeholder.textContent = '?';
            lottoNumbersDiv.appendChild(placeholder);
        }

        const numbers = new Set();
        while (numbers.size < 6) {
            numbers.add(Math.floor(Math.random() * 45) + 1);
        }
        
        const sortedNumbers = [...numbers].sort((a, b) => a - b);
        
        const placeholders = lottoNumbersDiv.querySelectorAll('.placeholder');

        sortedNumbers.forEach((number, index) => {
            setTimeout(() => {
                const numberDiv = placeholders[index];
                numberDiv.className = 'number';
                numberDiv.textContent = number;
                numberDiv.style.backgroundColor = getNumberColor(number);
                numberDiv.style.transform = 'scale(0)';
                requestAnimationFrame(() => {
                    numberDiv.style.transform = 'scale(1)';
                });
            }, index * 300);
        });
        
        setTimeout(() => {
            generateBtn.disabled = false;
        }, 6 * 300);
    };

    generateBtn.addEventListener('click', generateNumbers);
});
