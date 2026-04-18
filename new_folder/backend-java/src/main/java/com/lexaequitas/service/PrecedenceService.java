package com.lexaequitas.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * PrecedenceService — pulls relevant Indian case law from the Python AI backend.
 *
 * Two modes:
 *  1. searchByQuery()  — free-text prompt or pasted argument
 *  2. searchByDocument() — multipart file (PDF, DOCX, image) forwarded to Python
 */
@Service
public class PrecedenceService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public PrecedenceService() {
        this.webClient = WebClient.builder()
                .baseUrl("https://mpj-backend-python.onrender.com")
                .codecs(cfg -> cfg.defaultCodecs().maxInMemorySize(4 * 1024 * 1024))
                .build();
    }

    // ─── Query-based precedence search ─────────────────────────────────────────

    /**
     * POST /precedence/search
     *
     * @param query       Free-text description of the legal issue, or extracted document text
     * @param caseType    Criminal | Civil | Constitutional
     * @param ipcSections List of section strings e.g. ["Section 302 IPC", "Section 34 IPC"]
     * @param maxResults  How many precedents to return (default 5)
     */
    public Map<String, Object> searchByQuery(
            String query,
            String caseType,
            List<String> ipcSections,
            int maxResults
    ) {
        Map<String, Object> payload = Map.of(
                "query",        query,
                "case_type",    caseType    != null ? caseType    : "Criminal",
                "ipc_sections", ipcSections != null ? ipcSections : List.of(),
                "max_results",  maxResults
        );

        try {
            String raw = webClient.post()
                    .uri("/precedence/search")
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(45))
                    .block();

            return objectMapper.readValue(raw, new TypeReference<Map<String, Object>>() {});

        } catch (WebClientResponseException e) {
            throw new RuntimeException(
                    "Precedence backend error " + e.getStatusCode() + ": " + e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            throw new RuntimeException("Precedence search failed: " + e.getMessage(), e);
        }
    }

    // ─── Document-based precedence search ──────────────────────────────────────

    /**
     * POST /precedence/from-document
     *
     * Forwards a multipart file to the Python backend which extracts text,
     * identifies legal issues, and returns matching precedents.
     *
     * @param fileBytes    Raw file bytes
     * @param filename     Original filename (used to detect extension)
     * @param contentType  MIME type of the file
     */
    public Map<String, Object> searchByDocument(
            byte[] fileBytes,
            String filename,
            String contentType
    ) {
        try {
            // Build multipart body and forward to Python
            String raw = webClient.post()
                    .uri("/precedence/from-document")
                    .header("Content-Type", "multipart/form-data")
                    .bodyValue(buildMultipartBody(fileBytes, filename, contentType))
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(60))
                    .block();

            return objectMapper.readValue(raw, new TypeReference<Map<String, Object>>() {});

        } catch (WebClientResponseException e) {
            throw new RuntimeException(
                    "Document precedence error " + e.getStatusCode() + ": " + e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            throw new RuntimeException("Document precedence search failed: " + e.getMessage(), e);
        }
    }

    /**
     * Build a Spring WebFlux MultiValueMap for multipart file upload.
     * We use the lower-level approach to stay compatible with WebClient.
     */
    private org.springframework.util.MultiValueMap<String, Object> buildMultipartBody(
            byte[] fileBytes, String filename, String contentType
    ) {
        org.springframework.util.LinkedMultiValueMap<String, Object> body =
                new org.springframework.util.LinkedMultiValueMap<>();

        // Wrap the byte array as a named file part
        org.springframework.core.io.ByteArrayResource resource =
                new org.springframework.core.io.ByteArrayResource(fileBytes) {
                    @Override
                    public String getFilename() { return filename; }
                };

        org.springframework.http.HttpHeaders partHeaders = new org.springframework.http.HttpHeaders();
        partHeaders.setContentType(org.springframework.http.MediaType.parseMediaType(contentType));

        body.add("file", new org.springframework.http.HttpEntity<>(resource, partHeaders));
        return body;
    }

    // ─── Convenience: precedence from argument text (used by simulation flow) ──

    /**
     * Lightweight wrapper — called after a simulation round to auto-fetch
     * cases relevant to the prosecution argument just submitted.
     */
    public Map<String, Object> searchFromArgument(String argument, String caseType) {
        return searchByQuery(argument, caseType, List.of(), 4);
    }
}
