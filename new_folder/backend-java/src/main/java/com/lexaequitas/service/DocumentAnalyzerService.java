package com.lexaequitas.service;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class DocumentAnalyzerService {

    @Autowired
    private WebClient webClient;

    public String analyseDocument(byte[] fileBytes) {

        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        builder.part("file", fileBytes)
               .filename("document.pdf")
               .contentType(MediaType.APPLICATION_OCTET_STREAM);

        return webClient.post()
                .uri("https://mpj-backend-python.onrender.com/analyse")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .bodyValue(builder.build())
                .retrieve()
                .bodyToMono(String.class)
                .block();
    }
}