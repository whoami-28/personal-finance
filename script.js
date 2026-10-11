// Константы категорий для типов операций
const CATEGORIES = {
    income: ['Зарплата', 'Фриланс', 'Инвестиции', 'Подарки', 'Другое'],
    expense: ['Продукты', 'Жилье', 'Транспорт', 'Развлечения', 'Здоровье', 'Другое']
};

// Ключ для хранения в LocalStorage
const STORAGE_KEY = 'personal_finance_data';

// Массив операций (состояние приложения)
let transactions = [];

// Текущий режим статистики ('expense' или 'income')
let currentStatType = 'expense';

// Ссылки на элементы DOM
const form = document.getElementById('transaction-form');
const editIdInput = document.getElementById('edit-id');
const transTypeSelect = document.getElementById('trans-type');
const transTitleInput = document.getElementById('trans-title');
const transAmountInput = document.getElementById('trans-amount');
const transCategorySelect = document.getElementById('trans-category');
const transDateInput = document.getElementById('trans-date');
const formHeading = document.getElementById('form-heading');
const btnSubmit = document.getElementById('btn-submit');
const btnCancel = document.getElementById('btn-cancel');

const totalBalanceEl = document.getElementById('total-balance');
const totalIncomeEl = document.getElementById('total-income');
const totalExpenseEl = document.getElementById('total-expense');

const filterSearch = document.getElementById('filter-search');
const filterType = document.getElementById('filter-type');
const filterCategory = document.getElementById('filter-category');
const filterSort = document.getElementById('filter-sort');

const transactionsBody = document.getElementById('transactions-body');
const emptyState = document.getElementById('empty-state');
const statsList = document.getElementById('stats-list');

const tabStatExpense = document.getElementById('tab-stat-expense');
const tabStatIncome = document.getElementById('tab-stat-income');

// Загрузка данных из LocalStorage
function loadTransactions() {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (rawData) {
        try {
            transactions = JSON.parse(rawData);
        } catch (e) {
            transactions = [];
        }
    } else {
        // Стартовые демо-данные при первом открытии
        transactions = [
            {
                id: '1',
                type: 'income',
                title: 'Основная зарплата',
                amount: 85000,
                category: 'Зарплата',
                date: '2026-10-01'
            },
            {
                id: '2',
                type: 'expense',
                title: 'Супермаркет',
                amount: 6200,
                category: 'Продукты',
                date: '2026-10-03'
            },
            {
                id: '3',
                type: 'expense',
                title: 'Аренда жилья',
                amount: 32000,
                category: 'Жилье',
                date: '2026-10-05'
            }
        ];
        saveTransactions();
    }
}

// Сохранение данных в LocalStorage
function saveTransactions() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

// Заполнение выпадающих списков категорий
function updateCategoryOptions(type, selectElement, includeAll = false) {
    selectElement.innerHTML = '';

    if (includeAll) {
        const opt = document.createElement('option');
        opt.value = 'all';
        opt.textContent = 'Все категории';
        selectElement.appendChild(opt);
    }

    const cats = type === 'all' 
        ? [...new Set([...CATEGORIES.income, ...CATEGORIES.expense])]
        : CATEGORIES[type] || [];

    cats.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        selectElement.appendChild(opt);
    });
}

// Расчет и отрисовка общего баланса, доходов и расходов
function renderSummary() {
    let incomeSum = 0;
    let expenseSum = 0;

    for (let i = 0; i < transactions.length; i++) {
        const item = transactions[i];
        if (item.type === 'income') {
            incomeSum += Number(item.amount);
        } else {
            expenseSum += Number(item.amount);
        }
    }

    const balance = incomeSum - expenseSum;

    totalBalanceEl.textContent = `${balance.toFixed(2)} ₽`;
    totalIncomeEl.textContent = `+${incomeSum.toFixed(2)} ₽`;
    totalExpenseEl.textContent = `-${expenseSum.toFixed(2)} ₽`;
}

// Расчет и отрисовка статистики по категориям
function renderStats() {
    statsList.innerHTML = '';

    // Фильтруем массив по выбранному типу (доход/расход)
    const filtered = transactions.filter(t => t.type === currentStatType);
    const total = filtered.reduce((acc, t) => acc + Number(t.amount), 0);

    if (total === 0) {
        statsList.innerHTML = '<div class="empty-state">Нет данных для расчета</div>';
        return;
    }

    // Подсчет суммы по каждой категории
    const categoryTotals = {};
    filtered.forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Number(t.amount);
    });

    // Отрисовка полос статистики
    for (const category in categoryTotals) {
        const sum = categoryTotals[category];
        const percent = ((sum / total) * 100).toFixed(1);

        const item = document.createElement('div');
        item.className = 'stat-item';
        item.innerHTML = `
            <div class="stat-header">
                <span class="stat-category">${category}</span>
                <span class="stat-val">${sum.toFixed(2)} ₽ (${percent}%)</span>
            </div>
            <div class="stat-bar-container">
                <div class="stat-bar" style="width: ${percent}%;"></div>
            </div>
        `;
        statsList.appendChild(item);
    }
}

