package com.fitzone.core.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/ping")
public class PingController {

    @GetMapping
    public ResponseEntity<Map<String, Object>> ping() {
        return ResponseEntity.ok(Map.of(
                "status", "OK",
                "app", "FitZone API",
                "timestamp", Instant.now().toString()));
    }
}
