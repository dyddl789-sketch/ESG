package com.esg.platform.domain.metric.dto;

public class MetricCompletionDto {

    private int operatingFacilityCount;
    private int environmentRequired;
    private int environmentApproved;
    private int socialRequired;
    private int socialApproved;
    private int governanceRequired;
    private int governanceApproved;

    public static MetricCompletionDto empty() {
        return new MetricCompletionDto();
    }

    public int getOperatingFacilityCount() { return operatingFacilityCount; }
    public void setOperatingFacilityCount(int operatingFacilityCount) { this.operatingFacilityCount = operatingFacilityCount; }
    public int getEnvironmentRequired() { return environmentRequired; }
    public void setEnvironmentRequired(int environmentRequired) { this.environmentRequired = environmentRequired; }
    public int getEnvironmentApproved() { return environmentApproved; }
    public void setEnvironmentApproved(int environmentApproved) { this.environmentApproved = environmentApproved; }
    public int getSocialRequired() { return socialRequired; }
    public void setSocialRequired(int socialRequired) { this.socialRequired = socialRequired; }
    public int getSocialApproved() { return socialApproved; }
    public void setSocialApproved(int socialApproved) { this.socialApproved = socialApproved; }
    public int getGovernanceRequired() { return governanceRequired; }
    public void setGovernanceRequired(int governanceRequired) { this.governanceRequired = governanceRequired; }
    public int getGovernanceApproved() { return governanceApproved; }
    public void setGovernanceApproved(int governanceApproved) { this.governanceApproved = governanceApproved; }

    public boolean isEnvironmentComplete() {
        return environmentRequired > 0 && environmentApproved >= environmentRequired;
    }

    public boolean isSocialComplete() {
        return socialRequired > 0 && socialApproved >= socialRequired;
    }

    public boolean isGovernanceComplete() {
        return governanceRequired > 0 && governanceApproved >= governanceRequired;
    }

    public boolean isOverallComplete() {
        return isEnvironmentComplete() && isSocialComplete() && isGovernanceComplete();
    }

    public int getTotalRequired() {
        return environmentRequired + socialRequired + governanceRequired;
    }

    public int getTotalApproved() {
        return environmentApproved + socialApproved + governanceApproved;
    }
}
