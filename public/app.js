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
const formTitle = document.getElementById('form-title');
const formErrors = document.getElementById('form-errors');

// The text fields of the form. Each id matches the field name used by the API.
const TEXT_FIELDS = [
  { name: 'title', label: 'Research title', max: 200 },
  { name: 'description', label: 'Description', max: 5000 },
  { name: 'research_area', label: 'Research area', max: 100 },
  { name: 'faculty_name', label: 'Faculty name', max: 100 },
  { name: 'department', label: 'Department', max: 100 },
  { name: 'required_skills', label: 'Required skills', max: 255 },
];

// null = the form is adding a new opportunity; a number = the form is editing that id
let editingId = null;

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

// Sends a request to the API and returns { ok, status, data }
async function sendRequest(url, method, body) {
  const options = {
    method: method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }
  const response = await fetch(url, options);
  const data = await response.json();
  return { ok: response.ok, status: response.status, data: data };
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
      // Buttons for this row. "Close" only appears while the opportunity is Open.
      let actions =
        '<button data-action="view" data-id="' + item.id + '">View</button>' +
        '<button class="secondary" data-action="edit" data-id="' + item.id + '">Edit</button>';
      if (item.status === 'Open') {
        actions += '<button class="warning" data-action="close" data-id="' + item.id + '">Close</button>';
      }
      actions += '<button class="danger" data-action="delete" data-id="' + item.id + '">Delete</button>';

      const row = document.createElement('tr');
      row.innerHTML =
        '<td>' + item.id + '</td>' +
        '<td>' + escapeHtml(item.title) + '</td>' +
        '<td>' + escapeHtml(item.research_area) + '</td>' +
        '<td>' + escapeHtml(item.faculty_name) + '</td>' +
        '<td>' + item.available_positions + '</td>' +
        '<td>' + escapeHtml(item.application_deadline) + '</td>' +
        '<td><span class="status-' + item.status.toLowerCase() + '">' + item.status + '</span></td>' +
        '<td>' + actions + '</td>';
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
    const result = await sendRequest('/api/opportunities/' + id, 'GET');

    if (!result.ok) {
      showMessage(result.data.error || 'Could not load the opportunity.', 'error');
      await loadOpportunities();
      return;
    }

    const data = result.data;
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

// ---------- The form (add and edit) ----------

function displayForm() {
  listSection.hidden = true;
  detailsSection.hidden = true;
  formSection.hidden = false;
  window.scrollTo(0, 0);
}

// Opens an empty form to add a new opportunity
function showAddForm() {
  form.reset();
  clearFormErrors();
  editingId = null;
  formTitle.textContent = 'Add New Opportunity';
  displayForm();
}

// Opens the form filled with an existing opportunity so it can be edited
async function showEditForm(id) {
  try {
    const result = await sendRequest('/api/opportunities/' + id, 'GET');

    if (!result.ok) {
      showMessage(result.data.error || 'Could not load the opportunity.', 'error');
      await loadOpportunities();
      return;
    }

    const item = result.data;
    form.reset();
    clearFormErrors();

    for (const field of TEXT_FIELDS) {
      document.getElementById(field.name).value = item[field.name];
    }
    document.getElementById('available_positions').value = item.available_positions;
    document.getElementById('application_deadline').value = item.application_deadline;
    document.getElementById('status').value = item.status;

    editingId = item.id;
    formTitle.textContent = 'Edit Opportunity (ID ' + item.id + ')';
    displayForm();
  } catch (error) {
    console.error(error);
    showMessage('Could not reach the server.', 'error');
  }
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

// Runs when the user clicks "Save Opportunity" (for both adding and editing)
form.addEventListener('submit', async function (event) {
  event.preventDefault(); // stop the browser from reloading the page
  clearFormErrors();

  const data = readForm();
  const errors = validateForm(data);
  if (errors.length > 0) {
    showFormErrors(errors);
    return;
  }

  const isEditing = editingId !== null;
  const url = isEditing ? '/api/opportunities/' + editingId : '/api/opportunities';
  const method = isEditing ? 'PUT' : 'POST';
  const successStatus = isEditing ? 200 : 201;

  saveButton.disabled = true; // prevents double clicks while saving
  try {
    const result = await sendRequest(url, method, data);

    if (result.status === successStatus) {
      showList();
      showMessage(
        isEditing ? 'Opportunity updated successfully.' : 'Opportunity created successfully.',
        'success'
      );
      await loadOpportunities();
    } else if (result.status === 400) {
      showFormErrors(result.data.details || [result.data.error]);
    } else if (result.status === 404) {
      showList();
      showMessage('This opportunity no longer exists.', 'error');
      await loadOpportunities();
    } else {
      showFormErrors([result.data.error || 'Something went wrong on the server.']);
    }
  } catch (error) {
    console.error(error);
    showFormErrors(['Could not reach the server. Is it running?']);
  } finally {
    saveButton.disabled = false;
  }
});

// ---------- Close an opportunity ----------

async function closeOpportunity(id) {
  if (!confirm('Mark this opportunity as Closed?')) {
    return;
  }

  try {
    // Get the current data first, because the API update needs all fields
    const current = await sendRequest('/api/opportunities/' + id, 'GET');
    if (!current.ok) {
      showMessage(current.data.error || 'Could not load the opportunity.', 'error');
      await loadOpportunities();
      return;
    }

    const item = current.data;
    const body = {};
    for (const field of TEXT_FIELDS) {
      body[field.name] = item[field.name];
    }
    body.available_positions = item.available_positions;
    body.application_deadline = item.application_deadline;
    body.status = 'Closed';

    const result = await sendRequest('/api/opportunities/' + id, 'PUT', body);
    if (result.ok) {
      showMessage('Opportunity closed successfully.', 'success');
    } else {
      showMessage(result.data.error || 'Could not close the opportunity.', 'error');
    }
    await loadOpportunities();
  } catch (error) {
    console.error(error);
    showMessage('Could not reach the server.', 'error');
  }
}

// ---------- Delete an opportunity ----------

async function deleteOpportunity(id) {
  if (!confirm('Delete this opportunity permanently? This cannot be undone.')) {
    return;
  }

  try {
    const result = await sendRequest('/api/opportunities/' + id, 'DELETE');
    if (result.ok) {
      showMessage('Opportunity deleted successfully.', 'success');
    } else {
      showMessage(result.data.error || 'Could not delete the opportunity.', 'error');
    }
    await loadOpportunities();
  } catch (error) {
    console.error(error);
    showMessage('Could not reach the server.', 'error');
  }
}

// ---------- Button clicks ----------

// One listener for all buttons inside the table
opportunityList.addEventListener('click', function (event) {
  const button = event.target.closest('button');
  if (!button) {
    return;
  }

  const action = button.dataset.action;
  const id = button.dataset.id;

  if (action === 'view') {
    showDetails(id);
  } else if (action === 'edit') {
    showEditForm(id);
  } else if (action === 'close') {
    closeOpportunity(id);
  } else if (action === 'delete') {
    deleteOpportunity(id);
  }
});

newButton.addEventListener('click', showAddForm);
detailsBackButton.addEventListener('click', showList);
cancelButton.addEventListener('click', showList);

// ---------- Start ----------
loadOpportunities();