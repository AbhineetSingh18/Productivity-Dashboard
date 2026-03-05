/* ── THEME SWITCHER ─────────────────────────────────────── */
const themes = [
    { key: 'walnut', name: 'Warm Walnut', icon: 'ri-sun-fill' },
    { key: 'midnight', name: 'Midnight Ink', icon: 'ri-moon-fill' },
    { key: 'forest', name: 'Forest Moss', icon: 'ri-leaf-fill' },
    { key: 'rose', name: 'Rose Dusk', icon: 'ri-heart-fill' },
    { key: 'arctic', name: 'Arctic Light', icon: 'ri-sun-cloudy-fill' },
];

let themeIdx = Number(localStorage.getItem('themeIdx') || 0);

function applyTheme(idx) {
    document.documentElement.setAttribute('data-theme', themes[idx].key);
    document.querySelector('.theme-label').textContent = themes[idx].name;
    document.querySelector('.theme i').className = themes[idx].icon;
    localStorage.setItem('themeIdx', idx);
}

applyTheme(themeIdx);

document.querySelector('.theme').addEventListener('click', () => {
    // Animate icon spin
    const icon = document.querySelector('.theme i');
    icon.style.transform = 'rotate(360deg) scale(0)';
    icon.style.transition = 'transform 0.3s ease';
    setTimeout(() => {
        themeIdx = (themeIdx + 1) % themes.length;
        applyTheme(themeIdx);
        icon.style.transform = 'rotate(0deg) scale(1)';
    }, 150);
    setTimeout(() => { icon.style.transition = ''; }, 450);
});


/* ── PANEL OPEN / CLOSE ─────────────────────────────────── */
function openFeatures() {
    const allElems = document.querySelectorAll('.elem');
    const fullElemPages = document.querySelectorAll('.fullElem');
    const backBtns = document.querySelectorAll('.fullElem .back');

    allElems.forEach(elem => {
        elem.addEventListener('click', () => {
            const idx = Number(elem.dataset.index);
            const page = fullElemPages[idx];
            page.classList.remove('is-closing');
            page.style.display = 'block';
            // Force reflow so animation triggers
            page.offsetWidth;
            page.classList.add('is-open');
            document.body.style.overflow = 'hidden';
        });
    });

    backBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = Number(btn.dataset.index);
            const page = fullElemPages[idx];
            page.classList.add('is-closing');
            page.classList.remove('is-open');
            document.body.style.overflow = '';
            setTimeout(() => {
                page.style.display = 'none';
                page.classList.remove('is-closing');
            }, 280);
        });
    });
}
openFeatures();


/* ── TO-DO LIST ─────────────────────────────────────────── */
function todoList() {
    let tasks = [];

    try {
        tasks = JSON.parse(localStorage.getItem('currentTask')) || [];
    } catch { tasks = []; }

    const allTaskEl = document.querySelector('.allTask');

    function renderTasks() {
        if (tasks.length === 0) {
            allTaskEl.innerHTML = `
                <div class="task-empty-state">
                    <i class="ri-check-double-line"></i>
                    <p>All clear! Add your first task.</p>
                </div>`;
            localStorage.setItem('currentTask', JSON.stringify(tasks));
            return;
        }

        allTaskEl.innerHTML = tasks.map((t, i) => `
            <div class="task ${t.imp ? 'is-important' : ''}">
                <h5>
                    ${escapeHtml(t.task)}
                    ${t.imp ? '<span class="imp-badge">Important</span>' : ''}
                </h5>
                <button class="done-btn" data-i="${i}">Done ✓</button>
            </div>
        `).join('');

        localStorage.setItem('currentTask', JSON.stringify(tasks));

        allTaskEl.querySelectorAll('.done-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const i = Number(btn.dataset.i);
                // Fade out animation
                btn.closest('.task').style.opacity = '0';
                btn.closest('.task').style.transform = 'translateX(20px)';
                btn.closest('.task').style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                setTimeout(() => {
                    tasks.splice(i, 1);
                    renderTasks();
                }, 280);
            });
        });
    }

    renderTasks();

    const form = document.querySelector('.addTask form');
    const taskInput = document.querySelector('#task-input');
    const detailInput = document.querySelector('.addTask form textarea');
    const checkbox = document.querySelector('#check');

    form.addEventListener('submit', e => {
        e.preventDefault();
        if (!taskInput.value.trim()) return;
        tasks.push({
            task: taskInput.value.trim(),
            details: detailInput.value.trim(),
            imp: checkbox.checked,
        });
        renderTasks();
        taskInput.value = '';
        detailInput.value = '';
        checkbox.checked = false;
        // Scroll to latest
        allTaskEl.scrollTo({ top: allTaskEl.scrollHeight, behavior: 'smooth' });
    });
}
todoList();


