package com.lexaequitas.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.lexaequitas.model.Event;
import com.lexaequitas.service.EventService;

import java.util.List;

@RestController
@RequestMapping("/api/events")
// FIX: Removed @CrossOrigin(origins = "*") — CORS is now handled exclusively
// in SecurityConfig.corsConfigurationSource(). Having it in both places caused
// Spring to merge two conflicting CORS configs and throw the 500.
public class EventController {

    @Autowired
    private EventService service;

    @GetMapping
    public List<Event> getAll() {
        return service.getAllEvents();
    }

    @PostMapping
    public ResponseEntity<Event> create(@RequestBody Event event) {
        Event saved = service.createEvent(event);
        return ResponseEntity.status(201).body(saved);
    }

    @GetMapping("/upcoming")
    public List<Event> upcoming(@RequestParam int days) {
        return service.getUpcoming(days);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteEvent(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/resolve")
    public ResponseEntity<Event> resolve(@PathVariable Long id) {
        Event resolved = service.resolveEvent(id);
        return ResponseEntity.ok(resolved);
    }
}