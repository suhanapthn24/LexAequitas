package com.lexaequitas.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
public class SimulationService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public SimulationService() {
        this.webClient = WebClient.builder()
                .baseUrl("https://mpj-backend-python.onrender.com")
                .codecs(config -> config.defaultCodecs().maxInMemorySize(2 * 1024 * 1024))
                .build();
    }

    /**
     * Sends a prosecution argument to the Python AI backend.
     * Returns the full SimulationResponse as a Map.
     */
    public Map<String, Object> sendArgument(
            String argument,
            String phase,
            String caseType,
            List<Map<String, String>> history
    ) {
        Map<String, Object> payload = Map.of(
                "argument", argument,
                "phase",    phase    != null ? phase    : "Opening",
                "case_type", caseType != null ? caseType : "Criminal",
                "history",  history  != null ? history  : List.of()
        );

        try {
            String raw = webClient.post()
                    .uri("/simulation/argument")
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(30))
                    .block();

            return objectMapper.readValue(raw, new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {});

        } catch (WebClientResponseException e) {
            throw new RuntimeException("AI backend returned error " + e.getStatusCode() + ": " + e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            throw new RuntimeException("Simulation service unavailable: " + e.getMessage(), e);
        }
    }

    /**
     * Sends a document text to get AI case summary.
     */
    public Map<String, Object> getCaseSummary(String documentText) {
        try {
            String raw = webClient.post()
                    .uri("/simulation/case-summary")
                    .bodyValue(Map.of("text", documentText))
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(30))
                    .block();

            return objectMapper.readValue(raw, new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            throw new RuntimeException("Case summary failed: " + e.getMessage(), e);
        }
    }
}