// 부서 목록 조회용
package com.esg.platform.domain.useradmin.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class DepartmentDto {
    private Long id;

    @JsonProperty("dept_name")
    private String deptName;

    @JsonProperty("facility_name")
    private String facilityName;
}