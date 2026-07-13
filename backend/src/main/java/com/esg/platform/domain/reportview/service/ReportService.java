package com.esg.platform.domain.reportview.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.esg.platform.domain.reportview.dto.ReportDto;
import com.esg.platform.domain.reportview.mapper.ReportMapper;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportMapper reportMapper;

    public List<ReportDto> getReports() {
        return reportMapper.findAll();
    }
}