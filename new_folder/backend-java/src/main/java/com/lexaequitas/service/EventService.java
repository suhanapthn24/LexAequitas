package com.lexaequitas.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.lexaequitas.model.Event;
import com.lexaequitas.repository.EventRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class EventService {

    @Autowired
    private EventRepository repo;

    public List<Event> getAllEvents() {
        return repo.findAll();
    }

    public Event createEvent(Event event) {
        // Ensure reminded flag defaults to false on every new event
        event.setReminded(false);
        // Default status to "active" if the caller omits it
        if (event.getStatus() == null || event.getStatus().isBlank()) {
            event.setStatus("active");
        }
        return repo.save(event);
    }

    public List<Event> getUpcoming(int days) {
        return repo.findByDateBetweenOrderByDateAsc(
                LocalDateTime.now(),
                LocalDateTime.now().plusDays(days)
        );
    }

    // FIX: resolveEvent now sets status to "resolved" (lowercase) to match
    // what the frontend expects when it checks  a.status === "resolved"
    public Event resolveEvent(Long id) {
        Event event = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found: " + id));
        event.setStatus("resolved");
        return repo.save(event);
    }

    public void deleteEvent(Long id) {
        if (!repo.existsById(id)) {
            throw new RuntimeException("Event not found: " + id);
        }
        repo.deleteById(id);
    }
}