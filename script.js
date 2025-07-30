// Study Scheduler Application
class StudyScheduler {
    constructor() {
        this.studyPlans = [];
        this.studySessions = [];
        this.timerMinutes = 25;
        this.timerSeconds = 0;
        this.isRunning = false;
        this.currentSessionStart = null;
        this.timerInterval = null;
        
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.updateDisplay();
    }

    // Event Listeners
    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Plan form
        document.getElementById('plan-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createPlan();
        });

        // Session form
        document.getElementById('session-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSession();
        });

        // Timer controls
        document.getElementById('start-timer').addEventListener('click', () => this.startTimer());
        document.getElementById('pause-timer').addEventListener('click', () => this.pauseTimer());
        document.getElementById('reset-timer').addEventListener('click', () => this.resetTimer());
    }

    // Tab switching
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab panels
        document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
        document.getElementById(tabName).classList.add('active');

        // Update display for the current tab
        this.updateDisplay();
    }

    // Data persistence
    saveData() {
        try {
            localStorage.setItem('studyPlans', JSON.stringify(this.studyPlans));
            localStorage.setItem('studySessions', JSON.stringify(this.studySessions));
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }

    loadData() {
        try {
            const plans = JSON.parse(localStorage.getItem('studyPlans')) || [];
            const sessions = JSON.parse(localStorage.getItem('studySessions')) || [];
            this.studyPlans = plans;
            this.studySessions = sessions;
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    // Study plan functions
    createPlan() {
        const title = document.getElementById('plan-title').value;
        const subject = document.getElementById('plan-subject').value;
        const goal = document.getElementById('plan-goal').value;
        const deadline = document.getElementById('plan-deadline').value;
        const hours = document.getElementById('plan-hours').value;
        const priority = document.getElementById('plan-priority').value;

        if (!title || !subject || !deadline || !hours) {
            alert('Please fill in all required fields');
            return;
        }

        const plan = {
            id: Date.now(),
            title,
            subject,
            goal,
            deadline,
            estimatedHours: parseInt(hours),
            completedHours: 0,
            priority,
            createdAt: new Date().toISOString()
        };

        this.studyPlans.push(plan);
        this.saveData();
        this.clearPlanForm();
        this.updateDisplay();
    }

    deletePlan(id) {
        if (confirm('Are you sure you want to delete this plan?')) {
            this.studyPlans = this.studyPlans.filter(plan => plan.id !== id);
            this.saveData();
            this.updateDisplay();
        }
    }

    clearPlanForm() {
        document.getElementById('plan-form').reset();
        document.getElementById('plan-priority').value = 'medium';
    }

    // Timer functions
    startTimer() {
        this.isRunning = true;
        this.currentSessionStart = new Date();
        
        document.getElementById('start-timer').style.display = 'none';
        document.getElementById('pause-timer').style.display = 'inline-block';

        this.timerInterval = setInterval(() => {
            if (this.timerSeconds === 0) {
                if (this.timerMinutes === 0) {
                    this.resetTimer();
                    alert('Study session completed! 🎉');
                    return;
                }
                this.timerMinutes--;
                this.timerSeconds = 59;
            } else {
                this.timerSeconds--;
            }
            this.updateTimerDisplay();
        }, 1000);
    }

    pauseTimer() {
        this.isRunning = false;
        clearInterval(this.timerInterval);
        
        document.getElementById('start-timer').style.display = 'inline-block';
        document.getElementById('pause-timer').style.display = 'none';
    }

    resetTimer() {
        this.isRunning = false;
        this.timerMinutes = 25;
        this.timerSeconds = 0;
        clearInterval(this.timerInterval);
        
        document.getElementById('start-timer').style.display = 'inline-block';
        document.getElementById('pause-timer').style.display = 'none';
        
        this.updateTimerDisplay();
    }

    updateTimerDisplay() {
        const display = `${this.timerMinutes.toString().padStart(2, '0')}:${this.timerSeconds.toString().padStart(2, '0')}`;
        document.getElementById('timer-display').textContent = display;
    }

    // Session functions
    saveSession() {
        const subject = document.getElementById('session-subject').value;
        const notes = document.getElementById('session-notes').value;

        if (!subject) {
            alert('Please enter the subject you studied');
            return;
        }

        const studyTime = this.currentSessionStart ? 
            Math.round((new Date() - this.currentSessionStart) / (1000 * 60)) : 25;

        const session = {
            id: Date.now(),
            subject,
            notes,
            duration: studyTime,
            date: new Date().toISOString().split('T')[0],
            timestamp: new Date().toISOString()
        };

        this.studySessions.push(session);

        // Update related study plan
        this.studyPlans = this.studyPlans.map(plan => {
            if (plan.subject.toLowerCase() === subject.toLowerCase() || 
                plan.title.toLowerCase().includes(subject.toLowerCase())) {
                return {
                    ...plan,
                    completedHours: plan.completedHours + Math.round(studyTime / 60 * 10) / 10
                };
            }
            return plan;
        });

        this.saveData();
        this.clearSessionForm();
        this.currentSessionStart = null;
        
        alert(`Study session saved! Duration: ${studyTime} minutes`);
        this.updateDisplay();
    }

    clearSessionForm() {
        document.getElementById('session-form').reset();
    }

    // Analytics functions
    calculateStreak() {
        const dates = [...new Set(this.studySessions.map(s => s.date))].sort().reverse();
        let streak = 0;
        
        for (let i = 0; i < dates.length; i++) {
            const expectedDate = new Date();
            expectedDate.setDate(expectedDate.getDate() - i);
            
            if (dates[i] === expectedDate.toISOString().split('T')[0]) {
                streak++;
            } else {
                break;
            }
        }
        
        return streak;
    }

    formatTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    }

    getTodayStats() {
        const today = new Date().toISOString().split('T')[0];
        const todaySessions = this.studySessions.filter(s => s.date === today);
        return todaySessions.reduce((sum, s) => sum + s.duration, 0);
    }

    getAnalyticsStats() {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        const weekSessions = this.studySessions.filter(s => new Date(s.timestamp) >= weekAgo);
        const monthSessions = this.studySessions.filter(s => new Date(s.timestamp) >= monthAgo);
        
        const weekMinutes = weekSessions.reduce((sum, s) => sum + s.duration, 0);
        const monthMinutes = monthSessions.reduce((sum, s) => sum + s.duration, 0);
        
        const avgMinutes = this.studySessions.length > 0 ? 
            this.studySessions.reduce((sum, s) => sum + s.duration, 0) / 
            Math.max(1, [...new Set(this.studySessions.map(s => s.date))].length) : 0;

        const dayStats = {};
        this.studySessions.forEach(session => {
            const day = new Date(session.timestamp).toLocaleDateString('en-US', { weekday: 'long' });
            dayStats[day] = (dayStats[day] || 0) + session.duration;
        });
        
        const bestDay = Object.keys(dayStats).reduce((a, b) => dayStats[a] > dayStats[b] ? a : b, '-');

        return { weekMinutes, monthMinutes, avgMinutes, bestDay };
    }

    getSubjectStats() {
        const subjectStats = {};
        this.studySessions.forEach(session => {
            subjectStats[session.subject] = (subjectStats[session.subject] || 0) + session.duration;
        });
        return Object.entries(subjectStats).sort(([,a], [,b]) => b - a);
    }

    // Display update functions
    updateDisplay() {
        this.updateDashboard();
        this.updatePlansList();
        this.updateAnalytics();
        this.updateTimerDisplay();
    }

    updateDashboard() {
        const todayMinutes = this.getTodayStats();
        const totalMinutes = this.studySessions.reduce((sum, s) => sum + s.duration, 0);
        const streak = this.calculateStreak();

        document.getElementById('today-progress').textContent = this.formatTime(todayMinutes);
        document.getElementById('study-streak').textContent = `${streak} days`;
        document.getElementById('total-time').textContent = this.formatTime(totalMinutes);
        document.getElementById('active-plans').textContent = this.studyPlans.length;

        // Update progress bar
        const progressBar = document.getElementById('today-progress-bar');
        const progressPercentage = Math.min((todayMinutes / 240) * 100, 100);
        progressBar.style.width = `${progressPercentage}%`;

        // Update recent sessions
        this.updateRecentSessions();
    }

    updateRecentSessions() {
        const container = document.getElementById('recent-sessions');
        const recentSessions = this.studySessions.slice(-5).reverse();

        if (recentSessions.length === 0) {
            container.innerHTML = '<p class="empty-state">No study sessions yet. Start your first session!</p>';
            return;
        }

        container.innerHTML = recentSessions.map(session => `
            <div class="session-card">
                <h4 class="session-subject">${session.subject}</h4>
                <p class="session-notes">${session.notes || 'No notes'}</p>
                <div class="session-meta">
                    <span>📅 ${new Date(session.timestamp).toLocaleDateString()}</span>
                    <span>⏱️ ${session.duration} minutes</span>
                </div>
            </div>
        `).join('');
    }

    updatePlansList() {
        const container = document.getElementById('plans-list');

        if (this.studyPlans.length === 0) {
            container.innerHTML = '<p class="empty-state">No study plans yet. Create your first plan above!</p>';
            return;
        }

        container.innerHTML = this.studyPlans.map(plan => {
            const progress = Math.min((plan.completedHours / plan.estimatedHours) * 100, 100);
            const daysLeft = Math.ceil((new Date(plan.deadline) - new Date()) / (1000 * 60 * 60 * 24));
            
            return `
                <div class="plan-card">
                    <h4 class="plan-title">${plan.title}</h4>
                    <p class="plan-subject"><strong>Subject:</strong> ${plan.subject}</p>
                    <p class="plan-goal">${plan.goal}</p>
                    
                    <div class="plan-progress">
                        <div class="plan-progress-fill" style="width: ${progress}%"></div>
                    </div>
                    
                    <div class="plan-meta">
                        <span class="plan-hours">${plan.completedHours}h / ${plan.estimatedHours}h completed</span>
                        <span class="priority-badge priority-${plan.priority}">
                            ${plan.priority} priority
                        </span>
                        <span class="plan-deadline">
                            ${daysLeft > 0 ? `${daysLeft} days left` : 'Overdue'}
                        </span>
                        <button class="delete-button" onclick="scheduler.deletePlan(${plan.id})">
                            Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateAnalytics() {
        const { weekMinutes, monthMinutes, avgMinutes, bestDay } = this.getAnalyticsStats();
        const subjectStats = this.getSubjectStats();

        document.getElementById('week-time').textContent = this.formatTime(weekMinutes);
        document.getElementById('month-time').textContent = this.formatTime(monthMinutes);
        document.getElementById('avg-time').textContent = this.formatTime(Math.round(avgMinutes));
        document.getElementById('best-day').textContent = bestDay;

        // Update subjects breakdown
        const subjectsContainer = document.getElementById('subjects-breakdown');
        
        if (subjectStats.length === 0) {
            subjectsContainer.innerHTML = '<div class="empty-state full-width">No study data available yet.</div>';
            return;
        }

        subjectsContainer.innerHTML = subjectStats.map(([subject, minutes]) => `
            <div class="subject-card">
                <h4 class="subject-name">${subject}</h4>
                <div class="subject-time">${this.formatTime(minutes)}</div>
            </div>
        `).join('');
    }
}

// Initialize the application
let scheduler;
document.addEventListener('DOMContentLoaded', () => {
    scheduler = new StudyScheduler();
});