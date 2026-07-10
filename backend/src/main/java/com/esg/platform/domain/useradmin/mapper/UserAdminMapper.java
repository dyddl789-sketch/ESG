package com.esg.platform.domain.useradmin.mapper;

import com.esg.platform.domain.useradmin.dto.UserAdminDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface UserAdminMapper {
    List<UserAdminDto> findAll();
    UserAdminDto findById(@Param("id") Long id);
    void updateRole(@Param("id") Long id, @Param("role") String role);
    void updateActive(@Param("id") Long id, @Param("isActive") Boolean isActive);
    void delete(@Param("id") Long id);
}