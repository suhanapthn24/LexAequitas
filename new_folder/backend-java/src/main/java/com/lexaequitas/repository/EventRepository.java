package com.lexaequitas.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.lexaequitas.model.Event;

import java.time.LocalDateTime;
import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {

    List<Event> findByDateBetweenOrderByDateAsc(LocalDateTime start, LocalDateTime end);

    List<Event> findByRemindedFalse();
}