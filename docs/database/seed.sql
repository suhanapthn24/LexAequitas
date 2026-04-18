-- LexAequitas sample seed data
-- Safe to run multiple times for dev/test if IDs are not fixed externally.

INSERT INTO users (email, password, name)
VALUES
  ('admin@lexaequitas.local', '$2a$10$examplehashedpasswordreplace', 'Lex Admin')
ON CONFLICT (email) DO NOTHING;

INSERT INTO cases (
    title, case_number, case_type, client_name, opposing_party,
    court_name, judge_name, next_hearing_date, description, status
)
VALUES
  (
    'State vs Rajesh Kumar',
    'CR-2026-001',
    'criminal',
    'State of X',
    'Rajesh Kumar',
    'Sessions Court',
    'Justice Sharma',
    CURRENT_DATE + INTERVAL '7 days',
    'Sample criminal matter for development testing.',
    'active'
  ),
  (
    'Agarwal vs Verma',
    'CV-2026-014',
    'civil',
    'Agarwal Enterprises',
    'Verma Holdings',
    'District Civil Court',
    'Justice Mehra',
    CURRENT_DATE + INTERVAL '14 days',
    'Sample civil dispute for testing UI and APIs.',
    'pending'
  );

INSERT INTO events (
    title, status, event_type, priority, date, case_number, client_name,
    case_id, notes, remind_days, reminded
)
VALUES
  (
    'File written submissions',
    'active',
    'DEADLINE',
    'high',
    CURRENT_TIMESTAMP + INTERVAL '2 days',
    'CR-2026-001',
    'State of X',
    NULL,
    'Submit prosecution written arguments.',
    1,
    FALSE
  ),
  (
    'Compliance review',
    'active',
    'PROCEDURAL',
    'medium',
    CURRENT_TIMESTAMP + INTERVAL '5 days',
    'CV-2026-014',
    'Agarwal Enterprises',
    NULL,
    'Review filing checklist before hearing.',
    2,
    FALSE
  );

