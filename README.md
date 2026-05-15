
# EQUIPMENT MAINTENANCE MANAGEMENT SYSTEM (EMMS)

## Run Locally

1. Open MySQL and run the SQL files in this order:

```sql
SOURCE backend/database/schema.sql;
SOURCE backend/database/trigger.sql;
SOURCE backend/database/stored_procedure.sql;
SOURCE backend/database/sample_data.sql;
```

2. Configure backend environment:

```bash
cd backend
cp .env.example .env
```

Update `.env` with your MySQL username and password.

3. Install and start:

```bash
npm install
npm start
```

4. Open:

```text
http://localhost:5000
```

## Sample Logins

```text
Admin: admin / admin123
Technician: tech1 / tech123
Supervisor: supervisor / super123
```
>>>>>>> f6b19d9 (Initial Commit)