// Получение списка с учетом поиска, фильтрации и сортировки
function getFilteredTransactions() {
    const searchText = filterSearch.value.trim().toLowerCase();
    const typeFilter = filterType.value;
    const catFilter = filterCategory.value;
    const sortFilter = filterSort.value;

    let result = transactions.filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(searchText);
        const matchesType = (typeFilter === 'all') || (t.type === typeFilter);
        const matchesCategory = (catFilter === 'all') || (t.category === catFilter);
        return matchesSearch && matchesType && matchesCategory;
    });

    // Сортировка простых алгоритмов
    result.sort((a, b) => {
        if (sortFilter === 'date-desc') {
            return new Date(b.date) - new Date(a.date);
        } else if (sortFilter === 'date-asc') {
            return new Date(a.date) - new Date(b.date);
        } else if (sortFilter === 'amount-desc') {
            return Number(b.amount) - Number(a.amount);
        } else if (sortFilter === 'amount-asc') {
            return Number(a.amount) - Number(b.amount);
        }
        return 0;
    });

    return result;
}

// Отрисовка таблицы операций
function renderTransactions() {
    const list = getFilteredTransactions();
    transactionsBody.innerHTML = '';

    if (list.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
    }

    list.forEach(t => {
        const tr = document.createElement('tr');
        const isIncome = t.type === 'income';

        tr.innerHTML = `
            <td>${t.date}</td>
            <td>${t.title}</td>
            <td>${t.category}</td>
            <td><span class="badge">${isIncome ? 'Доход' : 'Расход'}</span></td>
            <td class="text-right ${isIncome ? 'amount-income' : 'amount-expense'}">
                ${isIncome ? '+' : '-'}${Number(t.amount).toFixed(2)} ₽
            </td>
            <td class="text-center">
                <div class="table-actions">
                    <button class="btn btn-sm" onclick="editTransaction('${t.id}')">Ред.</button>
                    <button class="btn btn-sm" onclick="deleteTransaction('${t.id}')">Уд.</button>
                </div>
            </td>
        `;
        transactionsBody.appendChild(tr);
    });
}

// Полный ререндер интерфейса
function renderApp() {
    renderSummary();
    renderTransactions();
    renderStats();
}

// Очистка формы и сброс режима редактирования
function resetForm() {
    form.reset();
    editIdInput.value = '';
    formHeading.textContent = 'Новая операция';
    btnSubmit.textContent = 'Добавить';
    btnCancel.classList.add('hidden');
    
    // Установка сегодняшней даты по умолчанию
    transDateInput.value = new Date().toISOString().split('T')[0];
    updateCategoryOptions(transTypeSelect.value, transCategorySelect);
}

// Добавление или сохранение отредактированной операции
form.addEventListener('submit', function (e) {
    e.preventDefault();

    const id = editIdInput.value;
    const type = transTypeSelect.value;
    const title = transTitleInput.value.trim();
    const amount = parseFloat(transAmountInput.value);
    const category = transCategorySelect.value;
    const date = transDateInput.value;

    if (!title || isNaN(amount) || amount <= 0 || !date) {
        return;
    }

    if (id) {
        // Редактирование существующей операции
        const index = transactions.findIndex(t => t.id === id);
        if (index !== -1) {
            transactions[index] = { id, type, title, amount, category, date };
        }
    } else {
        // Добавление новой операции
        const newTrans = {
            id: Date.now().toString(),
            type,
            title,
            amount,
            category,
            date
        };
        transactions.push(newTrans);
    }

    saveTransactions();
    resetForm();
    renderApp();
});

// Удаление операции по id
window.deleteTransaction = function (id) {
    transactions = transactions.filter(t => t.id !== id);
    saveTransactions();
    
    // Если удаляется редактируемый элемент, сбрасываем форму
    if (editIdInput.value === id) {
        resetForm();
    }
    renderApp();
};

// Запуск редактирования операции
window.editTransaction = function (id) {
    const item = transactions.find(t => t.id === id);
    if (!item) return;

    editIdInput.value = item.id;
    transTypeSelect.value = item.type;
    updateCategoryOptions(item.type, transCategorySelect);
    transCategorySelect.value = item.category;
    transTitleInput.value = item.title;
    transAmountInput.value = item.amount;
    transDateInput.value = item.date;

    formHeading.textContent = 'Редактирование';
    btnSubmit.textContent = 'Сохранить';
    btnCancel.classList.remove('hidden');

    // Плавная прокрутка к форме на мобильных устройствах
    form.scrollIntoView({ behavior: 'smooth' });
};

// Отмена редактирования
btnCancel.addEventListener('click', resetForm);

// Переключение категорий при смене типа операции в форме
transTypeSelect.addEventListener('change', function () {
    updateCategoryOptions(this.value, transCategorySelect);
});

// Слушатели поиска, фильтров и сортировки
filterSearch.addEventListener('input', renderTransactions);
filterType.addEventListener('change', function () {
    updateCategoryOptions(this.value, filterCategory, true);
    renderTransactions();
});
filterCategory.addEventListener('change', renderTransactions);
filterSort.addEventListener('change', renderTransactions);

// Переключение вкладок статистики
tabStatExpense.addEventListener('click', () => {
    currentStatType = 'expense';
    tabStatExpense.classList.add('active');
    tabStatIncome.classList.remove('active');
    renderStats();
});

tabStatIncome.addEventListener('click', () => {
    currentStatType = 'income';
    tabStatIncome.classList.add('active');
    tabStatExpense.classList.remove('active');
    renderStats();
});

// Инициализация при старте
window.onload = function () {
    loadTransactions();
    resetForm();
    updateCategoryOptions('all', filterCategory, true);
    renderApp();
};
