// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand();
tg.MainButton.setText("Создать розыгрыш");
tg.MainButton.show();

// Глобальные переменные
let currentTab = 0;
const tabs = document.querySelectorAll('.tab-content');
const tabButtons = document.querySelectorAll('.tab');
let giveawayData = {
    giveaway_type: 'normal',
    channel: '',
    winners_count: 1,
    days: 0,
    hours: 1,
    minutes: 0,
    requirements: [],
    prize: '',
    hashtags: '',
    image_data: null
};

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    updatePreview();
});

// Инициализация приложения
function initializeApp() {
    // Настройка начального состояния
    setupNumberInputs();
    setupTimeInputs();
    setupRequirements();
    setupImageUpload();
    showTab(currentTab);
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Переключение вкладок
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            showTabById(tabId);
        });
    });

    // Навигация по вкладкам
    document.getElementById('prevTab').addEventListener('click', prevTab);
    document.getElementById('nextTab').addEventListener('click', nextTab);

    // Создание розыгрыша
    document.getElementById('createGiveaway').addEventListener('click', createGiveaway);
    tg.MainButton.onClick(createGiveaway);

    // Тип розыгрыша
    document.querySelectorAll('input[name="giveawayType"]').forEach(radio => {
        radio.addEventListener('change', function() {
            giveawayData.giveaway_type = this.value;
            updateTypeSettings();
            updatePreview();
        });
    });

    // Канал
    document.getElementById('channel').addEventListener('input', function() {
        giveawayData.channel = this.value;
        updatePreview();
    });

    // Победители
    document.getElementById('winnersCount').addEventListener('input', function() {
        giveawayData.winners_count = parseInt(this.value);
        updatePreview();
    });

    // Время
    document.getElementById('days').addEventListener('input', function() {
        giveawayData.days = parseInt(this.value);
        updatePreview();
    });
    document.getElementById('hours').addEventListener('input', function() {
        giveawayData.hours = parseInt(this.value);
        updatePreview();
    });
    document.getElementById('minutes').addEventListener('input', function() {
        giveawayData.minutes = parseInt(this.value);
        updatePreview();
    });

    // Приз
    document.getElementById('prize').addEventListener('input', function() {
        giveawayData.prize = this.value;
        updatePreview();
    });

    // Хештеги
    document.getElementById('hashtags').addEventListener('input', function() {
        giveawayData.hashtags = this.value;
    });

    // Обновление предпросмотра
    document.getElementById('refreshPreview').addEventListener('click', updatePreview);
}

// Настройка числовых полей
function setupNumberInputs() {
    document.querySelectorAll('.btn-number').forEach(button => {
        button.addEventListener('click', function() {
            const action = this.getAttribute('data-action');
            const input = this.parentElement.querySelector('input[type="number"]');
            let value = parseInt(input.value);
            
            if (action === 'increase') {
                value = Math.min(value + 1, parseInt(input.max || 100));
            } else {
                value = Math.max(value - 1, parseInt(input.min || 1));
            }
            
            input.value = value;
            
            // Обновляем данные
            if (input.id === 'winnersCount') {
                giveawayData.winners_count = value;
                updatePreview();
            }
            
            input.dispatchEvent(new Event('input'));
        });
    });
}

// Настройка полей времени
function setupTimeInputs() {
    ['days', 'hours', 'minutes'].forEach(id => {
        const input = document.getElementById(id);
        input.addEventListener('change', function() {
            let value = parseInt(this.value) || 0;
            const max = id === 'days' ? 30 : (id === 'hours' ? 23 : 59);
            
            if (value < 0) value = 0;
            if (value > max) value = max;
            
            this.value = value;
            giveawayData[id] = value;
            updatePreview();
        });
    });
}

// Настройка условий
function setupRequirements() {
    const addButton = document.getElementById('addRequirement');
    const list = document.getElementById('requirementsList');
    
    // Добавление условия
    addButton.addEventListener('click', function() {
        addRequirementField();
    });
    
    // Начальное условие
    addRequirementField();
    
    // Обработка удаления
    document.addEventListener('click', function(e) {
        if (e.target.closest('.btn-remove-requirement')) {
            const item = e.target.closest('.requirement-item');
            if (document.querySelectorAll('.requirement-item').length > 1) {
                item.remove();
                updateRequirements();
            }
        }
    });
    
    // Обработка ввода
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('requirement-input')) {
            updateRequirements();
        }
    });
}

