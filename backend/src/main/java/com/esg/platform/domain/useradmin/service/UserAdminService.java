package com.esg.platform.domain.useradmin.service;

import com.esg.platform.domain.useradmin.dto.UserAdminDto;
import com.esg.platform.domain.useradmin.mapper.UserAdminMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserAdminService {

    private final UserAdminMapper userAdminMapper;

    public List<UserAdminDto> getUsers() {
        return userAdminMapper.findAll();
    }

    public UserAdminDto updateRole(Long id, String role) {
        userAdminMapper.updateRole(id, role);
        return userAdminMapper.findById(id);
    }

    public UserAdminDto updateActive(Long id, Boolean isActive) {
        userAdminMapper.updateActive(id, isActive);
        return userAdminMapper.findById(id);
    }

    public void deleteUser(Long id) {
        userAdminMapper.delete(id);
    }
}