# Research Opportunity Portal

A simple web application where faculty can post and manage research opportunities. Faculty can create, view, update, close, and delete opportunities. All data is stored in a MySQL database and accessed through a REST API.

**Author:** [Marwa], [24P-0556]
**GitHub repository:** https://github.com/p240556-alt/research-opportunity-portal.git

## Features

- View a list of all research opportunities
- View the full details of one opportunity
- Create a new opportunity (with form validation)
- Update an existing opportunity
- Change an opportunity's status from Open to Closed
- Delete an opportunity (with a confirmation prompt)
- Success and error messages for every action

## Technologies Used

| Part | Technology |
|---|---|
| Backend | Node.js with Express |
| Database | MySQL |
| Database driver | mysql2 |
| Configuration | dotenv (keeps the database password out of the code) |
| Frontend | HTML, CSS, and plain JavaScript (no framework) |
| API testing | Postman |
| Version control | Git and GitHub |

## Project Structure

```
research-opportunity-portal/
├── database/
│   └── schema.sql          # Creates the database and the opportunities table
├── postman/
│   └── research-portal.postman_collection.json   # Postman API tests
├── public/                 # Frontend (served by Express)
│   ├── index.html
│   ├── style.css
│   └── app.js
├── .env.example            # Example settings (copy to .env)
├── .gitignore
├── db.js                   # MySQL connection
├── package.json
├── package-lock.json
├── README.md
└── server.js               # Express server and REST API
```

## Installation and Setup

### Requirements

- [Node.js](https://nodejs.org) (LTS version)
- [MySQL Server](https://dev.mysql.com/downloads/installer/) and MySQL Workbench
- Git

### Steps

1. Clone the repository:

```
   git clone https://github.com/YOUR-USERNAME/research-opportunity-portal.git
   cd research-opportunity-portal
```

2. Install the libraries:

```
   npm install
```

3. Set up the database (see the next section).

4. Create your private settings file. Copy `.env.example` to a new file named `.env`:

```
   copy .env.example .env
```

   Open `.env` and set `DB_PASSWORD` to your own MySQL password:

```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password_here
   DB_NAME=research_portal
   PORT=3000
```

   The `.env` file is private and is not uploaded to GitHub.

## Database Setup

The file `database/schema.sql` creates the `research_portal` database and the `opportunities` table.

1. Open MySQL Workbench and connect to your local MySQL server.
2. Choose **File → Open SQL Script** and select `database/schema.sql`.
3. Click the lightning bolt (Execute) button.
4. Check it worked by running:

```sql
   USE research_portal;
   DESCRIBE opportunities;
```

The table starts empty. All data is added through the application or the API.

### The `opportunities` table

| Column | Type | Notes |
|---|---|---|
| id | INT | Primary key, generated automatically |
| title | VARCHAR(200) | Research title (required) |
| description | TEXT | Required |
| research_area | VARCHAR(100) | Required |
| faculty_name | VARCHAR(100) | Required |
| department | VARCHAR(100) | Required |
| required_skills | VARCHAR(255) | Required |
| available_positions | INT | Whole number, 0 or more |
| application_deadline | DATE | Format YYYY-MM-DD |
| status | ENUM('Open','Closed') | Default is Open |

## How to Run

1. Make sure MySQL is running.
2. Start the server:

```
   npm start
```

   You should see: `Server running at http://localhost:3000`

3. Open the application in a browser: http://localhost:3000

To stop the server, press `Ctrl + C` in the terminal.

## API Endpoints

Base URL: `http://localhost:3000`

| Method | Endpoint | Description | Success code |
|---|---|---|---|
| POST | `/api/opportunities` | Create a new opportunity | 201 |
| GET | `/api/opportunities` | Get all opportunities | 200 |
| GET | `/api/opportunities/:id` | Get one opportunity | 200 |
| PUT | `/api/opportunities/:id` | Update an opportunity (also used to set status to Closed) | 200 |
| DELETE | `/api/opportunities/:id` | Delete an opportunity | 200 |

### Status codes used

| Code | Meaning | When |
|---|---|---|
| 200 | OK | A request succeeded |
| 201 | Created | A new opportunity was created |
| 400 | Bad Request | Missing or invalid data, an invalid id, or broken JSON |
| 404 | Not Found | The opportunity (or API route) does not exist |
| 500 | Server Error | An unexpected error, such as the database being unavailable |

### Example: create an opportunity

`POST /api/opportunities` with a JSON body:

```json
{
  "title": "Deep Learning for Medical Image Analysis",
  "description": "Develop and evaluate convolutional neural networks to detect abnormalities in chest X-ray images.",
  "research_area": "Artificial Intelligence",
  "faculty_name": "Dr. Ayesha Khan",
  "department": "Computer Science",
  "required_skills": "Python, PyTorch, basic machine learning",
  "available_positions": 2,
  "application_deadline": "2026-12-15"
}
```

Response (`201 Created`):

```json
{
  "id": 1,
  "title": "Deep Learning for Medical Image Analysis",
  "description": "Develop and evaluate convolutional neural networks to detect abnormalities in chest X-ray images.",
  "research_area": "Artificial Intelligence",
  "faculty_name": "Dr. Ayesha Khan",
  "department": "Computer Science",
  "required_skills": "Python, PyTorch, basic machine learning",
  "available_positions": 2,
  "application_deadline": "2026-12-15",
  "status": "Open"
}
```

### Example: validation error

Sending invalid or missing data returns `400 Bad Request`:

```json
{
  "error": "Validation failed",
  "details": [
    "title is required",
    "available_positions must be a whole number, 0 or more"
  ]
}
```

### Update and status change

`PUT /api/opportunities/:id` expects all the fields listed above. To close an opportunity, send its data with `"status": "Closed"`. If `status` is left out, the current status is kept.

### Validation rules

- `title`, `description`, `research_area`, `faculty_name`, `department`, and `required_skills` are required and cannot be blank.
- Text lengths must fit the database columns (title 200, area/name/department 100, skills 255).
- `available_positions` must be a whole number, 0 or more.
- `application_deadline` must be a real date in `YYYY-MM-DD` format.
- `status` must be `Open` or `Closed`.

## Testing Instructions

### Testing the API with Postman

1. Start the server with `npm start`.
2. Import `postman/research-portal.postman_collection.json` into Postman (**Import** button), or create the requests by hand.
3. Run the requests in this order:

   | # | Request | Expected result |
   |---|---|---|
   | 1-3 | `POST /api/opportunities` three times with different data | 201 Created |
   | 4 | `GET /api/opportunities` | 200, a list of all opportunities |
   | 5 | `GET /api/opportunities/1` | 200, one opportunity |
   | 6 | `PUT /api/opportunities/1` with changed data | 200, updated opportunity |
   | 7 | `PUT /api/opportunities/2` with `"status": "Closed"` | 200, status is Closed |
   | 8 | `DELETE /api/opportunities/3` | 200, deleted message |
   | 9 | `GET /api/opportunities/3` | 404 Not Found |
   | 10 | `POST /api/opportunities` with invalid data | 400 Bad Request |
   | 11 | `POST /api/opportunities` with an empty body `{}` | 400 Bad Request |

### Testing the frontend

1. Open http://localhost:3000.
2. Click **+ Add New Opportunity**, submit an empty form to see the validation messages, then fill it in and save.
3. Use **View**, **Edit**, **Close**, and **Delete** on a row and check the success messages.

## Security Note

The database password is stored in a local `.env` file that is listed in `.gitignore`, so it is never uploaded to GitHub. Use `.env.example` as a template for your own `.env` file.