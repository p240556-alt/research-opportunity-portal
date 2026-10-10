// app.js
// Frontend logic: talks to the backend API and updates the page.

// ---------- Find the page elements we need ----------
const messageBox = document.getElementById('message');

const listSection = document.getElementById('list-section');
const detailsSection = document.getElementById('details-section');
const formSection = document.getElementById('form-section');

const opportunityList = document.getElementById('opportunity-list');
const emptyText = document.getElementById('empty-text');
const detailsContent = document.getElementById('details-content');

const newButton = document.getElementById('new-button');
const detailsBackButton = document.getElementById('details-back-button');
const cancelButton = document.getElementById('cancel-button');
const saveButton = document.getElementById('save-button');

const form = document.getElementById('opportunity-form');
const formErrors = document.getElementById('form-errors');

// The form fields. Each id matches the field name used by the API.
const TEXT_FIELDS = [
  { name: 'title', label: 'Research title', max: 200 },
  { name: 'description', label: 'Description', max: 5000 },
  { name: 'research_area', label: 'Research area', max: 100 },
  { name: 'faculty_name', label: 'Faculty name', max: 100 },
  { name: 'department', label: 'Department', max: 100 },
  { name: 'required_skills', label: 'Required skills', max: 255 },
];

// ---------- Helper functions ----------

let messageTimer = null;

// Shows a green (success) or red (error) message at the top for a few seconds
function showMessage(text, type) {
  messageBox.textContent = text;
  messageBox.className = 'message ' + type;
  messageBox.hidden = false;
  clearTimeout(messageTimer);
  messageTimer = setTimeout(function () {
    messageBox.hidden = true;
  }, 6000);
}

// Makes text safe to put inside HTML (stops "<b>" or "<script>" typed by a user from running)
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Shows only the list section
function showList() {
  detailsSection.hidden = true;
  formSection.hidden = true;
  listSection.hidden = false;
  window.scrollTo(0, 0);
}

// Shows a list of problems above the form
function showFormErrors(errors) {
  formErrors.innerHTML = errors
    .map(function (error) {
      return '&bull; ' + escapeHtml(error);
    })
    .join('<br>');
  formErrors.hidden = false;
  window.scrollTo(0, 0);
}

function clearFormErrors() {
  formErrors.hidden = true;
  formErrors.innerHTML = '';
}

// ---------- Show the list ----------

async function loadOpportunities() {
  try {
    const response = await fetch('/api/opportunities');
    if (!response.ok) {
      throw new Error('Server returned status ' + response.status);
    }
    const opportunities = await response.json();

    opportunityList.innerHTML = '';
    emptyText.hidden = opportunities.length > 0;

    for (const item of opportunities) {
      const row = document.createElement('tr');
      row.innerHTML =
        '<td>' + item.id + '</td>' +
        '<td>' + escapeHtml(item.title) + '</td>' +
        '<td>' + escapeHtml(item.research_area) + '</td>' +
        '<td>' + escapeHtml(item.faculty_name) + '</td>' +
        '<td>' + item.available_positions + '</td>' +
        '<td>' + escapeHtml(item.application_deadline) + '</td>' +
        '<td><span class="status-' + item.status.toLowerCase() + '">' + item.status + '</span></td>' +
        '<td><button data-action="view" data-id="' + item.id + '">View</button></td>';
      opportunityList.appendChild(row);
    }
  } catch (error) {
    console.error(error);
    showMessage('Could not load opportunities. Is the server running?', 'error');
  }
}

// ---------- Show details of one opportunity ----------

