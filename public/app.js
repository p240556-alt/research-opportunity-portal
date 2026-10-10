// app.js
// Frontend logic: talks to the backend API and updates the page.

// ---------- Find the page elements we need ----------
const messageBox = document.getElementById('message');
const listSection = document.getElementById('list-section');
const detailsSection = document.getElementById('details-section');
const opportunityList = document.getElementById('opportunity-list');
const emptyText = document.getElementById('empty-text');
const detailsContent = document.getElementById('details-content');
const detailsBackButton = document.getElementById('details-back-button');

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
    detailsSection.hidden = false;
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
  if (button.dataset.action === 'view') {
    showDetails(button.dataset.id);
  }
});

detailsBackButton.addEventListener('click', function () {
  detailsSection.hidden = true;
  listSection.hidden = false;
});

// ---------- Start ----------
loadOpportunities();