/* ── DAILY PLANNER ──────────────────────────────────────── */
function dailyPlanner() {
    const dayPlanner = document.querySelector('.day-planner');
    let dayPlanData = {};

    try {
        dayPlanData = JSON.parse(localStorage.getItem('dayPlanData')) || {};
    } catch { dayPlanData = {}; }

    // 6:00 AM → 11:00 PM (18 slots)
    const hours = Array.from({ length: 18 }, (_, i) => {
        const h1 = 6 + i;
        const h2 = 7 + i;
        const fmt = h => h > 12 ? `${h - 12}:00 ${h >= 12 ? 'PM' : 'AM'}` : `${h}:00 ${h >= 12 ? 'PM' : 'AM'}`;
        return { label: fmt(h1), idx: i };
    });

    dayPlanner.innerHTML = hours.map(({ label, idx }) => `
        <div class="day-planner-time">
            <span class="time-badge">${label}</span>
            <input id="dp-${idx}" type="text"
                   placeholder="What's planned?"
                   value="${escapeAttr(dayPlanData[idx] || '')}">
        </div>
    `).join('');

    dayPlanner.querySelectorAll('input').forEach(input => {
        const i = input.id.replace('dp-', '');
        input.addEventListener('input', () => {
            dayPlanData[i] = input.value;
            localStorage.setItem('dayPlanData', JSON.stringify(dayPlanData));
        });
    });
}
dailyPlanner();


/* ── MOTIVATION QUOTE ───────────────────────────────────── */
function motivationalQuote() {
    const quoteEl = document.querySelector('.motivation-2 h1');
    const authorEl = document.querySelector('.motivation-3 h2');
    const refreshBtn = document.querySelector('.refresh-quote');

    async function fetchQuote() {
        quoteEl.style.opacity = '0';
        authorEl.style.opacity = '0';
        try {
            const res = await fetch('https://dummyjson.com/quotes/random');
            const data = await res.json();
            setTimeout(() => {
                quoteEl.textContent = `"${data.quote}"`;
                authorEl.textContent = `— ${data.author}`;
                quoteEl.style.transition = 'opacity 0.5s ease';
                authorEl.style.transition = 'opacity 0.5s ease';
                quoteEl.style.opacity = '1';
                authorEl.style.opacity = '1';
            }, 250);
        } catch {
            quoteEl.textContent = '"The secret of getting ahead is getting started."';
            authorEl.textContent = '— Mark Twain';
            quoteEl.style.opacity = '1';
            authorEl.style.opacity = '1';
        }
    }

    fetchQuote();
    refreshBtn.addEventListener('click', fetchQuote);
}
motivationalQuote();


/* ── POMODORO TIMER ─────────────────────────────────────── */
function pomodoroTimer() {
    const display = document.querySelector('.pomo-display');
    const sessionEl = document.querySelector('.pomodoro-fullpage .session');
    const startBtn = document.querySelector('.start-timer');
    const pauseBtn = document.querySelector('.pause-timer');
    const resetBtn = document.querySelector('.reset-timer');
    const ring = document.querySelector('.ring-progress');
    const subText = document.querySelector('.pomo-sub');

    const CIRCUMFERENCE = 2 * Math.PI * 100; // 628.32
    const WORK_SECS = 25 * 60;
    const BREAK_SECS = 5 * 60;

    let isWork = true;
    let totalSeconds = WORK_SECS;
    let interval = null;

    ring.style.strokeDasharray = CIRCUMFERENCE;
    ring.style.strokeDashoffset = 0;

    function pad(n) { return String(n).padStart(2, '0'); }

    function updateDisplay() {
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        display.textContent = `${pad(m)}:${pad(s)}`;

        const total = isWork ? WORK_SECS : BREAK_SECS;
        const progress = totalSeconds / total;
        ring.style.strokeDashoffset = CIRCUMFERENCE * (1 - progress);
    }

    function setSession(work) {
        isWork = work;
        if (work) {
            sessionEl.textContent = 'Work Session';
            sessionEl.classList.remove('break-mode');
            subText.textContent = 'Stay focused';
        } else {
            sessionEl.textContent = 'Break Time';
            sessionEl.classList.add('break-mode');
            subText.textContent = 'Take a breath';
        }
        totalSeconds = work ? WORK_SECS : BREAK_SECS;
        updateDisplay();
    }

    function startTimer() {
        if (interval) return; // already running
        interval = setInterval(() => {
            if (totalSeconds > 0) {
                totalSeconds--;
                updateDisplay();
            } else {
                clearInterval(interval);
                interval = null;
                setSession(!isWork);
            }
        }, 1000);
    }

    function pauseTimer() {
        clearInterval(interval);
        interval = null;
    }

    function resetTimer() {
        pauseTimer();
        setSession(true);
    }

    startBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    resetBtn.addEventListener('click', resetTimer);

    updateDisplay();
}
pomodoroTimer();


