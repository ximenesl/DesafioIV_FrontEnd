const API_URL = 'https://desafioiv-backend.onrender.com/api/transactions';

const form = document.getElementById('transaction-form');
const transactionId = document.getElementById('transaction-id');
const title = document.getElementById('title');
const amount = document.getElementById('amount');
const type = document.getElementById('type');
const category = document.getElementById('category');
const dateInput = document.getElementById('date');
const timeInput = document.getElementById('time');
const transactionsList = document.getElementById('transactions-list');
const message = document.getElementById('message');
const cancelEdit = document.getElementById('cancel-edit');
const formTitle = document.getElementById('form-title');
const reloadBtn = document.getElementById('reload-btn');

const totalIncomeEl = document.getElementById('total-income');
const totalExpenseEl = document.getElementById('total-expense');
const totalBalanceEl = document.getElementById('total-balance');

function showMessage(text) {
  message.textContent = text;
  setTimeout(() => message.textContent = '', 3000);
}

function clearForm() {
  form.reset();
  transactionId.value = '';
  formTitle.textContent = 'Nova Transação';
  cancelEdit.classList.add('hidden');
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  const localISOTime = (new Date(now - offset)).toISOString().slice(0, -1);
  dateInput.value = localISOTime.split('T')[0];
  timeInput.value = localISOTime.split('T')[1].slice(0, 5);
}

function formatDate(date) {
  return new Date(date).toLocaleString('pt-BR');
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function updateSummary(transactions) {
  let income = 0;
  let expense = 0;

  transactions.forEach(t => {
    if (t.type === 'income') income += t.amount;
    else expense += t.amount;
  });

  const balance = income - expense;

  totalIncomeEl.textContent = formatCurrency(income);
  totalExpenseEl.textContent = formatCurrency(expense);
  totalBalanceEl.textContent = formatCurrency(balance);
}

async function loadTransactions() {
  try {
    const response = await fetch(API_URL);
    const transactions = await response.json();

    if (!response.ok || !Array.isArray(transactions)) {
      console.error('Erro retornado pela API:', transactions);
      throw new Error(transactions.message || 'Erro desconhecido da API');
    }

    updateSummary(transactions);

    if (!transactions.length) {
      transactionsList.innerHTML = '<p class="text-muted text-center">Nenhuma transação encontrada.</p>';
      return;
    }

    transactionsList.innerHTML = transactions.map(t => `
      <div class="card mb-2 shadow-sm border-start border-4 ${t.type === 'income' ? 'border-success' : 'border-danger'}">
        <div class="card-body py-2 d-flex justify-content-between align-items-center">
          <div>
            <h6 class="mb-0">${t.title} <span class="badge bg-secondary ms-2">${t.category}</span></h6>
            <small class="text-muted">${formatDate(t.date)}</small>
          </div>
          <div class="text-end">
            <h5 class="mb-0 ${t.type === 'income' ? 'text-success' : 'text-danger'}">
              ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}
            </h5>
            <div class="mt-1">
              <button class="btn btn-sm btn-outline-primary" onclick="editTransaction('${t._id}')">Editar</button>
              <button class="btn btn-sm btn-outline-danger" onclick="deleteTransaction('${t._id}')">Excluir</button>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Erro ao carregar transações:', error);
    showMessage('Erro de conexão com o servidor.');
  }
}

async function saveTransaction(data) {
  const id = transactionId.value;
  const url = id ? `${API_URL}/${id}` : API_URL;
  const method = id ? 'PUT' : 'POST';

  await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

window.editTransaction = async function (id) {
  const response = await fetch(`${API_URL}/${id}`);
  
  const transactionsRes = await fetch(API_URL);
  const transactions = await transactionsRes.json();
  const transaction = transactions.find(t => t._id === id);

  if(!transaction) return;

  transactionId.value = transaction._id;
  title.value = transaction.title;
  amount.value = transaction.amount;
  type.value = transaction.type;
  category.value = transaction.category;
  const d = new Date(transaction.date);
  const offset = d.getTimezoneOffset() * 60000;
  const localISOTime = (new Date(d - offset)).toISOString().slice(0, -1);
  dateInput.value = localISOTime.split('T')[0];
  timeInput.value = localISOTime.split('T')[1].slice(0, 5);

  formTitle.textContent = 'Editar Transação';
  cancelEdit.classList.remove('hidden');
  window.scrollTo(0, 0);
};

window.deleteTransaction = async function (id) {
  if (!confirm('Deseja excluir esta transação?')) return;

  await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
  showMessage('Transação excluída.');
  loadTransactions();
};

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = {
    title: title.value,
    amount: parseFloat(amount.value),
    type: type.value,
    category: category.value,
    date: new Date(`${dateInput.value}T${timeInput.value}`).toISOString()
  };

  await saveTransaction(data);
  showMessage(transactionId.value ? 'Transação atualizada.' : 'Transação criada.');
  clearForm();
  loadTransactions();
});

cancelEdit.addEventListener('click', () => {
  clearForm();
});

reloadBtn.addEventListener('click', loadTransactions);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      await navigator.serviceWorker.register('./service-worker.js');
      console.log('Service Worker registrado.');
    } catch (error) {
      console.log('Erro ao registrar SW:', error);
    }
  });
}

clearForm();
loadTransactions();
