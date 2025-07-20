
// === USER AUTH ===
const signupForm = document.getElementById('signup-form');
const loginForm = document.getElementById('login-form');

if (signupForm) {
  signupForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;

    const nameError = document.getElementById('name-error');
    const emailError = document.getElementById('email-error');
    const passwordError = document.getElementById('password-error');

    nameError.textContent = '';
    emailError.textContent = '';
    passwordError.textContent = '';

    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.email === email) {
      emailError.textContent = 'This email is already registered.';
      return;
    }

    if (password.length < 6) {
      passwordError.textContent = 'Password must be at least 6 characters.';
      return;
    }

    const newUser = { name, email, password };
    localStorage.setItem('user', JSON.stringify(newUser));
    localStorage.setItem('loggedIn', 'true');
    window.location.href = 'index.html';
  });
}

if (loginForm) {
  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const rememberMe = document.getElementById('rememberMe')?.checked;

    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.email === email && user.password === password) {
      if (rememberMe) {
        localStorage.setItem('loggedIn', 'true');
      } else {
        sessionStorage.setItem('loggedInSession', 'true');
      }
      window.location.href = 'index.html';
    } else {
      alert('Invalid credentials.');
    }
  });
}

// === AUTH GUARD ===
const protectedPages = ['index.html', 'list.html', 'profile.html', 'settings.html', 'trash.html'];
const path = window.location.pathname.split('/').pop();
const isLoggedIn = localStorage.getItem('loggedIn') === 'true' || sessionStorage.getItem('loggedInSession') === 'true';

if (protectedPages.includes(path) && !isLoggedIn) {
  window.location.href = 'login.html';
}

// === DATA ===
let lists = JSON.parse(localStorage.getItem('lists')) || [];
let trash = JSON.parse(localStorage.getItem('trash')) || [];

// === DASHBOARD ===
const listsContainer = document.getElementById('lists');
const newListBtn = document.getElementById('new-list-btn');

if (listsContainer && newListBtn) {
  newListBtn.addEventListener('click', () => {
    const name = prompt('Enter new list name:');
    if (name) {
      lists.push({ name, tasks: [] });
      saveLists();
      renderLists();
      showTodayReminder();
    }
  });

  function renderLists() {
    listsContainer.innerHTML = '';
    lists.forEach((list, index) => {
      const total = list.tasks.length;
      const done = list.tasks.filter(t => t.done).length;
      const percent = total > 0 ? Math.round((done / total) * 100) : 0;

      const div = document.createElement('div');
      div.className = 'col-md-4';
      div.innerHTML = `
        <div class="list-card p-3 border rounded shadow-sm">
          <h5 class="mb-2">${list.name}</h5>
          <div class="progress mb-2" style="height: 20px;">
            <div class="progress-bar bg-success" role="progressbar" style="width: ${percent}%;">${percent}%</div>
          </div>
          <a href="list.html?index=${index}" class="btn btn-sm btn-primary">View</a>
        </div>
      `;
      listsContainer.appendChild(div);
    });
  }

  renderLists();
  showTodayReminder();
}

// === REMINDER ===
function showTodayReminder() {
  const today = new Date().toISOString().split('T')[0];
  let dueToday = 0;

  lists.forEach(list => {
    list.tasks.forEach(task => {
      if (task.due === today && !task.done) {
        dueToday++;
      }
    });
  });

  const reminder = document.getElementById('today-reminder');

  if (reminder) {
    if (dueToday > 0) {
      reminder.className = 'alert alert-warning';
      reminder.textContent = `🔔 You have ${dueToday} task(s) due today!`;
    } else {
      reminder.className = 'alert alert-success';
      reminder.textContent = `✅ No tasks due today.`;
    }
  }
}


// === LIST PAGE ===
const urlParams = new URLSearchParams(window.location.search);
const listIndex = urlParams.get('index');

const listTitle = document.getElementById('list-title');
const tasksContainer = document.getElementById('tasks');
const addTaskBtn = document.getElementById('add-task-btn');
const deleteListBtn = document.getElementById('delete-list-btn');

