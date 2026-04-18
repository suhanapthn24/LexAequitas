# LexAequitas Code Directory Structure

## Top-level
```text
lexaequitas/
  .gitignore
  README.md
  frontend/
  new_folder/
    ai-service/
    backend-java/
  docs/
```

## Frontend (`frontend/`)
```text
frontend/
  package.json
  craco.config.js
  tailwind.config.js
  public/
    index.html
  src/
    App.js
    index.js
    config.js
    context/
      AuthContext.jsx
    components/
      Layout.jsx
      ui/...
    pages/
      HomePage.jsx
      ServicesPage.jsx
      AuthPage.jsx
      CaseManagementPage.jsx
      DocumentCenterPage.jsx
      ComplianceAlertsPage.jsx
      TrialSimulationPage.jsx
```

## Java Backend (`new_folder/backend-java/`)
```text
new_folder/backend-java/
  pom.xml
  Dockerfile
  src/main/resources/
    application.properties
    application.yml
  src/main/java/com/lexaequitas/
    LexaequitasApplication.java
    config/
      SecurityConfig.java
      JwtUtil.java
      JwtFilter.java
      CorsConfig.java
      WebClientConfig.java
      SecurityBeans.java
    controller/
      AuthController.java
      CaseController.java
      EventController.java
      DocumentController.java
      SimulationController.java
      PrecedenceController.java
    service/
      AuthService.java
      CaseService.java
      EventService.java
      DocumentAnalyzerService.java
      SimulationService.java
      PrecedenceService.java
    repository/
      UserRepository.java
      CaseRepository.java
      EventRepository.java
    model/
      User.java
      Case.java
      Event.java
      TrialSession.java
    scheduler/
      ReminderScheduler.java
```

## Python AI Service (`new_folder/ai-service/`)
```text
new_folder/ai-service/
  main.py
  requirements.txt
  runtime.txt
```

## Static Files
- `frontend/public/index.html`
- Frontend styles: `frontend/src/index.css`, `frontend/src/App.css`

## Full File Inventory
For every tracked file in the repository, see:
- `docs/SOURCE_FILE_INDEX.txt`

