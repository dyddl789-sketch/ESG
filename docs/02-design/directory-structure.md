# 1. Backend
## 1.1. domain  
├── ai  
│   ├── controller  
│   │   └── [AiController.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/ai/controller/AiController.java)  
│   ├── dto  
│   │   └── [AiAnalyzeRequest.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/ai/dto/AiAnalyzeRequest.java)  
│   └── service  
│       ├── [AiAnalysisJobService.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/ai/service/AiAnalysisJobService.java)  
│       └── [GeminiAiService.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/ai/service/GeminiAiService.java)  
├── approval  
│   ├── controller  
│   │   └── [ApprovalController.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/approval/controller/ApprovalController.java)  
│   └── dto  
│       └── [RejectRequest.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/approval/dto/RejectRequest.java)  
├── auditlog  
│   ├── controller  
│   │   └── [AuditLogController.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/auditlog/controller/AuditLogController.java)  
│   ├── dto  
│   │   └── [AuditLogResponse.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/auditlog/dto/AuditLogResponse.java)  
│   ├── mapper  
│   │   └── [AuditLogMapper.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/auditlog/mapper/AuditLogMapper.java)  
│   └── service  
│       └── [AuditLogService.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/auditlog/service/AuditLogService.java)  
├── auth  
│   ├── controller  
│   │   └── [AuthController.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/auth/controller/AuthController.java)  
│   ├── dto  
│   │   ├── [AuthConfigResponse.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/auth/dto/AuthConfigResponse.java)  
│   │   ├── [AuthSessionResponse.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/auth/dto/AuthSessionResponse.java)  
│   │   ├── [AvailabilityResponse.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/auth/dto/AvailabilityResponse.java)  
│   │   ├── [EmailVerificationConfirmRequest.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/auth/dto/EmailVerificationConfirmRequest.java)  
│   │   ├── [EmailVerificationResponse.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/auth/dto/EmailVerificationResponse.java)  
│   │   ├── [EmailVerificationSendRequest.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/auth/dto/EmailVerificationSendRequest.java)  
│   │   ├── [LoginRequest.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/auth/dto/LoginRequest.java)  
│   │   ├── [OAuthCodeExchangeRequest.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/auth/dto/OAuthCodeExchangeRequest.java)  
│   │   └── [SignupRequest.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/auth/dto/SignupRequest.java)  
│   ├── oauth  
│   │   ├── [EsgOAuth2User.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/auth/oauth/EsgOAuth2User.java)  
│   │   ├── [KakaoOAuth2UserService.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/auth/oauth/KakaoOAuth2UserService.java)  
│   │   ├── [OAuth2AuthenticationFailureHandler.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/auth/oauth/OAuth2AuthenticationFailureHandler.java)  
│   │   ├── [OAuth2AuthenticationSuccessHandler.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/auth/oauth/OAuth2AuthenticationSuccessHandler.java)  
│   │   └── [OAuthLoginCodeService.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/auth/oauth/OAuthLoginCodeService.java)  
│   └── service  
│       ├── [AuthService.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/auth/service/AuthService.java)  
│       ├── [EmailVerificationService.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/auth/service/EmailVerificationService.java)  
│       └── [IssuedAuthSession.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/auth/service/IssuedAuthSession.java)  
├── benchmark  
│   ├── controller  
│   │   └── [ExternalBenchmarkController.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/benchmark/controller/ExternalBenchmarkController.java)  
│   ├── dto  
│   │   ├── [ExternalBenchmarkResponse.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/benchmark/dto/ExternalBenchmarkResponse.java)  
│   │   ├── [ExternalBenchmarkSyncRun.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/benchmark/dto/ExternalBenchmarkSyncRun.java)  
│   │   ├── [ExternalBenchmarkValue.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/benchmark/dto/ExternalBenchmarkValue.java)  
│   │   └── [InternalBenchmarkAggregate.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/benchmark/dto/InternalBenchmarkAggregate.java)  
│   ├── mapper  
│   │   └── [ExternalBenchmarkMapper.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/benchmark/mapper/ExternalBenchmarkMapper.java)  
│   └── service  
│       ├── [ExternalBenchmarkPersistenceService.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/benchmark/service/ExternalBenchmarkPersistenceService.java)  
│       ├── [ExternalBenchmarkService.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/benchmark/service/ExternalBenchmarkService.java)  
│       └── [PublicDataBenchmarkClient.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/benchmark/service/PublicDataBenchmarkClient.java)  
├── company  
│   ├── controller  
│   │   └── [CompanyController.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/company/controller/CompanyController.java)  
│   ├── dto  
│   │   ├── [CompanyDto.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/company/dto/CompanyDto.java)  
│   │   └── [FacilityDto.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/company/dto/FacilityDto.java)  
│   ├── mapper  
│   │   ├── [CompanyMapper.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/company/mapper/CompanyMapper.java)  
│   │   └── [FacilityMapper.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/company/mapper/FacilityMapper.java)  
│   └── service  
│       └── [CompanyService.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/company/service/CompanyService.java)  
├── dashboard  
│   ├── controller  
│   │   └── [DashboardController.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/dashboard/controller/DashboardController.java)  
│   ├── dto  
│   │   ├── [DashboardFacilityDto.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/dashboard/dto/DashboardFacilityDto.java)  
│   │   ├── [DashboardKpiDto.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/dashboard/dto/DashboardKpiDto.java)  
│   │   ├── [DashboardScoreDto.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/dashboard/dto/DashboardScoreDto.java)  
│   │   └── [DashboardSummaryDto.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/dashboard/dto/DashboardSummaryDto.java)  
│   ├── mapper  
│   │   └── [DashboardMapper.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/dashboard/mapper/DashboardMapper.java)  
│   └── service  
│       └── [DashboardService.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/dashboard/service/DashboardService.java)  
├── documentanalysis  
│   ├── controller  
│   │   └── [DocumentAnalysisController.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/documentanalysis/controller/DocumentAnalysisController.java)  
│   ├── dto  
│   │   └── [DocumentAnalysisResponse.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/documentanalysis/dto/DocumentAnalysisResponse.java)  
│   └── service  
│       └── [DocumentAnalysisService.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/documentanalysis/service/DocumentAnalysisService.java)  
├── esgindicator  
│   ├── controller  
│   │   └── [IndicatorController.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/esgindicator/controller/IndicatorController.java)  
│   ├── dto  
│   │   └── [IndicatorDto.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/esgindicator/dto/IndicatorDto.java)  
│   ├── mapper  
│   │   └── [IndicatorMapper.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/esgindicator/mapper/IndicatorMapper.java)  
│   └── service  
│       └── [IndicatorService.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/esgindicator/service/IndicatorService.java)  
├── esgscore  
│   ├── controller  
│   │   └── [ScoreController.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/esgscore/controller/ScoreController.java)  
│   ├── dto  
│   │   └── [ScoreDto.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/esgscore/dto/ScoreDto.java)  
│   ├── mapper  
│   │   └── [ScoreMapper.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/esgscore/mapper/ScoreMapper.java)  
│   └── service  
│       └── [ScoreService.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/esgscore/service/ScoreService.java)  
├── integration  
│   ├── controller  
│   │   ├── [EsgCollectionController.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/integration/controller/EsgCollectionController.java)  
│   │   └── [IntegrationController.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/integration/controller/IntegrationController.java)  
│   ├── dto  
│   │   ├── [CollectionJobResponse.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/integration/dto/CollectionJobResponse.java)  
│   │   ├── [CollectionRunDto.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/integration/dto/[CollectionRunDto.java)  
│   │   ├── [EnvironmentMonthlyDto.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/integration/dto/EnvironmentMonthlyDto.java)  
│   │   ├── [FacilityEsgDetailDto.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/integration/dto/FacilityEsgDetailDto.java)  
│   │   ├── [GovernancePeriodDto.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/integration/dto/GovernancePeriodDto.java)  
│   │   ├── [RawDataDto.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/integration/dto/RawDataDto.java)  
│   │   ├── [ReflectionResponse.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/integration/dto/ReflectionResponse.java)  
│   │   └── [SocialMonthlyDto.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/integration/dto/SocialMonthlyDto.java)  
│   ├── mapper  
│   │   ├── [EsgCollectionMapper.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/integration/mapper/EsgCollectionMapper.java)  
│   │   └── [IntegrationMapper.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/integration/mapper/IntegrationMapper.java)  
│   ├── scheduler  
│   │   └── [MonthlyCollectionScheduler.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/integration/scheduler/MonthlyCollectionScheduler.java)  
│   └── service  
│       ├── [CollectionOperationService.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/integration/service/CollectionOperationService.java)  
│       ├── [EsgCollectionQueryService.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/integration/service/EsgCollectionQueryService.java)  
│       ├── [EsgReflectionService.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/integration/service/EsgReflectionService.java)  
│       └── [IntegrationService.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/integration/service/IntegrationService.java)  
├── member  
│   ├── dto  
│   │   └── [UserResponse.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/member/dto/UserResponse.java)  
│   ├── entity  
│   │   ├── [SocialProvider.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/member/entity/SocialProvider.java)  
│   │   ├── [User.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/member/entity/User.java)  
│   │   └── [UserRole.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/member/entity/UserRole.java)  
│   ├── mapper  
│   │   └── [UserMapper.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/member/mapper/UserMapper.java)  
│   └── service  
│       └── [UserService.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/member/service/UserService.java)  
├── metric  
│   ├── controller  
│   │   └── [MetricController.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/metric/controller/MetricController.java)  
│   ├── dto  
│   │   ├── [ApprovalRejectDto.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/metric/dto/ApprovalRejectDto.java)  
│   │   ├── [IndicatorResponse.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/metric/dto/IndicatorResponse.java)  
│   │   ├── [MetricBatchResult.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/metric/dto/MetricBatchResult.java)  
│   │   ├── [MetricCreateRequest.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/metric/dto/MetricCreateRequest.java)  
│   │   ├── [MetricDto.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/metric/dto/MetricDto.java)  
│   │   ├── [MetricHistoryDto.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/metric/dto/MetricHistoryDto.java)  
│   │   ├── [MetricHistoryResponse.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/metric/dto/MetricHistoryResponse.java)  
│   │   ├── [MetricResponse.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/metric/dto/MetricResponse.java)  
│   │   ├── [MetricScoreValueDto.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/metric/dto/MetricScoreValueDto.java)  
│   │   └── [MetricUpdateRequest.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/metric/dto/MetricUpdateRequest.java)  
│   ├── entity  
│   │   ├── [DataStatus.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/metric/entity/DataStatus.java)  
│   │   ├── [EsgCategory.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/metric/entity/EsgCategory.java)  
│   │   ├── [EsgIndicator.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/metric/entity/EsgIndicator.java)  
│   │   ├── [EsgMetricData.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/metric/entity/EsgMetricData.java)  
│   │   ├── [IndicatorValueType.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/metric/entity/IndicatorValueType.java)  
│   │   └── [PeriodType.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/metric/entity/PeriodType.java)  
│   ├── mapper  
│   │   ├── [ApprovalMapper.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/metric/mapper/ApprovalMapper.java)  
│   │   └── [MetricMapper.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/metric/mapper/MetricMapper.java)  
│   └── service  
│       ├── [ApprovalService.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/metric/service/ApprovalService.java)  
│       ├── [MetricService.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/metric/service/MetricService.java)  
│       └── [MetricWorkflowService.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/metric/service/MetricWorkflowService.java)  
├── notification  
│   ├── controller  
│   │   └── [NotificationController.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/notification/controller/NotificationController.java)  
│   ├── dto  
│   │   └── [NotificationDto.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/notification/notification/dto/NotificationDto.java)  
│   ├── event  
│   │   └── [NotificationCreatedEvent.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/notification/event/NotificationCreatedEvent.java)  
│   ├── mapper  
│   │   └── [NotificationMapper.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/notification/mapper/NotificationMapper.java)  
│   └── service  
│       ├── [NotificationDeliveryListener.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/notification/service/NotificationDeliveryListener.java)  
│       └── [NotificationService.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/notification/service/NotificationService.java)  
├── performance  
│   ├── controller  
│   │   └── [PerformanceController.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/performance/controller/PerformanceController.java)  
│   ├── dto  
│   │   └── response  
│   │       └── [PerformanceResponse.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/performance/dto/response/PerformanceResponse.java)  
│   ├── mapper  
│   │   └── [PerformanceMapper.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/performance/mapper/PerformanceMapper.java)  
│   └── service  
│       └── [PerformanceService.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/service/PerformanceService.java)  
├── reportbuild  
│   ├── controller  
│   │   ├── [ReportBuildController.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/reportbuild/controller/ReportBuildController.java)  
│   │   └── [ReportTemplateController.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/reportbuild/controller/ReportTemplateController.java)  
│   ├── dto  
│   │   ├── request  
│   │   │   └── [ReportCreateRequest.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/reportbuild/dto/request/ReportCreateRequest.java)  
│   │   └── response  
│   │       ├── [ReportBuildResponse.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/reportbuild/dto/response/ReportBuildResponse.java)  
│   │       ├── [ReportMetricResponse.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/reportbuild/dto/response/ReportMetricResponse.java)  
│   │       └── [ReportTemplateResponse.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/reportbuild/dto/response/ReportTemplateResponse.java)  
│   ├── entity  
│   │   ├── [GeneratedReport.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/reportbuild/entity/GeneratedReport.java)  
│   │   └── [ReportTemplate.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/reportbuild/entity/ReportTemplate.java)  
│   ├── exception  
│   │   └── [ReportNotFoundException.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/reportbuild/exception/ReportNotFoundException.java)  
│   ├── mapper  
│   │   └── [ReportBuildMapper.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/reportbuild/mapper/ReportBuildMapper.java)  
│   └── service  
│       └── [ReportBuildService.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/reportbuild/service/ReportBuildService.java)  
├── reportview  
│   ├── controller  
│   │   └── [ReportController.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/reportview/controller/ReportController.java)  
│   ├── dto  
│   │   └── [ReportDto.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/reportview/dto/ReportDto.java)  
│   ├── mapper  
│   │   └── [ReportMapper.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/reportview/mapper/ReportMapper.java)  
│   └── service  
│       └── [ReportService.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/reportview/service/ReportService.java)  
└── useradmin  
    ├── controller  
    │   └── [UserAdminController.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/controller/UserAdminController.java)  
    ├── dto  
    │   ├── [DepartmentDto.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/useradmin/dto/DepartmentDto.java)  
    │   └── [UserAdminDto.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/useradmin/dto/UserAdminDto.java)  
    ├── mapper  
    │   └── [UserAdminMapper.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/useradmin/mapper/UserAdminMapper.java)  
    └── service  
        └── [UserAdminService.java](https://github.com/dyddl789-sketch/ESG/blob/develop/backend/src/main/java/com/esg/platform/domain/useradmin/service/UserAdminService.java)  