const taskModalEl = document.getElementById('taskModal');
const taskModal = taskModalEl ? new bootstrap.Modal(taskModalEl) : null;
const taskTextInput = document.getElementById('task-text');
const taskDueInput = document.getElementById('task-due');
const taskPriorityInput = document.getElementById('task-priority');
const taskDoneInput = document.getElementById('task-done');
const saveTaskBtn = document.getElementById('save-task');

let editingTaskIndex = null;

if (listTitle && tasksContainer && addTaskBtn) {
  const currentList = lists[listIndex];
  listTitle.textContent = currentList.name;

  addTaskBtn.addEventListener('click', () => {
    editingTaskIndex = null;
    taskTextInput.value = '';
    taskDueInput.value = '';
    taskPriorityInput.value = 'Medium';
    taskDoneInput.checked = false;
    taskModal.show();
  });

  saveTaskBtn.addEventListener('click', () => {
    const newTask = {
      text: taskTextInput.value.trim(),
      due: taskDueInput.value,
      priority: taskPriorityInput.value,
      done: taskDoneInput.checked
    };
    if (!newTask.text) {
      alert('Task text cannot be empty.');
      return;
    }
    if (editingTaskIndex === null) {
      currentList.tasks.push(newTask);
    } else {
      currentList.tasks[editingTaskIndex] = newTask;
    }
    saveLists();
    renderTasks();
    taskModal.hide();
  });

  if (deleteListBtn) {
    deleteListBtn.addEventListener('click', () => {
      if (confirm('Move this list to Trash?')) {
        const deletedList = lists.splice(listIndex, 1)[0];
        trash.push(deletedList);
        saveLists();
        saveTrash();
        window.location.href = 'index.html';
      }
    });
  }

  function renderTasks() {
    tasksContainer.innerHTML = '';
    const today = new Date().toISOString().split('T')[0];

    currentList.tasks.forEach((task, index) => {
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-center';

      let text = `<strong ${task.done ? 'style="text-decoration: line-through;"' : ''}>${task.text}</strong>`;
      if (task.due) {
        text += `<small class="text-muted ms-2">📅 ${task.due}</small>`;
        if (task.due < today && !task.done) {
          text += ` <span class="badge bg-danger">⏰ Overdue</span>`;
        }
      }
      text += ` <span class="badge bg-secondary">${task.priority}</span>`;

      li.innerHTML = `<div>${text}</div>`;

      const actions = document.createElement('div');
      actions.innerHTML = `
        <button class="btn btn-sm btn-success me-2 toggle-task">✔️</button>
        <button class="btn btn-sm btn-warning me-2 edit-task">✏️</button>
        <button class="btn btn-sm btn-danger delete-task">🗑️</button>
      `;

      li.appendChild(actions);
      tasksContainer.appendChild(li);

      actions.querySelector('.toggle-task').addEventListener('click', () => {
        task.done = !task.done;
        saveLists();
        renderTasks();
      });

      actions.querySelector('.edit-task').addEventListener('click', () => {
        editingTaskIndex = index;
        taskTextInput.value = task.text;
        taskDueInput.value = task.due;
        taskPriorityInput.value = task.priority;
        taskDoneInput.checked = task.done;
        taskModal.show();
      });

      actions.querySelector('.delete-task').addEventListener('click', () => {
        if (confirm('Delete this task?')) {
          currentList.tasks.splice(index, 1);
          saveLists();
          renderTasks();
        }
      });
    });
  }

  renderTasks();
}

// === TRASH ===
const trashContainer = document.getElementById('trash-container');

if (trashContainer) {
  renderTrash();
}

