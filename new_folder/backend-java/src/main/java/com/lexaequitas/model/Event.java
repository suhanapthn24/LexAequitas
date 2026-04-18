package com.lexaequitas.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDateTime;

@Entity
@Table(name = "events")
// FIX: Ignore unknown JSON fields the frontend might send (e.g. _parsedDate)
// instead of throwing a deserialization 500.
@JsonIgnoreProperties(ignoreUnknown = true)
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    private String status = "active";

    @Enumerated(EnumType.STRING)
    private EventType eventType;

    // FIX: priority field added — frontend sends "critical"|"high"|"medium"|"low"
    private String priority = "medium";

    private LocalDateTime date;
    private String location;

    private String caseNumber;
    private String clientName;

    // FIX: caseId added — frontend sends this on create
    private Long caseId;

    @Column(columnDefinition = "TEXT")
    private String notes;

    private String notifyEmail;
    private Integer remindDays = 1;
    private Boolean reminded = false;

    // FIX: Use @PrePersist instead of a field initializer for LocalDateTime.
    // Field initializers on LocalDateTime confuse Hibernate's dirty-checker and
    // can cause serialization failures before the object is ever persisted.
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt  = LocalDateTime.now();
        if (reminded  == null) reminded   = false;
        if (status    == null || status.isBlank())   status   = "active";
        if (priority  == null || priority.isBlank()) priority = "medium";
    }

    public enum EventType {
        // ── Alert types sent by the frontend ──
        DEADLINE,
        RISK,
        PROCEDURAL,
        GENERAL,
        // ── Legacy event types (kept for existing DB rows) ──
        HEARING,
        DEPOSITION,
        CLIENT_MEETING,
        OTHER
    }

    // ── Getters & Setters ──────────────────────────────────────────────────────

    public Long getId() { return id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public EventType getEventType() { return eventType; }
    public void setEventType(EventType eventType) { this.eventType = eventType; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public LocalDateTime getDate() { return date; }
    public void setDate(LocalDateTime date) { this.date = date; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getCaseNumber() { return caseNumber; }
    public void setCaseNumber(String caseNumber) { this.caseNumber = caseNumber; }

    public String getClientName() { return clientName; }
    public void setClientName(String clientName) { this.clientName = clientName; }

    public Long getCaseId() { return caseId; }
    public void setCaseId(Long caseId) { this.caseId = caseId; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getNotifyEmail() { return notifyEmail; }
    public void setNotifyEmail(String notifyEmail) { this.notifyEmail = notifyEmail; }

    public Integer getRemindDays() { return remindDays; }
    public void setRemindDays(Integer remindDays) { this.remindDays = remindDays; }

    public Boolean getReminded() { return reminded; }
    public void setReminded(Boolean reminded) { this.reminded = reminded; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}