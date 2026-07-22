package com.esg.platform.domain.ai.dto;

import jakarta.validation.constraints.NotBlank;

public record AiAnalyzeRequest(@NotBlank String domain, @NotBlank String prompt) {}