// Добавление поля условия
function addRequirementField() {
    const list = document.getElementById('requirementsList');
    const item = document.createElement('div');
    item.className = 'requirement-item';
    item.innerHTML = `
        <input type="text" class="requirement-input" placeholder="Например: Подписаться на канал">
        <button type="button" class="btn-remove-requirement">
            <i class="fas fa-times"></i>
        </button>
    `;
    list.appendChild(item);
}

// Обновление списка условий
function updateRequirements() {
    const inputs = document.querySelectorAll('.requirement-input');
    giveawayData.requirements = Array.from(inputs)
        .map(input => input.value.trim())
        .filter(value => value.length > 0);
    
    updatePreview();
}

// Настройка загрузки изображений
function setupImageUpload() {
    const uploadInput = document.getElementById('imageUpload');
    const preview = document.getElementById('imagePreview');
    
    uploadInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                alert('Файл слишком большой. Максимальный размер: 5MB');
                return;
            }
            
            if (!file.type.startsWith('image/')) {
                alert('Пожалуйста, выберите изображение');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.innerHTML = `<img src="${e.target.result}" alt="Предпросмотр">`;
                giveawayData.image_data = e.target.result.split(',')[1]; // Сохраняем base64
                giveawayData.image_type = file.type;
            };
            reader.readAsDataURL(file);
        }
    });
}

// Показать вкладку по индексу
function showTab(n) {
    // Скрываем все вкладки
    tabs.forEach(tab => tab.classList.remove('active'));
    tabButtons.forEach(button => button.classList.remove('active'));
    
    // Показываем выбранную вкладку
    tabs[n].classList.add('active');
    tabButtons[n].classList.add('active');
    currentTab = n;
    
    // Обновляем кнопки навигации
    updateNavigationButtons();
}

// Показать вкладку по ID
function showTabById(tabId) {
    const index = Array.from(tabButtons).findIndex(btn => btn.getAttribute('data-tab') === tabId);
    if (index !== -1) {
        showTab(index);
    }
}

// Следующая вкладка
function nextTab() {
    if (currentTab < tabs.length - 1) {
        showTab(currentTab + 1);
    }
}

// Предыдущая вкладка
function prevTab() {
    if (currentTab > 0) {
        showTab(currentTab - 1);
    }
}

// Обновление кнопок навигации
function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevTab');
    const nextBtn = document.getElementById('nextTab');
    
    prevBtn.style.display = currentTab === 0 ? 'none' : 'flex';
    nextBtn.style.display = currentTab === tabs.length - 1 ? 'none' : 'flex';
    
    if (currentTab === tabs.length - 1) {
        document.getElementById('createGiveaway').style.display = 'flex';
        tg.MainButton.show();
    } else {
        document.getElementById('createGiveaway').style.display = 'none';
        tg.MainButton.hide();
    }
}

// Обновление настроек типа розыгрыша
function updateTypeSettings() {
    const isFirstClick = giveawayData.giveaway_type === 'first_click';
    
    // Настройки для обычного розыгрыша
    document.getElementById('normalSettings').style.display = isFirstClick ? 'none' : 'block';
    document.getElementById('timeSettings').style.display = isFirstClick ? 'none' : 'block';
    
    // Для "Первого клика" всегда 1 победитель
    if (isFirstClick) {
        giveawayData.winners_count = 1;
        document.getElementById('winnersCount').value = 1;
    }
}

// Обновление предпросмотра
function updatePreview() {
    // Приз
    const previewPrize = document.getElementById('previewPrize');
    previewPrize.textContent = giveawayData.prize || 'Не указан';
    
    // Время
    const previewTime = document.getElementById('previewTime');
    if (giveawayData.giveaway_type === 'first_click') {
        previewTime.textContent = '⚡ Мгновенно (после первого участника)';
    } else {
        const timeParts = [];
        if (giveawayData.days > 0) timeParts.push(`${giveawayData.days} д.`);
        if (giveawayData.hours > 0) timeParts.push(`${giveawayData.hours} ч.`);
        if (giveawayData.minutes > 0) timeParts.push(`${giveawayData.minutes} м.`);
        previewTime.textContent = timeParts.length > 0 ? timeParts.join(' ') : '0 минут';
    }
    
    // Победители
    const previewWinners = document.getElementById('previewWinners');
    previewWinners.textContent = giveawayData.winners_count;
    
    // Условия
    const previewRequirements = document.getElementById('previewRequirements');
    if (giveawayData.requirements.length > 0) {
        const requirementsList = giveawayData.requirements
            .map(req => `<li>${req}</li>`)
            .join('');
        previewRequirements.innerHTML = `
            🔔 <strong>Условия:</strong>
            <ul style="margin-top: 5px; padding-left: 20px;">
                ${requirementsList}
            </ul>
        `;
    } else {
        previewRequirements.innerHTML = '🔔 <strong>Условия:</strong> Без условий';
    }
    
    // Канал
    const previewChannel = giveawayData.channel ? giveawayData.channel : 'Не указан';
    
    // Добавляем хештеги к призу если есть
    if (giveawayData.hashtags) {
        const hashtagsElement = document.getElementById('previewHashtags') || 
            (() => {
                const el = document.createElement('p');
                el.className = 'preview-hashtags';
                el.id = 'previewHashtags';
                document.querySelector('.preview-body').appendChild(el);
                return el;
            })();
        hashtagsElement.innerHTML = `🏷️ <strong>Хештеги:</strong> ${giveawayData.hashtags}`;
    }
}

