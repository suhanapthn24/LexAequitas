package com.lexaequitas.controller;

import com.lexaequitas.service.PrecedenceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * PrecedenceController — exposes two endpoints:
 *
 *  POST /api/precedence/search        — query-based (JSON body)
 *  POST /api/precedence/from-document — file upload (multipart)
 *  POST /api/precedence/from-argument — lightweight, from simulation flow
 */
@RestController
@RequestMapping("/api/precedence")
@CrossOrigin(origins = {"https://lexaquitas.netlify.app", "http://localhost:5173"})
public class PrecedenceController {

    @Autowired
    private PrecedenceService precedenceService;

    // ─── 1. Query-based search ──────────────────────────────────────────────

    /**
     * POST /api/precedence/search
     *
     * Body:
     * {
     *   "query": "Section 302 IPC murder case with eyewitness testimony",
     *   "case_type": "Criminal",
     *   "ipc_sections": ["Section 302 IPC", "Section 34 IPC"],
     *   "max_results": 5
     * }
     *
     * Returns: { precedents: [...], applicable_statutes: [...], legal_landscape: "..." }
     */
    @PostMapping("/search")
    public ResponseEntity<?> searchByQuery(@RequestBody Map<String, Object> request) {
        try {
            String query = (String) request.get("query");
            if (query == null || query.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Query cannot be empty"));
            }

            String caseType = (String) request.getOrDefault("case_type", "Criminal");
            int maxResults  = request.containsKey("max_results")
                    ? Integer.parseInt(request.get("max_results").toString())
                    : 5;

            @SuppressWarnings("unchecked")
            List<String> ipcSections = (List<String>) request.getOrDefault("ipc_sections", List.of());

            Map<String, Object> result = precedenceService.searchByQuery(query, caseType, ipcSections, maxResults);
            return ResponseEntity.ok(result);

        } catch (RuntimeException e) {
            return ResponseEntity.status(503).body(Map.of("error", e.getMessage()));
        }
    }

    // ─── 2. Document upload ─────────────────────────────────────────────────

    /**
     * POST /api/precedence/from-document
     * Multipart: file (PDF, DOCX, image)
     *
     * Extracts text → identifies charges → returns matching Indian precedents.
     */
    @PostMapping("/from-document")
    public ResponseEntity<?> searchByDocument(
            @RequestParam("file") MultipartFile file
    ) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
            }

            String contentType = file.getContentType() != null
                    ? file.getContentType()
                    : "application/octet-stream";

            Map<String, Object> result = precedenceService.searchByDocument(
                    file.getBytes(),
                    file.getOriginalFilename(),
                    contentType
            );
            return ResponseEntity.ok(result);

        } catch (RuntimeException e) {
            return ResponseEntity.status(503).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "File processing failed: " + e.getMessage()));
        }
    }

    // ─── 3. From argument (called by simulation after each turn) ───────────

    /**
     * POST /api/precedence/from-argument
     *
     * Body: { "argument": "...", "case_type": "Criminal" }
     *
     * Lightweight endpoint — auto-pulls 4 precedents relevant to the argument
     * just submitted. Called by the frontend after each simulation turn.
     */
    @PostMapping("/from-argument")
    public ResponseEntity<?> searchFromArgument(@RequestBody Map<String, String> request) {
        try {
            String argument = request.get("argument");
            String caseType = request.getOrDefault("case_type", "Criminal");

            if (argument == null || argument.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Argument cannot be empty"));
            }

            Map<String, Object> result = precedenceService.searchFromArgument(argument, caseType);
            return ResponseEntity.ok(result);

        } catch (RuntimeException e) {
            return ResponseEntity.status(503).body(Map.of("error", e.getMessage()));
        }
    }

    // ─── Health ─────────────────────────────────────────────────────────────

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of("status", "ok", "service", "LexAequitas Precedence Engine"));
    }
}
