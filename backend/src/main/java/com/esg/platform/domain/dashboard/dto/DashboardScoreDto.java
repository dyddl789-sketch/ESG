package com.esg.platform.domain.dashboard.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import com.fasterxml.jackson.annotation.JsonProperty;

public class DashboardScoreDto {
    private String period;
    private BigDecimal totalScore;

    @JsonProperty("environmentScore")
    private BigDecimal environmentScore;

    @JsonProperty("socialScore")
    private BigDecimal socialScore;

    @JsonProperty("governanceScore")
    private BigDecimal governanceScore;

    private String grade;
    private OffsetDateTime calculatedAt;

    public String getPeriod() { return period; }
    public void setPeriod(String period) { this.period = period; }
    public BigDecimal getTotalScore() { return totalScore; }
    public void setTotalScore(BigDecimal totalScore) { this.totalScore = totalScore; }
    public BigDecimal getEnvironmentScore() { return environmentScore; }
    public void setEnvironmentScore(BigDecimal environmentScore) { this.environmentScore = environmentScore; }
    public BigDecimal getSocialScore() { return socialScore; }
    public void setSocialScore(BigDecimal socialScore) { this.socialScore = socialScore; }
    public BigDecimal getGovernanceScore() { return governanceScore; }
    public void setGovernanceScore(BigDecimal governanceScore) { this.governanceScore = governanceScore; }
    public String getGrade() { return grade; }
    public void setGrade(String grade) { this.grade = grade; }
    public OffsetDateTime getCalculatedAt() { return calculatedAt; }
    public void setCalculatedAt(OffsetDateTime calculatedAt) { this.calculatedAt = calculatedAt; }
}
