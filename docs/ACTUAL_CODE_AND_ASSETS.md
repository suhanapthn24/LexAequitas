# Actual Code, Scripts, and Static Assets

## Source Code Locations
- Frontend source: `frontend/src/`
- Java backend source: `new_folder/backend-java/src/main/java/`
- Java backend configs: `new_folder/backend-java/src/main/resources/`
- Python AI service source: `new_folder/ai-service/main.py`

## Database Scripts
- `docs/database/schema.sql`
- `docs/database/seed.sql`

## Static Files
- `frontend/public/index.html`
- `frontend/src/index.css`
- `frontend/src/App.css`

## Build/Runtime Artifacts Present in Repo
- Java build output currently exists under `new_folder/backend-java/target/` (compiled classes and jars).

## Full File Index
- Use `docs/SOURCE_FILE_INDEX.txt` for complete file-by-file listing.

## Notes
- No dedicated migration framework folder (for example Flyway/Liquibase) exists currently.
- Database schema is primarily managed by Spring JPA (`ddl-auto=update`) in runtime configuration.

