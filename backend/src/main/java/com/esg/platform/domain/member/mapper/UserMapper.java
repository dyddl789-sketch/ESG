package com.esg.platform.domain.member.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.esg.platform.domain.member.entity.User;

@Mapper
public interface UserMapper {
    User findById(@Param("id") Long id);

    User findByEmail(@Param("email") String email);

    User findBySocial(@Param("provider") String provider, @Param("socialId") String socialId);

    int countByEmail(@Param("email") String email);

    int insertLocalUser(User user);

    int insertSocialUser(User user);

    int linkSocialAccount(
            @Param("userId") Long userId,
            @Param("provider") String provider,
            @Param("socialId") String socialId,
            @Param("profileImageUrl") String profileImageUrl
    );

    int updateLastLogin(@Param("userId") Long userId);

    int incrementTokenVersion(@Param("userId") Long userId);
}
