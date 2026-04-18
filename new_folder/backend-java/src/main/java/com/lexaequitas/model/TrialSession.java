package com.lexaequitas.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class TrialSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @SuppressWarnings("unused")
    private String caseTitle;

    @Column(columnDefinition = "TEXT")
    private String history;

    @SuppressWarnings("unused")
    private LocalDateTime createdAt = LocalDateTime.now();
}