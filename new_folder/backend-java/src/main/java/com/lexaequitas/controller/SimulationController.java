package com.lexaequitas.controller;

import com.lexaequitas.service.SimulationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/simulation")
@CrossOrigin(origins = {"https://lexaquitas.netlify.app", "http://localhost:5173"})
public class SimulationController {

    @Autowired
    private SimulationService simulationService;

    /**
     * POST /api/simulation/argue
     * Body: {
     *   "argument": "...",
     *   "phase": "Opening|Examination|Cross|Closing",
     *   "case_type": "Criminal|Civil|Constitutional",
     *   "history": [{"role":"user","content":"..."}]
     * }
     */
    @PostMapping("/argue")
    public ResponseEntity<?> argue(@RequestBody Map<String, Object> request) {
        try {
            String argument = (String) request.get("argument");
            String phase    = (String) request.getOrDefault("phase", "Opening");
            String caseType = (String) request.getOrDefault("case_type", "Criminal");

            @SuppressWarnings("unchecked")
            List<Map<String, String>> history =
                    (List<Map<String, String>>) request.getOrDefault("history", List.of());

            if (argument == null || argument.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Argument cannot be empty"));
            }

            Map<String, Object> result = simulationService.sendArgument(argument, phase, caseType, history);
            return ResponseEntity.ok(result);

        } catch (RuntimeException e) {
            return ResponseEntity.status(503).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/simulation/case-summary
     * Body: { "text": "raw case document text" }
     */
    @PostMapping("/case-summary")
    public ResponseEntity<?> caseSummary(@RequestBody Map<String, String> request) {
        try {
            String text = request.get("text");
            if (text == null || text.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Document text required"));
            }
            Map<String, Object> result = simulationService.getCaseSummary(text);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.status(503).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/simulation/health
     */
    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of("status", "ok", "service", "LexAequitas Spring Gateway"));
    }
}