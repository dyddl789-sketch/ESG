package com.esg.platform.domain.useradmin.service;

import com.esg.platform.domain.useradmin.dto.DepartmentDto;
import com.esg.platform.domain.useradmin.dto.UserAdminDto;
import com.esg.platform.domain.useradmin.mapper.UserAdminMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserAdminService {

    private final UserAdminMapper userAdminMapper;
    private final PasswordEncoder passwordEncoder;

    private static final String PASSWORD_CHARS =
            "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    private static final SecureRandom RANDOM = new SecureRandom();

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

    // 반환값에 임시 비밀번호를 담아서 화면에 안내할 수 있게 함
    public UserCreationResult createUser(UserAdminDto dto) {
        String tempPassword = generateTempPassword();
        dto.setPasswordHash(passwordEncoder.encode(tempPassword));

        userAdminMapper.insert(dto);
        UserAdminDto created = userAdminMapper.findById(dto.getId());

        return new UserCreationResult(created, tempPassword);
    }

    private String generateTempPassword() {
        StringBuilder sb = new StringBuilder(12);
        for (int i = 0; i < 12; i++) {
            sb.append(PASSWORD_CHARS.charAt(RANDOM.nextInt(PASSWORD_CHARS.length())));
        }
        return sb.toString();
    }
    
    public List<DepartmentDto> getDepartments() {
        return userAdminMapper.findAllDepartments();
    }

    public record UserCreationResult(UserAdminDto user, String tempPassword) {}
}