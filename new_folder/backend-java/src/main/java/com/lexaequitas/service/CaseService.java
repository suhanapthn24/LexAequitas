package com.lexaequitas.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.lexaequitas.model.Case;
import com.lexaequitas.repository.CaseRepository;

import java.util.List;

@Service
public class CaseService {

    @Autowired
    private CaseRepository repo;

    public List<Case> getAllCases() {
        return repo.findAll();
    }

    public Case createCase(Case c) {
        return repo.save(c);
    }

    public Case updateCase(Long id, Case updated) {
        Case c = repo.findById(id).orElseThrow();

        if (updated.getTitle() != null) c.setTitle(updated.getTitle());
        if (updated.getCaseNumber() != null) c.setCaseNumber(updated.getCaseNumber());
        if (updated.getCaseType() != null) c.setCaseType(updated.getCaseType());
        if (updated.getClientName() != null) c.setClientName(updated.getClientName());
        if (updated.getCourtName() != null) c.setCourtName(updated.getCourtName());
        if (updated.getStatus() != null) c.setStatus(updated.getStatus());
        if (updated.getDescription() != null) c.setDescription(updated.getDescription());
        if (updated.getNextHearingDate() != null) c.setNextHearingDate(updated.getNextHearingDate());

        return repo.save(c);
    }

    public void deleteCase(Long id) {
        repo.deleteById(id);
    }
}