function renderTrash() {
  trashContainer.innerHTML = '';
  if (trash.length === 0) {
    trashContainer.innerHTML = '<p>No deleted lists.</p>';
    return;
  }
  trash.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'card mb-3 p-3';
    div.innerHTML = `
      <h5>${item.name}</h5>
      <p>${item.tasks.length} tasks</p>
      <button class="btn btn-success btn-sm me-2 restore-list">Restore</button>
      <button class="btn btn-danger btn-sm delete-permanently">Delete Permanently</button>
    `;
    div.querySelector('.restore-list').addEventListener('click', () => {
      lists.push(item);
      trash.splice(index, 1);
      saveLists();
      saveTrash();
      renderTrash();
      showTodayReminder();
    });
    div.querySelector('.delete-permanently').addEventListener('click', () => {
      if (confirm('Delete forever?')) {
        trash.splice(index, 1);
        saveTrash();
        renderTrash();
      }
    });
    trashContainer.appendChild(div);
  });
}

// === PROFILE ===
const totalListsSpan = document.getElementById('total-lists');
const user = JSON.parse(localStorage.getItem('user'));

if (totalListsSpan) {
  totalListsSpan.textContent = lists.length;
}

if (user) {
  if (document.getElementById('profile-name')) {
    document.getElementById('profile-name').textContent = `Name: ${user.name}`;
  }
  if (document.getElementById('profile-email')) {
    document.getElementById('profile-email').textContent = `Email: ${user.email}`;
  }
  if (document.getElementById('profile-name-input')) {
    document.getElementById('profile-name-input').value = user.name;
  }
  if (document.getElementById('profile-email-input')) {
    document.getElementById('profile-email-input').value = user.email;
  }

  const profileForm = document.getElementById('profile-form');
  if (profileForm) {
    profileForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newName = document.getElementById('profile-name-input').value.trim();
      const newEmail = document.getElementById('profile-email-input').value.trim();
      const newPassword = document.getElementById('profile-password-input').value;
      if (newName) user.name = newName;
      if (newEmail) user.email = newEmail;
      if (newPassword.length >= 6) user.password = newPassword;
      localStorage.setItem('user', JSON.stringify(user));
      alert('Profile updated!');
      location.reload();
    });
  }
}

// === SETTINGS ===
const darkModeToggle = document.getElementById('darkModeToggle');
const clearDataBtn = document.getElementById('clear-data');

if (darkModeToggle) {
  darkModeToggle.checked = localStorage.getItem('darkMode') === 'true';
  applyDarkMode();

  darkModeToggle.addEventListener('change', () => {
    localStorage.setItem('darkMode', darkModeToggle.checked);
    applyDarkMode();
  });

  function applyDarkMode() {
    if (localStorage.getItem('darkMode') === 'true') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }
}

if (!darkModeToggle && localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark-mode');
}

if (clearDataBtn) {
  clearDataBtn.addEventListener('click', () => {
    if (confirm('Clear all task lists? Your account stays safe.')) {
      const user = localStorage.getItem('user');
      const darkMode = localStorage.getItem('darkMode');
      const loggedIn = localStorage.getItem('loggedIn') || sessionStorage.getItem('loggedInSession');
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem('user', user);
      localStorage.setItem('darkMode', darkMode);
      if (loggedIn === 'true') {
        localStorage.setItem('loggedIn', 'true');
      } else {
        sessionStorage.setItem('loggedInSession', 'true');
      }
      saveTrash();
      window.location.reload();
    }
  });
}

// === LOGOUT ===
const logoutLink = document.getElementById('logout-link');
if (logoutLink) {
  logoutLink.addEventListener('click', () => {
    localStorage.removeItem('loggedIn');
    sessionStorage.removeItem('loggedInSession');
    window.location.href = 'login.html';
  });
}

// === SAVE ===
function saveLists() {
  localStorage.setItem('lists', JSON.stringify(lists));
}

function saveTrash() {
  localStorage.setItem('trash', JSON.stringify(trash));
}
// ✅ Close button
const closeReminderBtn = document.getElementById('close-reminder');
if (closeReminderBtn) {
  closeReminderBtn.addEventListener('click', () => {
    const reminder = document.getElementById('today-reminder');
    if (reminder) {
      reminder.style.display = 'none';
    }
  });
}
