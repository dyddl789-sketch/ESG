# 1. Backend
## 1.1. domain  
├── ai  
│   ├── controller  
│   │   └── [AiController.java](../../backend/src/main/java/com/esg/platform/domain/ai/controller/AiController.java)  
│   ├── dto  
│   │   └── [AiAnalyzeRequest.java](../../backend/src/main/java/com/esg/platform/domain/ai/dto/AiAnalyzeRequest.java)  
│   └── service  
│       ├── [AiAnalysisJobService.java](../../backend/src/main/java/com/esg/platform/domain/ai/service/AiAnalysisJobService.java)  
│       └── [GeminiAiService.java](../../backend/src/main/java/com/esg/platform/domain/ai/service/GeminiAiService.java)  
├── approval  
│   ├── controller  
│   │   └── [ApprovalController.java](../../backend/src/main/java/com/esg/platform/domain/ai/service/ApprovalController.java)  
│   └── dto  
│       └── [RejectRequest.java](../../backend/src/main/java/com/esg/platform/domain/approval/dto/RejectRequest.java)  
├── auditlog  
│   ├── controller  
│   │   └── [AuditLogController.java](../../backend/src/main/java/com/esg/platform/domain/auditlog/controller/AuditLogController.java)  
│   ├── dto  
│   │   └── [AuditLogResponse.java](../../backend/src/main/java/com/esg/platform/domain/auditlog/dto/AuditLogResponse.java)  
│   ├── mapper  
│   │   └── [AuditLogMapper.java](../../backend/src/main/java/com/esg/platform/domain/auditlog/mapper/AuditLogMapper.java)  
│   └── service  
│       └── [AuditLogService.java](../../backend/src/main/java/com/esg/platform/domain/auditlog/service/AuditLogService.java)  
├── auth  
│   ├── controller  
│   │   └── [AuthController.java](../../backend/src/main/java/com/esg/platform/domain/auth/controller/AuthController.java)  
│   ├── dto  
│   │   ├── [AuthConfigResponse.java](../../backend/src/main/java/com/esg/platform/domain/auth/dto/AuthConfigResponse.java)  
│   │   ├── [AuthSessionResponse.java](../../backend/src/main/java/com/esg/platform/domain/auth/dto/AuthSessionResponse.java)  
│   │   ├── [AvailabilityResponse.java](../../backend/src/main/java/com/esg/platform/domain/auth/dto/AvailabilityResponse.java)  
│   │   ├── [EmailVerificationConfirmRequest.java](../../backend/src/main/java/com/esg/platform/domain/auth/dto/EmailVerificationConfirmRequest.java)  
│   │   ├── [EmailVerificationResponse.java](../../backend/src/main/java/com/esg/platform/domain/auth/dto/EmailVerificationResponse.java)  
│   │   ├── [EmailVerificationSendRequest.java](../../backend/src/main/java/com/esg/platform/domain/auth/dto/EmailVerificationSendRequest.java)  
│   │   ├── [LoginRequest.java](../../backend/src/main/java/com/esg/platform/domain/auth/dto/LoginRequest.java)  
│   │   ├── [OAuthCodeExchangeRequest.java](../../backend/src/main/java/com/esg/platform/domain/auth/dto/OAuthCodeExchangeRequest.java)  
│   │   └── [SignupRequest.java](../../backend/src/main/java/com/esg/platform/domain/auth/dto/SignupRequest.java)  
│   ├── oauth  
│   │   ├── [EsgOAuth2User.java](../../backend/src/main/java/com/esg/platform/domain/auth/oauth/EsgOAuth2User.java)  
│   │   ├── [KakaoOAuth2UserService.java](../../backend/src/main/java/com/esg/platform/domain/auth/oauth/KakaoOAuth2UserService.java)  
│   │   ├── [OAuth2AuthenticationFailureHandler.java](../../backend/src/main/java/com/esg/platform/domain/auth/oauth/OAuth2AuthenticationFailureHandler.java)  
│   │   ├── [OAuth2AuthenticationSuccessHandler.java](../../backend/src/main/java/com/esg/platform/domain/auth/oauth/OAuth2AuthenticationSuccessHandler.java)  
│   │   └── [OAuthLoginCodeService.java](../../backend/src/main/java/com/esg/platform/domain/auth/oauth/OAuthLoginCodeService.java)  
│   └── service  
│       ├── [AuthService.java](../../backend/src/main/java/com/esg/platform/domain/auth/service/AuthService.java)  
│       ├── [EmailVerificationService.java](../../backend/src/main/java/com/esg/platform/domain/auth/service/EmailVerificationService.java)  
│       └── [IssuedAuthSession.java](../../backend/src/main/java/com/esg/platform/domain/auth/service/IssuedAuthSession.java)  
├── benchmark  
│   ├── controller  
│   │   └── [ExternalBenchmarkController.java](../../backend/src/main/java/com/esg/platform/domain/benchmark/controller/ExternalBenchmarkController.java)  
│   ├── dto  
│   │   ├── [ExternalBenchmarkResponse.java](../../backend/src/main/java/com/esg/platform/domain/benchmark/dto/ExternalBenchmarkResponse.java)  
│   │   ├── [ExternalBenchmarkSyncRun.java](../../backend/src/main/java/com/esg/platform/domain/benchmark/dto/ExternalBenchmarkSyncRun.java)  
│   │   ├── [ExternalBenchmarkValue.java](../../backend/src/main/java/com/esg/platform/domain/benchmark/dto/ExternalBenchmarkValue.java)  
│   │   └── [InternalBenchmarkAggregate.java](../../backend/src/main/java/com/esg/platform/domain/benchmark/dto/InternalBenchmarkAggregate.java)  
│   ├── mapper  
│   │   └── [ExternalBenchmarkMapper.java](../../backend/src/main/java/com/esg/platform/domain/benchmark/mapper/ExternalBenchmarkMapper.java)  
│   └── service  
│       ├── [ExternalBenchmarkPersistenceService.java](../../backend/src/main/java/com/esg/platform/domain/benchmark/service/ExternalBenchmarkPersistenceService.java)  
│       ├── [ExternalBenchmarkService.java](../../backend/src/main/java/com/esg/platform/domain/benchmark/service/ExternalBenchmarkService.java)  
│       └── [PublicDataBenchmarkClient.java](../../backend/src/main/java/com/esg/platform/domain/benchmark/service/PublicDataBenchmarkClient.java)  
├── company  
│   ├── controller  
│   │   └── [CompanyController.java](../../backend/src/main/java/com/esg/platform/domain/company/controller/CompanyController.java)  
│   ├── dto  
│   │   ├── [CompanyDto.java](../../backend/src/main/java/com/esg/platform/domain/company/dto/CompanyDto.java)  
│   │   └── [FacilityDto.java](../../backend/src/main/java/com/esg/platform/domain/company/dto/FacilityDto.java)  
│   ├── mapper  
│   │   ├── [CompanyMapper.java](../../backend/src/main/java/com/esg/platform/domain/company/mapper/CompanyMapper.java)  
│   │   └── [FacilityMapper.java](../../backend/src/main/java/com/esg/platform/domain/company/mapper/FacilityMapper.java)  
│   └── service  
│       └── [CompanyService.java](../../backend/src/main/java/com/esg/platform/domain/company/service/CompanyService.java)  
├── dashboard  
│   ├── controller  
│   │   └── [DashboardController.java](../../backend/src/main/java/com/esg/platform/domain/dashboard/controller/DashboardController.java)  
│   ├── dto  
│   │   ├── [DashboardFacilityDto.java](../../backend/src/main/java/com/esg/platform/domain/dashboard/dto/DashboardFacilityDto.java)  
│   │   ├── [DashboardKpiDto.java](../../backend/src/main/java/com/esg/platform/domain/dashboard/dto/DashboardKpiDto.java)  
│   │   ├── [DashboardScoreDto.java](../../backend/src/main/java/com/esg/platform/domain/dashboard/dto/DashboardScoreDto.java)  
│   │   └── [DashboardSummaryDto.java](../../backend/src/main/java/com/esg/platform/domain/dashboard/dto/DashboardSummaryDto.java)  
│   ├── mapper  
│   │   └── [DashboardMapper.java](../../backend/src/main/java/com/esg/platform/domain/dashboard/mapper/DashboardMapper.java)  
│   └── service  
│       └── [DashboardService.java](../../backend/src/main/java/com/esg/platform/domain/dashboard/service/DashboardService.java)  
├── documentanalysis  
│   ├── controller  
│   │   └── [DocumentAnalysisController.java](../../backend/src/main/java/com/esg/platform/domain/documentanalysis/controller/DocumentAnalysisController.java)  
│   ├── dto  
│   │   └── [DocumentAnalysisResponse.java](../../backend/src/main/java/com/esg/platform/domain/documentanalysis/dto/DocumentAnalysisResponse.java)  
│   └── service  
│       └── [DocumentAnalysisService.java](../../backend/src/main/java/com/esg/platform/domain/documentanalysis/service/DocumentAnalysisService.java)  
├── esgindicator  
│   ├── controller  
│   │   └── [IndicatorController.java](../../backend/src/main/java/com/esg/platform/domain/esgindicator/controller/IndicatorController.java)  
│   ├── dto  
│   │   └── [IndicatorDto.java](../../backend/src/main/java/com/esg/platform/domain/esgindicator/dto/IndicatorDto.java)  
│   ├── mapper  
│   │   └── [IndicatorMapper.java](../../backend/src/main/java/com/esg/platform/domain/esgindicator/mapper/IndicatorMapper.java)  
│   └── service  
│       └── [IndicatorService.java](../../backend/src/main/java/com/esg/platform/domain/esgindicator/service/IndicatorService.java)  
├── esgscore  
│   ├── controller  
│   │   └── [ScoreController.java](../../backend/src/main/java/com/esg/platform/domain/esgscore/controller/ScoreController.java)  
│   ├── dto  
│   │   └── [ScoreDto.java](../../backend/src/main/java/com/esg/platform/domain/esgscore/dto/ScoreDto.java)  
│   ├── mapper  
│   │   └── [ScoreMapper.java](../../backend/src/main/java/com/esg/platform/domain/esgscore/mapper/ScoreMapper.java)  
│   └── service  
│       └── [ScoreService.java](../../backend/src/main/java/com/esg/platform/domain/esgscore/service/ScoreService.java)  
├── integration  
│   ├── controller  
│   │   ├── [EsgCollectionController.java](../../backend/src/main/java/com/esg/platform/domain/integration/controller/EsgCollectionController.java)  
│   │   └── [IntegrationController.java](../../backend/src/main/java/com/esg/platform/domain/integration/controller/IntegrationController.java)  
│   ├── dto  
│   │   ├── [CollectionJobResponse.java](../../backend/src/main/java/com/esg/platform/domain/integration/dto/CollectionJobResponse.java)  
│   │   ├── [CollectionRunDto.java](../../backend/src/main/java/com/esg/platform/domain/integration/dto/[CollectionRunDto.java)  
│   │   ├── [EnvironmentMonthlyDto.java](../../backend/src/main/java/com/esg/platform/domain/integration/dto/EnvironmentMonthlyDto.java)  
│   │   ├── [FacilityEsgDetailDto.java](../../backend/src/main/java/com/esg/platform/domain/integration/dto/FacilityEsgDetailDto.java)  
│   │   ├── [GovernancePeriodDto.java](../../backend/src/main/java/com/esg/platform/domain/integration/dto/GovernancePeriodDto.java)  
│   │   ├── [RawDataDto.java](../../backend/src/main/java/com/esg/platform/domain/integration/dto/RawDataDto.java)  
│   │   ├── [ReflectionResponse.java](../../backend/src/main/java/com/esg/platform/domain/integration/dto/ReflectionResponse.java)  
│   │   └── [SocialMonthlyDto.java](../../backend/src/main/java/com/esg/platform/domain/integration/dto/SocialMonthlyDto.java)  
│   ├── mapper  
│   │   ├── [EsgCollectionMapper.java](../../backend/src/main/java/com/esg/platform/domain/integration/mapper/EsgCollectionMapper.java)  
│   │   └── [IntegrationMapper.java](../../backend/src/main/java/com/esg/platform/domain/integration/mapper/IntegrationMapper.java)  
│   ├── scheduler  
│   │   └── [MonthlyCollectionScheduler.java](../../backend/src/main/java/com/esg/platform/domain/integration/scheduler/MonthlyCollectionScheduler.java)  
│   └── service  
│       ├── [CollectionOperationService.java](../../backend/src/main/java/com/esg/platform/domain/integration/service/CollectionOperationService.java)  
│       ├── [EsgCollectionQueryService.java](../../backend/src/main/java/com/esg/platform/domain/integration/service/EsgCollectionQueryService.java)  
│       ├── [EsgReflectionService.java](../../backend/src/main/java/com/esg/platform/domain/integration/service/EsgReflectionService.java)  
│       └── [IntegrationService.java](../../backend/src/main/java/com/esg/platform/domain/integration/service/IntegrationService.java)  
├── member  
│   ├── dto  
│   │   └── [UserResponse.java](../../backend/src/main/java/com/esg/platform/domain/member/dto/UserResponse.java)  
│   ├── entity  
│   │   ├── [SocialProvider.java](../../backend/src/main/java/com/esg/platform/domain/member/entity/SocialProvider.java)  
│   │   ├── [User.java](../../backend/src/main/java/com/esg/platform/domain/member/entity/User.java)  
│   │   └── [UserRole.java](../../backend/src/main/java/com/esg/platform/domain/member/entity/UserRole.java)  
│   ├── mapper  
│   │   └── [UserMapper.java](../../backend/src/main/java/com/esg/platform/domain/member/mapper/UserMapper.java)  
│   └── service  
│       └── [UserService.java](../../backend/src/main/java/com/esg/platform/domain/member/service/UserService.java)  
├── metric  
│   ├── controller  
│   │   └── [MetricController.java](../../backend/src/main/java/com/esg/platform/domain/metric/controller/MetricController.java)  
│   ├── dto  
│   │   ├── [ApprovalRejectDto.java](../../backend/src/main/java/com/esg/platform/domain/metric/dto/ApprovalRejectDto.java)  
│   │   ├── [IndicatorResponse.java](../../backend/src/main/java/com/esg/platform/domain/metric/dto/IndicatorResponse.java)  
│   │   ├── [MetricBatchResult.java](../../backend/src/main/java/com/esg/platform/domain/metric/dto/MetricBatchResult.java)  
│   │   ├── [MetricCreateRequest.java](../../backend/src/main/java/com/esg/platform/domain/metric/dto/MetricCreateRequest.java)  
│   │   ├── [MetricDto.java](../../backend/src/main/java/com/esg/platform/domain/metric/dto/MetricDto.java)  
│   │   ├── [MetricHistoryDto.java](../../backend/src/main/java/com/esg/platform/domain/metric/dto/MetricHistoryDto.java)  
│   │   ├── [MetricHistoryResponse.java](../../backend/src/main/java/com/esg/platform/domain/metric/dto/MetricHistoryResponse.java)  
│   │   ├── [MetricResponse.java](../../backend/src/main/java/com/esg/platform/domain/metric/dto/MetricResponse.java)  
│   │   ├── [MetricScoreValueDto.java](../../backend/src/main/java/com/esg/platform/domain/metric/dto/MetricScoreValueDto.java)  
│   │   └── [MetricUpdateRequest.java](../../backend/src/main/java/com/esg/platform/domain/metric/dto/MetricUpdateRequest.java)  
│   ├── entity  
│   │   ├── [DataStatus.java](../../backend/src/main/java/com/esg/platform/domain/metric/entity/DataStatus.java)  
│   │   ├── [EsgCategory.java](../../backend/src/main/java/com/esg/platform/domain/metric/entity/EsgCategory.java)  
│   │   ├── [EsgIndicator.java](../../backend/src/main/java/com/esg/platform/domain/metric/entity/EsgIndicator.java)  
│   │   ├── [EsgMetricData.java](../../backend/src/main/java/com/esg/platform/domain/metric/entity/EsgMetricData.java)  
│   │   ├── [IndicatorValueType.java](../../backend/src/main/java/com/esg/platform/domain/metric/entity/IndicatorValueType.java)  
│   │   └── [PeriodType.java](../../backend/src/main/java/com/esg/platform/domain/metric/entity/PeriodType.java)  
│   ├── mapper  
│   │   ├── [ApprovalMapper.java](../../backend/src/main/java/com/esg/platform/domain/metric/mapper/ApprovalMapper.java)  
│   │   └── [MetricMapper.java](../../backend/src/main/java/com/esg/platform/domain/metric/mapper/MetricMapper.java)  
│   └── service  
│       ├── [ApprovalService.java](../../backend/src/main/java/com/esg/platform/domain/metric/service/ApprovalService.java)  
│       ├── [MetricService.java](../../backend/src/main/java/com/esg/platform/domain/metric/service/MetricService.java)  
│       └── [MetricWorkflowService.java](../../backend/src/main/java/com/esg/platform/domain/metric/service/MetricWorkflowService.java)  
├── notification  
│   ├── controller  
│   │   └── [NotificationController.java](../../backend/src/main/java/com/esg/platform/domain/notification/controller/NotificationController.java)  
│   ├── dto  
│   │   └── [NotificationDto.java](../../backend/src/main/java/com/esg/platform/domain/notification/dto/NotificationDto.java)  
│   ├── event  
│   │   └── [NotificationCreatedEvent.java](../../backend/src/main/java/com/esg/platform/domain/notification/event/NotificationCreatedEvent.java)  
│   ├── mapper  
│   │   └── [NotificationMapper.java](../../backend/src/main/java/com/esg/platform/domain/notification/mapper/NotificationMapper.java)  
│   └── service  
│       ├── [NotificationDeliveryListener.java](../../backend/src/main/java/com/esg/platform/domain/notification/service/NotificationDeliveryListener.java)  
│       └── [NotificationService.java](../../backend/src/main/java/com/esg/platform/domain/notification/service/NotificationService.java)  
├── performance  
│   ├── controller  
│   │   └── [PerformanceController.java](../../backend/src/main/java/com/esg/platform/domain/performance/controller/PerformanceController.java)  
│   ├── dto  
│   │   └── response  
│   │       └── [PerformanceResponse.java](../../backend/src/main/java/com/esg/platform/domain/performance/dto/response/PerformanceResponse.java)  
│   ├── mapper  
│   │   └── [PerformanceMapper.java](../../backend/src/main/java/com/esg/platform/domain/performance/mapper/PerformanceMapper.java)  
│   └── service  
│       └── [PerformanceService.java](../../backend/src/main/java/com/esg/platform/domain/performance/service/PerformanceService.java)  
├── reportbuild  
│   ├── controller  
│   │   ├── [ReportBuildController.java](../../backend/src/main/java/com/esg/platform/domain/reportbuild/controller/ReportBuildController.java)  
│   │   └── [ReportTemplateController.java](../../backend/src/main/java/com/esg/platform/domain/reportbuild/controller/ReportTemplateController.java)  
│   ├── dto  
│   │   ├── request  
│   │   │   └── [ReportCreateRequest.java](../../backend/src/main/java/com/esg/platform/domain/reportbuild/dto/request/ReportCreateRequest.java)  
│   │   └── response  
│   │       ├── [ReportBuildResponse.java](../../backend/src/main/java/com/esg/platform/domain/reportbuild/dto/response/ReportBuildResponse.java)  
│   │       ├── [ReportMetricResponse.java](../../backend/src/main/java/com/esg/platform/domain/reportbuild/dto/response/ReportMetricResponse.java)  
│   │       └── [ReportTemplateResponse.java](../../backend/src/main/java/com/esg/platform/domain/reportbuild/dto/response/ReportTemplateResponse.java)  
│   ├── entity  
│   │   ├── [GeneratedReport.java](../../backend/src/main/java/com/esg/platform/domain/reportbuild/entity/GeneratedReport.java)  
│   │   └── [ReportTemplate.java](../../backend/src/main/java/com/esg/platform/domain/reportbuild/entity/ReportTemplate.java)  
│   ├── exception  
│   │   └── [ReportNotFoundException.java](../../backend/src/main/java/com/esg/platform/domain/reportbuild/exception/ReportNotFoundException.java)  
│   ├── mapper  
│   │   └── [ReportBuildMapper.java](../../backend/src/main/java/com/esg/platform/domain/reportbuild/mapper/ReportBuildMapper.java)  
│   └── service  
│       └── [ReportBuildService.java](../../backend/src/main/java/com/esg/platform/domain/reportbuild/service/ReportBuildService.java)  
├── reportview  
│   ├── controller  
│   │   └── [ReportController.java](../../backend/src/main/java/com/esg/platform/domain/reportview/controller/ReportController.java)  
│   ├── dto  
│   │   └── [ReportDto.java](../../backend/src/main/java/com/esg/platform/domain/reportview/dto/ReportDto.java)  
│   ├── mapper  
│   │   └── [ReportMapper.java](../../backend/src/main/java/com/esg/platform/domain/reportview/mapper/ReportMapper.java)  
│   └── service  
│       └── [ReportService.java](../../backend/src/main/java/com/esg/platform/domain/reportview/service/ReportService.java)  
└── useradmin  
    ├── controller  
    │   └── [UserAdminController.java](../../backend/src/main/java/com/esg/platform/domain/useradmin/controller/UserAdminController.java)  
    ├── dto  
    │   ├── [DepartmentDto.java](../../backend/src/main/java/com/esg/platform/domain/useradmin/dto/DepartmentDto.java)  
    │   └── [UserAdminDto.java](../../backend/src/main/java/com/esg/platform/domain/useradmin/dto/UserAdminDto.java)  
    ├── mapper  
    │   └── [UserAdminMapper.java](../../backend/src/main/java/com/esg/platform/domain/useradmin/mapper/UserAdminMapper.java)  
    └── service  
        └── [UserAdminService.java](../../backend/src/main/java/com/esg/platform/domain/useradmin/service/UserAdminService.java)  