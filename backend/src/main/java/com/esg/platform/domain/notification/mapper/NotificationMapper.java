package com.esg.platform.domain.notification.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.esg.platform.domain.notification.dto.NotificationDto;

@Mapper
public interface NotificationMapper {

    List<Long> findSystemAdminUserIds(@Param("companyId") Long companyId);

    Long findMetricOwnerUserId(@Param("metricId") Long metricId);

    List<Long> findCompanyManagerUserIds(@Param("companyId") Long companyId);

    int insert(NotificationDto notification);

    NotificationDto findById(@Param("id") Long id);

    NotificationDto findByIdAndRecipient(
            @Param("id") Long id,
            @Param("recipientUserId") Long recipientUserId);

    List<NotificationDto> findByRecipient(
            @Param("recipientUserId") Long recipientUserId,
            @Param("unreadOnly") boolean unreadOnly,
            @Param("limit") int limit);

    int countUnread(@Param("recipientUserId") Long recipientUserId);

    int markRead(
            @Param("id") Long id,
            @Param("recipientUserId") Long recipientUserId);

    int markAllRead(@Param("recipientUserId") Long recipientUserId);
}
