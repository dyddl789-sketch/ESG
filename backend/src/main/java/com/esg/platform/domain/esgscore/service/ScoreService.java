package com.esg.platform.domain.esgscore.service;

import com.esg.platform.domain.esgscore.dto.ScoreDto;
import com.esg.platform.domain.esgscore.mapper.ScoreMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ScoreService {

    private final ScoreMapper scoreMapper;

    public List<ScoreDto> getScores(String reportingPeriod) {
        return scoreMapper.findByPeriod(reportingPeriod);
    }
}