package com.lexaequitas.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.lexaequitas.model.Case;
import com.lexaequitas.service.CaseService;

import java.util.List;

@RestController
@RequestMapping("/api/cases")
public class CaseController {

    @Autowired
    private CaseService service;

    @GetMapping
    public List<Case> getAll() {
        return service.getAllCases();
    }

    @PostMapping
    public Case create(@RequestBody Case c) {
        return service.createCase(c);
    }

    @PutMapping("/{id}")
    public Case update(@PathVariable Long id, @RequestBody Case c) {
        return service.updateCase(id, c);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.deleteCase(id);
    }
}