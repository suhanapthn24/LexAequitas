# LexAequitas User Manual

## 1. Accessing the Platform
1. Open the frontend URL in browser (local default: `http://localhost:3000`).
2. Use **Sign In** if you already have an account.
3. Use **Register** to create a new account.

## 2. Authentication
### Register
1. Go to **Auth** page.
2. Switch to **Register** tab.
3. Enter full name, email, password, confirm password.
4. Click **Create Account**.

### Login
1. Go to **Auth** page.
2. Enter email and password.
3. Click **Sign In**.
4. On success, you are redirected to case dashboard.

## 3. Case Management
Path: `/cases`

### Create Case
1. Click **New Case**.
2. Fill required fields: case title, case number, client name.
3. Add optional legal and hearing details.
4. Click **Create Case**.

### Edit Case
1. Open a case card.
2. Click edit action.
3. Update required fields.
4. Click **Update Case**.

### Delete Case
1. Open a case card.
2. Click delete action.
3. Confirm deletion.

### Filters
- Search by title, number, client, court, judge.
- Filter by case status.
- Filter by case type.

## 4. Document Center
Path: `/documents`

### Upload and Analyze Document
1. Click upload/add document action.
2. Enter title and document type.
3. Select file (`pdf`, `docx`, or supported image format).
4. Submit upload.
5. Wait for AI analysis steps to complete.
6. Review generated legal analysis panel.

### View/Download
- View document cards and metadata.
- Download stored analysis JSON when available.

## 5. Compliance Alerts
Path: `/alerts`

### Create Alert
1. Open add-alert dialog.
2. Enter title and description.
3. Select type (`deadline`, `risk`, `procedural`, `general`).
4. Select due date and priority.
5. Optionally link to a case.
6. Save alert.

### Manage Alerts
- Resolve alert to mark status as `resolved`.
- Delete alert if no longer needed.
- Use month/week/day views for schedule visualization.

## 6. Trial Simulation
Path: `/simulation`

### Start a Trial Argument Round
1. Select case type (for example Criminal, Civil).
2. Select phase (Opening, Examination, Cross, Closing).
3. Enter prosecution argument text.
4. Submit argument.
5. Review:
   - Defense response
   - Judge response and ruling
   - Confidence scores
   - Suggested precedents
   - Coaching tips and weaknesses

### Precedent Search Modes
- Query-based precedent search.
- Document-based precedent extraction.
- Argument-based quick precedent lookup after each round.

## 7. Common Troubleshooting
- Login fails: verify credentials and backend availability.
- Upload fails: verify backend + AI service are both running.
- No AI response: verify Python service is reachable and LLM key is configured.
- Calendar not updating: refresh after event create/resolve if network latency occurs.

