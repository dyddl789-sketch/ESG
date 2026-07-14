package com.esg.platform.domain.esgindicator.service;

import com.esg.platform.domain.esgindicator.dto.IndicatorDto;
import com.esg.platform.domain.esgindicator.mapper.IndicatorMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class IndicatorService {

    private final IndicatorMapper indicatorMapper;

    public List<IndicatorDto> getIndicators() {
        return indicatorMapper.findAll();
    }

    public IndicatorDto createIndicator(IndicatorDto dto) {
        indicatorMapper.insert(dto);
        return indicatorMapper.findById(dto.getId());
    }

    public IndicatorDto updateIndicator(Long id, IndicatorDto dto) {
        dto.setId(id);
        indicatorMapper.update(dto);
        return indicatorMapper.findById(id);
    }

    public void deleteIndicator(Long id) {
        indicatorMapper.delete(id);
    }
}