async function showDetails(id) {
  try {
    const response = await fetch('/api/opportunities/' + id);
    const data = await response.json();

    if (!response.ok) {
      showMessage(data.error || 'Could not load the opportunity.', 'error');
      return;
    }

    detailsContent.innerHTML =
      '<p><strong>ID:</strong> ' + data.id + '</p>' +
      '<p><strong>Research title:</strong> ' + escapeHtml(data.title) + '</p>' +
      '<p><strong>Description:</strong> ' + escapeHtml(data.description) + '</p>' +
      '<p><strong>Research area:</strong> ' + escapeHtml(data.research_area) + '</p>' +
      '<p><strong>Faculty name:</strong> ' + escapeHtml(data.faculty_name) + '</p>' +
      '<p><strong>Department:</strong> ' + escapeHtml(data.department) + '</p>' +
      '<p><strong>Required skills:</strong> ' + escapeHtml(data.required_skills) + '</p>' +
      '<p><strong>Available positions:</strong> ' + data.available_positions + '</p>' +
      '<p><strong>Application deadline:</strong> ' + escapeHtml(data.application_deadline) + '</p>' +
      '<p><strong>Status:</strong> <span class="status-' + data.status.toLowerCase() + '">' + data.status + '</span></p>';

    listSection.hidden = true;
    formSection.hidden = true;
    detailsSection.hidden = false;
    window.scrollTo(0, 0);
  } catch (error) {
    console.error(error);
    showMessage('Could not reach the server.', 'error');
  }
}

// ---------- The form ----------

// Opens an empty form
function showForm() {
  form.reset();
  clearFormErrors();
  listSection.hidden = true;
  detailsSection.hidden = true;
  formSection.hidden = false;
  window.scrollTo(0, 0);
}

// Reads the form fields into one object
function readForm() {
  const data = {};
  for (const field of TEXT_FIELDS) {
    data[field.name] = document.getElementById(field.name).value.trim();
  }

  const positionsText = document.getElementById('available_positions').value.trim();
  data.available_positions = positionsText === '' ? NaN : Number(positionsText);

  data.application_deadline = document.getElementById('application_deadline').value;
  data.status = document.getElementById('status').value;
  return data;
}

// Checks the data and returns a list of problems (empty list = everything is fine)
function validateForm(data) {
  const errors = [];

  for (const field of TEXT_FIELDS) {
    const value = data[field.name];
    if (value === '') {
      errors.push(field.label + ' is required.');
    } else if (value.length > field.max) {
      errors.push(field.label + ' must be at most ' + field.max + ' characters.');
    }
  }

  if (!Number.isInteger(data.available_positions) || data.available_positions < 0) {
    errors.push('Available positions must be a whole number (0 or more).');
  }

  if (data.application_deadline === '') {
    errors.push('Application deadline is required.');
  }

  return errors;
}

// Runs when the user clicks "Save Opportunity"
form.addEventListener('submit', async function (event) {
  event.preventDefault(); // stop the browser from reloading the page
  clearFormErrors();

  const data = readForm();
  const errors = validateForm(data);
  if (errors.length > 0) {
    showFormErrors(errors);
    return;
  }

  saveButton.disabled = true; // prevents double clicks while saving
  try {
    const response = await fetch('/api/opportunities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();

    if (response.status === 201) {
      showList();
      showMessage('Opportunity created successfully.', 'success');
      await loadOpportunities();
    } else if (response.status === 400) {
      showFormErrors(result.details || [result.error]);
    } else {
      showFormErrors([result.error || 'Something went wrong on the server.']);
    }
  } catch (error) {
    console.error(error);
    showFormErrors(['Could not reach the server. Is it running?']);
  } finally {
    saveButton.disabled = false;
  }
});

// ---------- Button clicks ----------

// One listener for all buttons inside the table
opportunityList.addEventListener('click', function (event) {
  const button = event.target.closest('button');
  if (!button) {
    return;
  }
  if (button.dataset.action === 'view') {
    showDetails(button.dataset.id);
  }
});

newButton.addEventListener('click', showForm);
detailsBackButton.addEventListener('click', showList);
cancelButton.addEventListener('click', showList);

// ---------- Start ----------
loadOpportunities();