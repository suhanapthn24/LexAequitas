package com.lexaequitas.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.lexaequitas.model.Case;

public interface CaseRepository extends JpaRepository<Case, Long> {
}