/* ── DAILY GOALS ─────────────────────────────────────────── */
function dailyGoals() {
    let goals = [];
    try { goals = JSON.parse(localStorage.getItem('dailyGoals')) || []; }
    catch { goals = []; }

    const list = document.querySelector('.goals-list');
    const form = document.querySelector('.goals-form');
    const goalInput = document.querySelector('.goals-input');

    function saveAndRender() {
        localStorage.setItem('dailyGoals', JSON.stringify(goals));
        renderGoals();
    }

    function renderGoals() {
        if (goals.length === 0) {
            list.innerHTML = `
                <div class="goals-empty">
                    <i class="ri-target-line"></i>
                    <p>No goals yet. Set one!</p>
                </div>`;
            return;
        }

        list.innerHTML = goals.map((g, i) => `
            <div class="goal-item ${g.done ? 'done' : ''}">
                <button class="goal-check" data-i="${i}">
                    <i class="${g.done ? 'ri-checkbox-circle-fill' : 'ri-circle-line'}"></i>
                </button>
                <span class="goal-text">${escapeHtml(g.text)}</span>
                <button class="goal-delete" data-i="${i}" title="Delete">
                    <i class="ri-delete-bin-line"></i>
                </button>
            </div>
        `).join('');

        list.querySelectorAll('.goal-check').forEach(btn => {
            btn.addEventListener('click', () => {
                goals[Number(btn.dataset.i)].done = !goals[Number(btn.dataset.i)].done;
                saveAndRender();
            });
        });

        list.querySelectorAll('.goal-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const item = btn.closest('.goal-item');
                item.style.opacity = '0';
                item.style.transform = 'translateX(20px)';
                item.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
                setTimeout(() => {
                    goals.splice(Number(btn.dataset.i), 1);
                    saveAndRender();
                }, 250);
            });
        });
    }

    renderGoals();

    form.addEventListener('submit', e => {
        e.preventDefault();
        if (!goalInput.value.trim()) return;
        goals.push({ text: goalInput.value.trim(), done: false });
        goalInput.value = '';
        saveAndRender();
    });
}
dailyGoals();


/* ── WEATHER & CLOCK ─────────────────────────────────────── */
function weatherFunctionality() {
    const apiKey = 'd8be0f40543e4df89d7155915261702';
    var city = prompt("Enter your city in India: ");
    city = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();

    const timeEl = document.querySelector('.header-time');
    const dateEl = document.querySelector('.header-date');
    const tempEl = document.querySelector('.header-temp');
    const condEl = document.querySelector('.header-cond');
    const precipEl = document.querySelector('.precipitation');
    const humEl = document.querySelector('.humidity');
    const windEl = document.querySelector('.wind');
    const location = document.querySelector('.header-loc');

    location.innerHTML = `${city}, India`;

    async function fetchWeather() {
        try {
            const res = await fetch(`http://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}`);
            const data = await res.json();
            tempEl.textContent = `${data.current.temp_c}°C`;
            condEl.textContent = data.current.condition.text;
            precipEl.textContent = `🌡 ${data.current.heatindex_c}°C`;
            humEl.textContent = `💧 ${data.current.humidity}%`;
            windEl.textContent = `💨 ${data.current.wind_kph} km/h`;
        } catch {
            tempEl.textContent = '--°C';
            condEl.textContent = '';
        }
    }
    fetchWeather();

    const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    function tick() {
        const d = new Date();
        const h = d.getHours();
        const m = d.getMinutes();
        const s = d.getSeconds();
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        const pad = n => String(n).padStart(2, '0');

        timeEl.textContent = `${DAYS[d.getDay()]}, ${pad(h12)}:${pad(m)}:${pad(s)} ${ampm}`;
        dateEl.textContent = `${d.getDate()} ${MONTHS[d.getMonth()]}, ${d.getFullYear()}`;
    }

    tick();
    setInterval(tick, 1000);
}
weatherFunctionality();


/* ── UTILS ───────────────────────────────────────────────── */
function escapeHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
function escapeAttr(s) {
    return String(s).replace(/"/g, '&quot;');
}