// Валидация формы
function validateForm() {
    // Проверка канала
    if (!giveawayData.channel.trim()) {
        showError('Пожалуйста, укажите канал для розыгрыша');
        showTabById('basic');
        return false;
    }
    
    // Проверка приза
    if (!giveawayData.prize.trim()) {
        showError('Пожалуйста, укажите приз для розыгрыша');
        showTabById('prize');
        return false;
    }
    
    // Для обычного розыгрыша проверяем время
    if (giveawayData.giveaway_type === 'normal') {
        const totalTime = giveawayData.days * 1440 + giveawayData.hours * 60 + giveawayData.minutes;
        if (totalTime === 0) {
            showError('Пожалуйста, укажите время для розыгрыша');
            showTabById('basic');
            return false;
        }
    }
    
    return true;
}

// Создание розыгрыша
async function createGiveaway() {
    if (!validateForm()) {
        return;
    }
    
    // Показываем статус
    showStatus('Отправка данных...');
    
    try {
        // Подготовка данных для отправки
        const dataToSend = {
            giveaway_type: giveawayData.giveaway_type,
            channel: giveawayData.channel,
            winners_count: giveawayData.giveaway_type === 'first_click' ? 1 : giveawayData.winners_count,
            days: giveawayData.days,
            hours: giveawayData.hours,
            minutes: giveawayData.minutes,
            requirements: giveawayData.requirements,
            prize: giveawayData.prize,
            hashtags: giveawayData.hashtags,
            channel_display: giveawayData.channel,
            created_at: new Date().toISOString()
        };
        
        // Добавляем изображение если есть
        if (giveawayData.image_data) {
            dataToSend.image_data = giveawayData.image_data;
            dataToSend.image_type = giveawayData.image_type;
        }
        
        // Отправка данных в бот
        tg.sendData(JSON.stringify(dataToSend));
        
        // Показываем успешный статус
        showStatus('✅ Розыгрыш создан! Закрываем приложение...');
        
        // Закрываем Mini App через 2 секунды
        setTimeout(() => {
            tg.close();
        }, 2000);
        
    } catch (error) {
        console.error('Ошибка при создании розыгрыша:', error);
        showError('Ошибка при отправке данных. Попробуйте еще раз.');
    }
}

// Показать статус
function showStatus(message) {
    const status = document.getElementById('status');
    const statusText = document.getElementById('statusText');
    
    statusText.textContent = message;
    status.classList.remove('hidden');
    
    // Прокручиваем к статусу
    status.scrollIntoView({ behavior: 'smooth' });
}

// Показать ошибку
function showError(message) {
    const status = document.getElementById('status');
    const statusText = document.getElementById('statusText');
    
    statusText.textContent = `❌ ${message}`;
    status.style.background = '#f8d7da';
    status.style.color = '#721c24';
    status.classList.remove('hidden');
    
    // Прокручиваем к статусу
    status.scrollIntoView({ behavior: 'smooth' });
    
    // Скрываем ошибку через 5 секунд
    setTimeout(() => {
        status.classList.add('hidden');
        status.style.background = '';
        status.style.color = '';
    }, 5000);
}

// Получение данных из параметров URL
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const paramsObj = {};
    
    for (const [key, value] of params.entries()) {
        paramsObj[key] = value;
    }
    
    return paramsObj;
}

// Автозаполнение данных из URL параметров
function autoFillFromUrl() {
    const params = getUrlParams();
    
    if (params.channel) {
        giveawayData.channel = params.channel;
        document.getElementById('channel').value = params.channel;
    }
    
    if (params.type) {
        giveawayData.giveaway_type = params.type;
        document.querySelector(`input[name="giveawayType"][value="${params.type}"]`).checked = true;
        updateTypeSettings();
    }
    
    updatePreview();
}