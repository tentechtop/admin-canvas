# Admin Canvas 系统接口文档

> 生成时间：2026-05-07  
> 生成依据：`src/api/*.ts`、`src/types/*.ts`、页面调用逻辑  
> 说明：本文档以当前前端项目实际接入接口为准；字段备注结合类型声明和页面用途整理，少量描述为基于现有代码的业务推断。

## 1. 通用约定

### 1.1 基础地址

| 项 | 来源 | 说明 |
| --- | --- | --- |
| 认证接口基地址 | `VITE_API_BASE_URL` | 用于登录、登出、获取菜单等接口 |
| 业务接口基地址 | `VITE_BIZ_API_BASE_URL` | 用于 KOL 管理、结算中心、营销中心、分析中心、系统配置等接口 |
| 平台编码 | `VITE_PLATFORM_CODE`，默认 `kol` | 菜单、角色权限、KOL 业务默认平台标识 |

### 1.2 鉴权方式

所有已登录接口会自动在请求头中带上以下字段：

| 请求头 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `Authorization` | `string` | 是 | 格式通常为 `Bearer {token}` |
| `token` | `string` | 是 | 与 `Authorization` 中的 token 相同，兼容后端旧鉴权方式 |

### 1.3 标准响应体

大部分认证接口、KOL 管理接口、结算中心接口、分析中心接口使用以下标准响应结构：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `success` | `boolean` | 请求是否成功 |
| `message` | `string` | 后端返回消息 |
| `value` | `T` | 业务数据主体 |

示例：

```json
{
  "success": true,
  "message": "ok",
  "value": {}
}
```

### 1.4 特殊响应体

部分模块不是 `value` 包裹，而是直接返回顶层业务字段：

| 模块 | 顶层业务字段 | 说明 |
| --- | --- | --- |
| 营销中心列表接口 | `items`、`total` | 如素材列表、活动列表、链接列表、审核记录列表 |
| 营销中心详情/保存接口 | `item` | 如素材详情、活动详情、分类项详情 |
| 营销工作台汇总 | `materials`、`activities` | 分别是素材和活动状态统计 |
| 推广链接汇总 | `summary` | Affinex 推广链接总览 |
| 文件存储配置 | `item` | 文件存储配置对象 |

### 1.5 401 处理

接口返回 `401` 时，前端会清空本地 token，并跳转登录页。

### 1.6 数组查询参数序列化

结算中心部分 GET 接口会把数组参数展开成重复 query 参数，例如：

```text
status=PENDING&status=APPROVED
orderType=0&orderType=2
withdrawStatus=APPLIED&withdrawStatus=PAID
```

## 2. 接口分层目录

| 一级模块 | 二级模块 | 说明 |
| --- | --- | --- |
| 登录与菜单 | 登录、登出、用户详情、菜单树 | 管理后台基础认证与菜单加载 |
| KOL 管理接口 | 角色与数据权限 | 角色可见范围、管理员用户、权限关系配置 |
| KOL 管理接口 | 审核与资料 | 流量审核、KYC 审核、资料详情、BD 归属、佣金比例 |
| KOL 管理接口 | 列表与报表 | KOL 列表、KOL 绩效、客户明细、客户报表、交易报表、账单报表 |
| 佣金结算中心 | Dashboard、佣金单、结算单、付款汇总、交易明细、KOL 佣金明细 | 结算链路主流程 |
| 营销中心 | 工作台、分类、素材、活动、审核、推广链接、文件对象 | 营销配置和内容运营 |
| Affinex 分析中心 | 推广链接汇总、各维度分析页、看板配置 | 统计分析和图表配置 |
| 系统配置 | 文件存储配置 | 文件上传/访问配置 |

---

## 3. 登录与菜单

### 3.1 接口清单

| 接口名称 | 方法 | 路径 | 请求模型 | 返回模型 | 说明 |
| --- | --- | --- | --- | --- | --- |
| 管理员登录 | `POST` | `/api/v1/sso/admin/login` | `AdminUserLoginReq` | `ApiResponse<AdminUserLoginReply>` | 后台登录 |
| 获取当前管理员详情 | `POST` | `/api/v1/sso/admin/detail` | `AdminUserDetailReq` | `ApiResponse<AdminUserDetailReply>` | 根据 token 获取用户详情 |
| 管理员登出 | `POST` | `/api/v1/sso/admin/logout` | 无 | `ApiResponse<unknown>` | 退出登录 |
| 获取当前用户菜单 | `POST` | `/api/v1/admin/user/menu` | `GetUserMenuReq` | `ApiResponse<GetUserMenuReply>` | 返回资源树和菜单动作 |

### 3.2 数据模型

#### 3.2.1 `AdminUserLoginReq`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `email` | `string` | 是 | 登录邮箱 |
| `password` | `string` | 是 | 登录密码 |

#### 3.2.2 `AdminUserLoginReply`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `token` | `string` | 否 | 登录成功后返回的会话令牌 |
| `userDetail` | `AdminUserDetail` | 否 | 当前管理员详情 |

#### 3.2.3 `AdminUserDetail`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `userInfo` | `AdminUserInfo` | 否 | 用户基本信息 |
| `loginInfo` | `AdminUserLoginInfo` | 否 | 最近登录信息 |
| `roleInfo` | `AdminUserRoleInfo[]` | 否 | 用户绑定的平台角色列表 |

#### 3.2.4 `AdminUserInfo`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `username` | `string` | 否 | 用户名 |
| `userId` | `string` | 否 | 用户唯一 ID |
| `createdAt` | `number` | 否 | 创建时间时间戳 |
| `status` | `USER_UNKNOWN \| USER_NORMAL \| USER_DISABLE` | 否 | 用户状态 |
| `email` | `string` | 否 | 邮箱 |

#### 3.2.5 `AdminUserLoginInfo`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `lastLoginTime` | `string` | 否 | 最近登录时间 |
| `lastLoginIp` | `string` | 否 | 最近登录 IP |

#### 3.2.6 `AdminUserRoleInfo`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `roleCode` | `string` | 否 | 角色编码 |
| `roleName` | `string` | 否 | 角色名称 |
| `platformId` | `number` | 否 | 平台 ID |

#### 3.2.7 `GetUserMenuReq`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `platformCode` | `string` | 是 | 平台编码，默认 `kol` |

#### 3.2.8 `GetUserMenuReply`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `resourceList` | `ResourceInfo[]` | 否 | 菜单资源树 |

#### 3.2.9 `ResourceInfo`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `resourceCode` | `string` | 否 | 资源编码，前端动态页面路由的核心键 |
| `resourceName` | `string` | 否 | 资源名称 |
| `remark` | `string` | 否 | 资源备注 |
| `parentId` | `number` | 否 | 父资源 ID |
| `path` | `string` | 否 | 前端路由路径 |
| `sort` | `number` | 否 | 排序号 |
| `depth` | `number` | 否 | 资源层级深度 |
| `icon` | `string` | 否 | 图标名 |
| `appName` | `string` | 否 | 应用名称 |
| `kidResource` | `ResourceInfo[]` | 否 | 子资源列表，递归结构 |
| `actions` | `string[]` | 否 | 页面可用动作集合，如 `add`、`edit`、`delete` |
| `type` | `number` | 否 | 资源类型，代码注释中 `1=菜单，2=功能/按钮` |

---

## 4. KOL 管理接口

### 4.1 角色与数据权限

#### 4.1.1 接口清单

| 接口名称 | 方法 | 路径 | 请求模型 | 返回模型 | 说明 |
| --- | --- | --- | --- | --- | --- |
| 获取管理员用户列表 | `GET` | `/admin/auth/users` | `AuthUserQuery` | `ApiResponse<AuthUserListValue>` | 根据平台和角色查询管理员 |
| 获取角色数据权限列表 | `GET` | `/admin/role-data-permissions/roles` | `platformCode` | `ApiResponse<RoleDataPermissionListValue>` | 查询平台下角色的数据权限配置 |
| 保存角色数据权限 | `POST` | `/admin/role-data-permissions` | `RoleDataPermissionSavePayload` | `ApiResponse<RoleDataPermissionConfig>` | 新增或更新角色权限 |
| 删除角色数据权限 | `DELETE` | `/admin/role-data-permissions/{id}` | 路径参数 `id` | `ApiResponse<boolean>` | 删除角色数据权限配置 |

#### 4.1.2 数据模型

##### `AuthUserQuery`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `platformCode` | `string` | 是 | 平台编码，一般为 `kol` |
| `roleCodes` | `string[]` | 是 | 角色编码数组，如 `KOL_BD`、`KOL_ADMIN` |
| `keyword` | `string` | 否 | 用户名/邮箱关键字搜索 |

##### `AuthUserInfo`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `adminId` | `number` | 否 | 管理员 ID |
| `uid` | `string` | 否 | 用户唯一标识 |
| `username` | `string` | 否 | 用户名 |
| `email` | `string` | 否 | 邮箱 |
| `roleCodes` | `string[]` | 否 | 角色编码列表 |
| `roleNames` | `string[]` | 否 | 角色名称列表 |
| `platformId` | `number` | 否 | 平台 ID |
| `platformCode` | `string` | 否 | 平台编码 |

##### `AuthUserListValue`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `total` | `number` | 否 | 总记录数 |
| `list` | `AuthUserInfo[]` | 否 | 管理员列表 |

##### `RoleDataPermissionRelation`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `resourceCode` | `string` | 否 | 资源编码，如 `kol`、`affiliate`、`payment_summary` |
| `actionCode` | `string` | 否 | 动作编码，如 `list`、`detail`、`export` |
| `scopeType` | `ALL \| SELF \| NONE \| string` | 否 | 数据范围：全部/本人/无权限 |

##### `RoleDataPermissionConfig`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `number` | 否 | 配置主键 |
| `roleId` | `number` | 否 | 角色 ID |
| `roleCode` | `string` | 否 | 角色编码 |
| `roleName` | `string` | 否 | 角色名称 |
| `platformCode` | `string` | 否 | 平台编码 |
| `configured` | `boolean` | 否 | 是否已经存在权限配置 |
| `enabled` | `boolean` | 否 | 是否启用 |
| `remark` | `string` | 否 | 备注 |
| `permissions` | `RoleDataPermissionRelation[]` | 否 | 资源动作与数据范围关系集合 |
| `roleExistsInAuth` | `boolean` | 否 | 该角色是否在认证中心中存在 |

##### `RoleDataPermissionListValue`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `total` | `number` | 否 | 角色配置总数 |
| `list` | `RoleDataPermissionConfig[]` | 否 | 角色配置列表 |

##### `RoleDataPermissionSavePayload`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `number` | 否 | 配置 ID；传值表示更新，不传表示新增 |
| `platformCode` | `string` | 是 | 平台编码 |
| `roleCode` | `string` | 是 | 角色编码 |
| `enabled` | `boolean` | 是 | 是否启用 |
| `remark` | `string` | 否 | 备注 |
| `permissions` | `RoleDataPermissionRelation[]` | 是 | 权限关系集合 |

> 现有页面里 KOL 场景常用资源集合包括：`kol`、`affiliate`、`campaign_application`、`performance_application`、`payment`、`payment_summary`、`customer_report`。

### 4.2 审核与资料

#### 4.2.1 接口清单

| 接口名称 | 方法 | 路径 | 请求模型 | 返回模型 | 说明 |
| --- | --- | --- | --- | --- | --- |
| 流量审核列表 | `GET` | `/affiliate/list` | `AffiliateAuditQuery` | `ApiResponse<AffiliateAuditListValue>` | 查询 KOL 流量审核记录 |
| KYC 审核列表 | `GET` | `/admin/affiliate/kycReview` | `AffiliateAuditQuery` | `ApiResponse<AffiliateAuditListValue>` | 查询 KYC 审核记录 |
| KOL 信息统计列表 | `GET` | `/admin/kolUserStatistics` | `AffiliateAuditQuery` | `ApiResponse<AffiliateAuditListValue>` | 查询 KOL 信息统计/只读列表 |
| 获取审核详情原始数据 | `GET` | `/audit` | `affiliateId` | `ApiResponse<Record<string, unknown>>` | 获取单个 KOL 原始审核详情 |
| 获取资料与日志整合详情 | `GET` | `/admin/affiliate/detail_with_logs` | `affiliateId` | `ApiResponse<AffiliateDetailWithLogsValue>` | 获取基础资料及多类日志 |
| 获取通用变更日志 | `GET` | `/affiliate/change_logs` | `affiliateId` | `ApiResponse<AffiliateReviewLogValue>` | 获取资料变更日志 |
| 获取流量审核日志 | `GET` | `/admin/affiliate/getAffiliateTrafficResourceStatusLog` | `affiliateId` | `ApiResponse<AffiliateReviewLogValue>` | 获取流量审核日志 |
| 获取 KYC 审核日志 | `GET` | `/admin/affiliate/getAffiliateIdKycStatusLog` | `affiliateId` | `ApiResponse<AffiliateReviewLogValue>` | 获取 KYC 审核日志 |
| 更新审核状态 | `PUT` | `/affiliate` | `AffiliateReviewUpdatePayload` | `ApiResponse<Record<string, unknown>>` | 更新流量状态/KYC 状态/账号类型/BD 归属 |
| 更新 KYC 资料 | `PUT` | `/admin/kolKycUpdate` | `KolKycUpdatePayload` | `ApiResponse<Record<string, unknown>>` | 编辑个人或企业 KYC 资料 |
| 审核资料修改申请 | `POST` | `/admin/affiliate/reviewModificationApplication` | `AffiliateModificationReviewPayload` | `ApiResponse<Record<string, unknown>>` | 审批 KYC/流量资料修改申请 |
| 修改 BD Owner | `POST` | `/admin/affiliate/bd_owner` | `AffiliateBdOwnerUpdatePayload` | `ApiResponse<Record<string, unknown>>` | 单独变更 BD 所有人 |
| 更新佣金比例 | `POST` | `/admin/affiliate/commission_rate` | `AffiliateCommissionRateUpdatePayload` | `ApiResponse<unknown>` | 更新 spread 比例和 tier |
| 获取佣金比例日志 | `GET` | `/admin/affiliate/getAffiliateCommissionRateLog` | `affiliateId` | `ApiResponse<AffiliateCommissionRateLogValue>` | 获取佣金比例变更日志 |
| 获取流量审核聚合数 | `GET` | `/affiliate/countALL/review/traffic` | 无 | `ApiResponse<ReviewAggregateCountValue>` | 待审/通过/拒绝数量 |
| 获取 KYC 审核聚合数 | `GET` | `/affiliate/countALL/review/kyc` | 无 | `ApiResponse<ReviewAggregateCountValue>` | 待审/通过/拒绝数量 |

#### 4.2.2 状态枚举

##### `TrafficReviewStatus`

| 值 | 说明 |
| --- | --- |
| `PENDING` | 待审核 |
| `APPROVED` | 已通过 |
| `REJECTED` | 已拒绝 |

##### `KycReviewStatus`

| 值 | 说明 |
| --- | --- |
| `PENDING` | 待审核 |
| `APPROVED` | 已通过 |
| `DOCUMENTS_REJECTED` | 资料驳回 |
| `NOT_APPLIED` | 尚未提交 KYC |
| `ACCOUNT_CLOSED` | 账户关闭 |

##### `ModificationReviewAction`

| 值 | 说明 |
| --- | --- |
| `APPROVE` | 通过修改申请 |
| `REJECT` | 驳回修改申请 |

#### 4.2.3 数据模型

##### `AffiliateAuditQuery`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `currentPage` | `number \| string` | 否 | 当前页 |
| `pageSize` | `number \| string` | 否 | 每页条数 |
| `startDate` | `string` | 否 | 起始日期，常用于申请/创建时间筛选 |
| `endDate` | `string` | 否 | 结束日期 |
| `mail` | `string` | 否 | 邮箱筛选 |
| `affiliateCode` | `string` | 否 | KOL 编码筛选 |
| `referralCode` | `string` | 否 | 渠道码/推广码筛选 |
| `name` | `string` | 否 | 姓名筛选 |
| `countryCodes` | `string` | 否 | 国家编码筛选，代码中按字符串传递 |
| `owner` | `string` | 否 | BD Owner/Admin ID |
| `inviteCode` | `string` | 否 | 邀请码 |
| `shortLink` | `string` | 否 | 短链接 |
| `trafficStatus` | `string` | 否 | 流量审核状态 |
| `idKYCStatus` | `string` | 否 | KYC 状态 |
| `showTestAccount` | `number \| string` | 否 | 是否显示测试账号 |
| `sort` | `string` | 否 | 排序方向 |
| `sortField` | `string` | 否 | 排序字段 |
| `sortModel` | `string` | 否 | 排序模式 |
| `adminId` | `string \| number` | 否 | 当前管理员/数据范围 ID |
| `liveAccount` | `string` | 否 | 交易账户 |

##### `AffiliateAuditListValue`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `total` | `number` | 否 | 总条数 |
| `totalPages` | `number` | 否 | 总页数 |
| `pageSize` | `number` | 否 | 每页条数 |
| `currentPage` | `number` | 否 | 当前页 |
| `resultList` | `AffiliateAuditRow[]` | 否 | 列表数据 |

##### `AffiliateAuditRow`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `affiliateId` | `string` | 否 | KOL 主键 ID |
| `affiliateCode` | `string` | 否 | KOL 编码 |
| `referralCode` | `string` | 否 | 推广渠道码/来源码 |
| `name` | `string` | 否 | KOL 名称 |
| `mail` | `string` | 否 | 邮箱 |
| `tier` | `string` | 否 | 佣金档位 |
| `countryCode` | `string` | 否 | 国家编码 |
| `compensationModel` | `string` | 否 | 佣金模式 |
| `rs` | `boolean` | 否 | 是否固定佣金或特殊标记位 |
| `owner` | `string` | 否 | Owner 名称 |
| `inviteCode` | `string` | 否 | 邀请码 |
| `shortLink` | `string` | 否 | 短链接 |
| `websites` | `string[]` | 否 | 网站/投放站点集合 |
| `trafficSource` | `string[]` | 否 | 流量来源集合 |
| `commissionRate` | `number \| string` | 否 | 当前佣金比例 |
| `accountType` | `string` | 否 | 账号类型，如个人/企业 |
| `createTime` | `string` | 否 | 创建时间 |
| `auditTime` | `string` | 否 | 审核时间 |
| `trafficAuditTime` | `string` | 否 | 流量审核时间 |
| `trafficResourceStatus` | `string` | 否 | 流量审核状态 |
| `trafficResourceApprovedBy` | `string` | 否 | 流量审核人 |
| `reviewerUsernameSnapshot` | `string` | 否 | 审核人用户名快照 |
| `idKYCStatus` | `string` | 否 | KYC 状态 |
| `idApproverNotes` | `string` | 否 | KYC 审核备注 |
| `applicationTime` | `string` | 否 | 申请时间 |
| `reviewer` | `string` | 否 | 审核人 |
| `reviewTime` | `string` | 否 | 复核/审核时间 |
| `remark` | `string` | 否 | 通用备注 |
| `bdOwnerAdminId` | `string` | 否 | BD Owner 管理员 ID |
| `bdOwnerUsernameSnapshot` | `string` | 否 | BD Owner 名称快照 |
| `bdChangeLog` | `string[]` | 否 | BD 归属变更日志摘要 |
| `totalUser` | `number \| string` | 否 | 关联用户总数 |

##### `AffiliateReviewUpdatePayload`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `affiliateId` | `string` | 是 | KOL ID |
| `accountType` | `string` | 否 | 账号类型 |
| `idKYCStatus` | `string` | 否 | 目标 KYC 状态 |
| `idApproverNotes` | `string` | 否 | KYC 审核备注 |
| `trafficResourceStatus` | `string` | 否 | 目标流量审核状态 |
| `bdOwnerAdminId` | `string` | 否 | BD Owner 管理员 ID |
| `bdOwnerUsernameSnapshot` | `string` | 否 | BD Owner 名称快照 |

##### `KolKycIndividualPayload`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `affiliateId` | `string` | 否 | KOL ID |
| `address` | `string` | 否 | 地址 |
| `birthday` | `string` | 否 | 生日 |
| `city` | `string` | 否 | 城市 |
| `firstName` | `string` | 否 | 名 |
| `idNumber` | `string` | 否 | 证件号 |
| `idType` | `string` | 否 | 证件类型 |
| `img` | `string` | 否 | 证件图片地址 |
| `imgContent` | `string` | 否 | 证件图片内容/Base64 |
| `lastName` | `string` | 否 | 姓 |
| `mitradeLiveAccount` | `string` | 否 | Mitrade 实盘账号 |
| `otherPhone` | `string` | 否 | 其他电话 |
| `phone` | `string` | 否 | 电话 |
| `number` | `string` | 否 | 证件编号，兼容旧字段 |
| `proofOfAddressImg` | `string` | 否 | 地址证明图 |
| `proofOfAddressImgContent` | `string` | 否 | 地址证明图内容/Base64 |
| `type` | `string` | 否 | 证件类型旧字段 |
| `state` | `string` | 否 | 州/省 |
| `zip` | `string` | 否 | 邮编 |

##### `KolKycCompanyPayload`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `affiliateId` | `string` | 否 | KOL ID |
| `address` | `string` | 否 | 地址 |
| `birthday` | `string` | 否 | 生日/注册日期兼容字段 |
| `city` | `string` | 否 | 城市 |
| `companyName` | `string` | 否 | 公司名称 |
| `companyRegCertImg` | `string` | 否 | 公司注册证明图片 |
| `companyRegCertImgContent` | `string` | 否 | 公司注册证明图片内容/Base64 |
| `companyRegNumber` | `string` | 否 | 公司注册号 |
| `firstName` | `string` | 否 | 联系人名 |
| `img` | `string` | 否 | 证件图片 |
| `imgContent` | `string` | 否 | 证件图片内容/Base64 |
| `lastName` | `string` | 否 | 联系人姓 |
| `mainOfficePhone` | `string` | 否 | 办公电话 |
| `mitradeLiveAccount` | `string` | 否 | Mitrade 实盘账号 |
| `number` | `string` | 否 | 证件编号 |
| `officeAddress` | `string` | 否 | 办公地址 |
| `officeCity` | `string` | 否 | 办公城市 |
| `officeZip` | `string` | 否 | 办公邮编 |
| `otherPhone` | `string` | 否 | 其他电话 |
| `phone` | `string` | 否 | 电话 |
| `proofOfAddressImg` | `string` | 否 | 地址证明图 |
| `proofOfAddressImgContent` | `string` | 否 | 地址证明图内容/Base64 |
| `state` | `string` | 否 | 州/省 |
| `type` | `string` | 否 | 证件类型 |
| `zip` | `string` | 否 | 邮编 |

##### `KolKycUpdatePayload`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `affiliateId` | `string` | 是 | KOL ID |
| `accountType` | `string` | 否 | `INDIVIDUAL` 或 `COMPANY` |
| `individual` | `KolKycIndividualPayload` | 否 | 个人 KYC 资料 |
| `company` | `KolKycCompanyPayload` | 否 | 企业 KYC 资料 |

##### `AffiliateModificationReviewPayload`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `affiliateId` | `string` | 是 | KOL ID |
| `logId` | `number` | 是 | 修改申请日志 ID |
| `action` | `APPROVE \| REJECT` | 是 | 审批动作 |
| `remark` | `string` | 否 | 审批备注 |

##### `AffiliateCommissionRateUpdatePayload`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `affiliateId` | `string` | 是 | KOL ID |
| `tier` | `string` | 是 | 佣金档位 |
| `spreadPercentage` | `number` | 是 | spread 比例 |

##### `AffiliateBdOwnerUpdatePayload`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `affiliateId` | `string` | 是 | KOL ID |
| `bdOwnerAdminId` | `string` | 是 | 新 BD Owner 管理员 ID |
| `bdOwnerUsernameSnapshot` | `string` | 是 | 新 BD Owner 名称快照 |
| `remark` | `string` | 否 | 变更备注 |

##### `ReviewAggregateCountValue`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `pending` | `number` | 否 | 待审核数量 |
| `approved` | `number` | 否 | 已通过数量 |
| `rejected` | `number` | 否 | 已拒绝数量 |

##### `AffiliateDetailWithLogsValue`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `affiliateBase` | `AffiliateBaseDetail \| null` | 否 | 资料主表 |
| `trafficQualificationAuditLogs` | `AffiliateReviewLogEntry[]` | 否 | 流量审核日志 |
| `kycAuditLogs` | `AffiliateReviewLogEntry[]` | 否 | KYC 审核日志 |
| `bdOwnerChangeLogs` | `AffiliateBDOwnerChangeLogDetail[]` | 否 | BD Owner 变更日志 |
| `commissionChangeLogs` | `AffiliateReviewLogEntry[]` | 否 | 佣金比例变更日志 |
| `otherChangeLogs` | `AffiliateReviewLogEntry[]` | 否 | 其他日志 |

##### `AffiliateBaseDetail`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `affiliateId` | `string` | 否 | KOL ID |
| `mail` | `string` | 否 | 邮箱 |
| `name` | `string` | 否 | 名称 |
| `password` | `string` | 否 | 密码或加密占位值 |
| `countryCode` | `string` | 否 | 国家编码 |
| `compensationModel` | `string` | 否 | 佣金模式 |
| `referralCode` | `string` | 否 | 推广码 |
| `paypalAccount` | `string` | 否 | PayPal 账号 |
| `receiveUpdateMailSetting` | `string` | 否 | 是否接收更新邮件 |
| `receiveTransReportMailSetting` | `string` | 否 | 是否接收交易报表邮件 |
| `updateTime` | `string` | 否 | 更新时间 |
| `createTime` | `string` | 否 | 创建时间 |
| `idAccountType` | `string` | 否 | KYC 账号类型 |
| `idFirstName` | `string` | 否 | 名 |
| `idLastName` | `string` | 否 | 姓 |
| `idPhone` | `string` | 否 | 电话 |
| `idOtherPhone` | `string` | 否 | 其他电话 |
| `idAddress` | `string` | 否 | 地址 |
| `idCity` | `string` | 否 | 城市 |
| `idZip` | `string` | 否 | 邮编 |
| `idType` | `string` | 否 | 证件类型 |
| `idNumber` | `string` | 否 | 证件号 |
| `idBirthday` | `string` | 否 | 生日 |
| `idProofOfAddressImg` | `string` | 否 | 地址证明图 |
| `idImg` | `string` | 否 | 证件图 |
| `idCompanyName` | `string` | 否 | 公司名 |
| `idMainOfficePhone` | `string` | 否 | 办公电话 |
| `idCompanyReg` | `string` | 否 | 公司注册号 |
| `idOfficeAddress` | `string` | 否 | 办公地址 |
| `idOfficeCity` | `string` | 否 | 办公城市 |
| `idOfficeZip` | `string` | 否 | 办公邮编 |
| `idCompanyRegCertImg` | `string` | 否 | 公司注册证明图 |
| `idApprovedBy` | `string` | 否 | KYC 审核人 |
| `idApproverNotes` | `string` | 否 | KYC 审核说明 |
| `idTimestamp` | `string` | 否 | KYC 审核时间 |
| `shortLink` | `string` | 否 | 默认短链 |
| `isTest` | `number \| string` | 否 | 是否测试账号 |
| `deleted` | `number \| string` | 否 | 是否删除 |
| `idMitradeLiveAccount` | `string` | 否 | 关联实盘账号 |
| `trafficResourceStatus` | `string` | 否 | 流量审核状态 |
| `trafficResourceApprovedBy` | `string` | 否 | 流量审核人 |
| `idKycStatus` | `string` | 否 | KYC 状态 |
| `paymentMethods` | `string` | 否 | 支付方式 JSON 或文本 |
| `idState` | `string` | 否 | 州/省 |
| `lastSyncPerformanceDate` | `string` | 否 | 最近同步绩效时间 |
| `inviteCode` | `string` | 否 | 邀请码 |
| `campaignCost` | `string` | 否 | 活动成本 |
| `campaignStartDate` | `string` | 否 | 活动开始时间 |
| `affiliateCode` | `string` | 否 | KOL 编码 |
| `utmSource` | `string` | 否 | UTM 来源 |

##### `AffiliateReviewLogEntry`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `number \| string` | 否 | 日志 ID |
| `affiliateId` | `string` | 否 | KOL ID |
| `bizType` | `string` | 否 | 业务大类 |
| `bizSubType` | `string` | 否 | 业务子类 |
| `attemptNo` | `number \| string` | 否 | 第几次审核/提交 |
| `createTime` | `string` | 否 | 创建时间 |
| `updateTime` | `string` | 否 | 更新时间 |
| `operationTime` | `string` | 否 | 操作时间 |
| `auditTime` | `string` | 否 | 审核时间 |
| `action` | `string` | 否 | 动作码 |
| `actionName` | `string` | 否 | 动作名 |
| `operationType` | `string` | 否 | 操作类型 |
| `eventType` | `string` | 否 | 事件类型 |
| `status` | `string` | 否 | 当前状态 |
| `oldStatus` | `string` | 否 | 旧状态 |
| `newStatus` | `string` | 否 | 新状态 |
| `beforeStatus` | `string` | 否 | 变更前状态 |
| `afterStatus` | `string` | 否 | 变更后状态 |
| `fromStatus` | `string` | 否 | 来源状态 |
| `toStatus` | `string` | 否 | 目标状态 |
| `trafficResourceStatus` | `string` | 否 | 流量审核状态快照 |
| `idKYCStatus` | `string` | 否 | KYC 状态快照 |
| `changeKey` | `string` | 否 | 变更字段键 |
| `changeData` | `string` | 否 | 变更前后 JSON 文本 |
| `operator` | `string` | 否 | 操作人文本 |
| `operatorId` | `string` | 否 | 操作人 ID |
| `operatorName` | `string` | 否 | 操作人姓名 |
| `operatorType` | `string` | 否 | 操作人类型 |
| `approvedBy` | `string` | 否 | 审批人 |
| `updatedBy` | `string` | 否 | 更新人 |
| `createdBy` | `string` | 否 | 创建人 |
| `username` | `string` | 否 | 用户名 |
| `userName` | `string` | 否 | 用户名兼容字段 |
| `adminName` | `string` | 否 | 管理员名 |
| `accountType` | `string` | 否 | 账号类型 |
| `bdOwnerUsernameSnapshot` | `string` | 否 | BD Owner 快照 |
| `owner` | `string` | 否 | Owner |
| `remark` | `string` | 否 | 备注 |
| `reason` | `string` | 否 | 原因 |
| `description` | `string` | 否 | 描述 |
| `notes` | `string` | 否 | 说明 |
| `comment` | `string` | 否 | 评论/审核意见 |
| `message` | `string` | 否 | 文本消息 |
| `source` | `string` | 否 | 来源系统 |
| `relatedTable` | `string` | 否 | 关联表 |
| `relatedId` | `string` | 否 | 关联记录 ID |
| `requestId` | `string` | 否 | 请求链路 ID |

##### `AffiliateBDOwnerChangeLogDetail`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `recordId` | `number \| string` | 否 | 记录 ID |
| `affiliateId` | `string` | 否 | KOL ID |
| `bdOwnerAdminId` | `number \| string` | 否 | BD Owner 管理员 ID |
| `bdOwnerUsernameSnapshot` | `string` | 否 | BD Owner 名称快照 |
| `changeTime` | `string` | 否 | 变更时间 |
| `createdTime` | `string` | 否 | 创建时间 |
| `updatedTime` | `string` | 否 | 更新时间 |
| `changeLog` | `AffiliateReviewLogEntry \| null` | 否 | 对应日志详情 |

##### `AffiliateCommissionRateLogValue`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `affiliateId` | `string` | 否 | KOL ID |
| `spreadPercentage` | `number \| string` | 否 | 当前比例 |
| `logs` | `AffiliateReviewLogEntry[]` | 否 | 佣金比例变更日志 |

---

### 4.3 列表、报表与画像

#### 4.3.1 接口清单

| 接口名称 | 方法 | 路径 | 请求模型 | 返回模型 | 说明 |
| --- | --- | --- | --- | --- | --- |
| KOL 用户列表 | `GET` | `/kol_user/list` | `KolUserQuery` | `ApiResponse<KolUserListValue>` | 查询 KOL 关联用户 |
| KOL 绩效统计 | `GET` | `/kol_performance/admin` | `KolPerformanceQuery` | `ApiResponse<KolPerformanceListValue>` | 查询 KOL 绩效数据 |
| KOL 活动概览列表 | `GET` | `/affiliate/campaign/list` | `AffiliateCampaignListQuery` | `ApiResponse<AffiliateCampaignListValue>` | 查询 Affiliate 活动概览 |
| 客户详情列表 | `GET` | `/customer/details` | `CustomerDetailsQuery` | `ApiResponse<CustomerDetailValue>` | 查询 Affiliate 关联客户详情 |
| 客户报表 | `GET` | `/report/customer` | `CustomerReportQuery` | `ApiResponse<CustomerReportValue>` | 客户转化报表 |
| 绩效报表 | `GET` | `/report/performance` | `PerformanceReportQuery` | `ApiResponse<PerformanceReportValue>` | 按天/维度的绩效报表 |
| 交易报表 | `GET` | `/report/trade` | `TradeReportQuery` | `ApiResponse<TradeReportValue>` | 交易明细/按品种报表 |
| 当前账单 | `GET` | `/payment/current` | `affiliateId` | `ApiResponse<PaymentCurrentValue>` | 查询当前账单及佣金明细 |
| 历史账单 | `GET` | `/payment/history_new` | `affiliateId + 筛选` | `ApiResponse<PaymentHistoryValue>` | 查询历史账单 |
| 账单佣金明细 | `GET` | `/payment/commission` | `affiliateId + paymentId/期间` | `ApiResponse<PaymentCommissionValue>` | 查询单账单佣金行 |

#### 4.3.2 数据模型

##### `KolUserQuery`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `adminId` | `string` | 否 | 当前管理员/数据范围 ID |
| `tradingAccountNumber` | `string` | 否 | 交易账号 |
| `affiliateCode` | `string` | 否 | KOL 编码 |
| `affiliateName` | `string` | 否 | KOL 名称 |
| `affiliateMail` | `string` | 否 | KOL 邮箱 |
| `medium` | `string` | 否 | 渠道来源 |
| `showTestingAccounts` | `number \| string` | 否 | 是否展示测试账号 |
| `registrationDateStart` | `string` | 否 | 注册起始时间 |
| `registrationDateEnd` | `string` | 否 | 注册结束时间 |
| `page` | `number \| string` | 否 | 页码 |
| `pageSize` | `number \| string` | 否 | 页大小 |

##### `KolUserRow`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `liveAccount` | `string` | 否 | 客户实盘账号 |
| `registrationDate` | `string` | 否 | 注册时间 |
| `customerCountry` | `string` | 否 | 客户国家 |
| `medium` | `string` | 否 | 渠道来源 |
| `affiliateCode` | `string` | 否 | KOL 编码 |
| `affiliateName` | `string` | 否 | KOL 名称 |
| `affiliateMail` | `string` | 否 | KOL 邮箱 |

##### `KolUserListValue`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `total` | `number` | 否 | 总记录数 |
| `userInfo` | `KolUserRow[]` | 否 | 用户列表 |

##### `KolPerformanceQuery`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `adminId` | `string` | 否 | 当前管理员/数据范围 ID |
| `affiliateCode` | `string` | 否 | KOL 编码 |
| `page` | `number \| string` | 否 | 页码 |
| `pageSize` | `number \| string` | 否 | 页大小 |
| `startDate` | `string` | 否 | 统计开始日期 |
| `endDate` | `string` | 否 | 统计结束日期 |
| `email` | `string` | 否 | 邮箱 |
| `owner` | `string` | 否 | Owner 名称或管理员标识 |

##### `KolPerformanceRow`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `affiliateCode` | `string` | 否 | KOL 编码 |
| `email` | `string` | 否 | 邮箱 |
| `owner` | `string` | 否 | Owner |
| `commission` | `number \| string` | 否 | 佣金收入 |
| `registrations` | `number \| string` | 否 | 注册人数 |
| `ftd` | `number \| string` | 否 | 首存人数/首存指标 |
| `qualifiedTraders` | `number \| string` | 否 | 合格交易用户数 |

##### `AffiliateCampaignListQuery`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `currentPage` | `number \| string` | 否 | 当前页 |
| `pageSize` | `number \| string` | 否 | 页大小 |
| `sortField` | `string` | 否 | 排序字段 |
| `sortModel` | `string` | 否 | 排序方向/模式 |
| `mail` | `string` | 否 | 邮箱筛选 |
| `showTestAccount` | `string` | 否 | 是否显示测试账号 |

##### `AffiliateCampaignSummaryRow`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `mail` | `string` | 否 | 邮箱 |
| `name` | `string` | 否 | 名称 |
| `createTime` | `string` | 否 | 创建时间 |
| `compensationModel` | `string` | 否 | 佣金模式 |
| `idKYCStatus` | `string` | 否 | KYC 状态 |
| `registrations` | `number \| string` | 否 | 注册数 |
| `qualifiedTraders` | `number \| string` | 否 | 合格交易数 |
| `commissionEarned` | `number \| string` | 否 | 已赚取佣金 |
| `accountBalance` | `number \| string` | 否 | 账户余额 |

##### `CustomerDetailsQuery`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `affiliateId` | `string` | 是 | KOL ID |
| `currentPage` | `number \| string` | 否 | 当前页 |
| `pageSize` | `number \| string` | 否 | 页大小 |
| `startDate` | `string` | 否 | 起始日期 |
| `endDate` | `string` | 否 | 结束日期 |
| `affiliateEmail` | `string` | 否 | KOL 邮箱 |
| `customerEmail` | `string` | 否 | 客户邮箱 |

##### `CustomerDetailRow`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `customerLiveAccount` | `string` | 否 | 客户实盘账号 |
| `customerEmail` | `string` | 否 | 客户邮箱 |
| `customerPhone` | `string` | 否 | 客户电话 |
| `customerCountry` | `string` | 否 | 客户国家 |
| `customerRegDate` | `string` | 否 | 客户注册时间 |
| `customerKycStatus` | `string` | 否 | 客户 KYC 状态 |
| `affiliateEmail` | `string` | 否 | KOL 邮箱 |
| `affiliateName` | `string` | 否 | KOL 名称 |
| `affiliateRegDate` | `string` | 否 | KOL 注册时间 |
| `customerId` | `string` | 否 | 客户 ID |
| `affiliateCountry` | `string` | 否 | KOL 国家 |

##### `CustomerReportQuery`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `affiliateId` | `string` | 是 | KOL ID |
| `date` | `string` | 否 | 时间维度字段名，如 `signupDate` |
| `from` | `string` | 否 | 开始日期 |
| `to` | `string` | 否 | 结束日期 |
| `fields` | `string` | 否 | 返回字段白名单，逗号分隔 |
| `countryCode` | `string` | 否 | 国家编码 |
| `sortField` | `string` | 否 | 排序字段 |
| `sort` | `string` | 否 | 排序方向 |
| `currentPage` | `number \| string` | 否 | 当前页 |
| `pageSize` | `number \| string` | 否 | 页大小 |

##### `CustomerReportRow`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `customerId` | `string` | 否 | 客户 ID |
| `country` | `string` | 否 | 国家 |
| `signupDate` | `string` | 否 | 注册日期 |
| `platform` | `string` | 否 | 平台 |
| `deviceOS` | `string` | 否 | 设备系统 |
| `fullSignupDate` | `string` | 否 | 完整注册时间 |
| `ftdDate` | `string` | 否 | 首存日期 |
| `qualifiedDate` | `string` | 否 | 成为合格客户日期 |
| `firstDepositAmount` | `string` | 否 | 首存金额 |
| `totalOrderValue` | `string` | 否 | 总订单金额 |
| `commission` | `string` | 否 | 佣金 |
| `totalDepositAmount` | `string` | 否 | 总入金金额 |
| `note` | `string` | 否 | 备注 |
| `originCustomerId` | `string` | 否 | 源客户 ID |

##### `PerformanceReportQuery`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `affiliateId` | `string` | 是 | KOL ID |
| `groupBy` | `string` | 否 | 统计维度，如 `day` |
| `from` | `string` | 否 | 开始日期 |
| `to` | `string` | 否 | 结束日期 |
| `fields` | `string` | 否 | 返回字段白名单 |
| `countryCode` | `string` | 否 | 国家编码 |
| `currentPage` | `number \| string` | 否 | 当前页 |
| `pageSize` | `number \| string` | 否 | 页大小 |
| `sortField` | `string` | 否 | 排序字段 |
| `sort` | `string` | 否 | 排序方向 |

##### `PerformanceReportRow`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `date` | `string` | 否 | 日期 |
| `installsAndroid` | `number \| string` | 否 | Android 安装数 |
| `installsIOS` | `number \| string` | 否 | iOS 安装数 |
| `signups` | `number \| string` | 否 | 注册数 |
| `qualifiedCustomers` | `number \| string` | 否 | 合格客户数 |
| `fullSignups` | `number \| string` | 否 | 完整注册数 |
| `conversionRatio` | `number \| string` | 否 | 转化率 |
| `totalOrderValue` | `number \| string` | 否 | 总订单额 |
| `commission` | `number \| string` | 否 | 佣金 |

##### `TradeReportQuery`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `affiliateId` | `string` | 是 | KOL ID |
| `groupByInstrument` | `boolean \| string` | 否 | 是否按品种聚合 |
| `from` | `string` | 否 | 开始日期 |
| `to` | `string` | 否 | 结束日期 |
| `fields` | `string` | 否 | 返回字段白名单 |
| `currentPage` | `number \| string` | 否 | 当前页 |
| `pageSize` | `number \| string` | 否 | 页大小 |
| `sortField` | `string` | 否 | 排序字段 |
| `sort` | `string` | 否 | 排序方向 |

##### `TradeReportRow`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `customerId` | `string` | 否 | 客户 ID |
| `countryCode` | `string` | 否 | 国家编码 |
| `symbolCode` | `string` | 否 | 交易品种代码 |
| `openTime` | `string` | 否 | 开仓时间 |
| `volume` | `number \| string` | 否 | 交易量 |
| `spreadValue` | `number \| string` | 否 | 点差值 |
| `orderValue` | `number \| string` | 否 | 订单金额 |

##### `PaymentBatch`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `status` | `string` | 否 | 账单状态 |
| `periodStartDate` | `string` | 否 | 账单开始日期 |
| `periodEndDate` | `string` | 否 | 账单结束日期 |
| `commissionAmount` | `number \| string` | 否 | 佣金金额 |
| `paymentId` | `number \| string` | 否 | 账单 ID |
| `date` | `string` | 否 | 账单日期 |
| `amount` | `string` | 否 | 账单金额 |
| `referenceNumber` | `string` | 否 | 参考号/流水号 |

##### `PaymentCommissionRow`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `customerId` | `string` | 否 | 客户 ID |
| `countDate` | `string` | 否 | 计佣日期 |
| `symbolCode` | `string` | 否 | 品种代码 |
| `openValueUsd` | `number \| string` | 否 | 开仓金额 USD |
| `speed` | `number \| string` | 否 | 点差比例/速度字段 |
| `commission` | `number \| string` | 否 | 佣金金额 |
| `volume` | `number \| string` | 否 | 交易量 |
| `spreadValue` | `number \| string` | 否 | 点差值 |
| `orderValue` | `number \| string` | 否 | 订单金额 |

##### `PaymentCurrentValue`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `total` | `number` | 否 | 佣金明细总条数 |
| `payments` | `PaymentBatch \| null` | 否 | 当前账单主信息 |
| `commissions` | `PaymentCommissionRow[]` | 否 | 当前账单佣金行 |

##### `PaymentHistoryValue`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `total` | `number` | 否 | 总条数 |
| `currentPage` | `number` | 否 | 当前页 |
| `pageSize` | `number` | 否 | 页大小 |
| `totalPages` | `number` | 否 | 总页数 |
| `payments` | `PaymentBatch[]` | 否 | 历史账单列表 |
| `resultList` | `PaymentBatch[]` | 否 | 历史账单列表兼容字段 |

##### `PaymentCommissionValue`（根据页面调用推断）

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `total` | `number` | 否 | 总条数 |
| `commissions` | `PaymentCommissionRow[]` | 否 | 账单佣金行列表 |

---

## 5. 佣金结算中心

### 5.1 主流程说明

根据当前页面逻辑，结算中心主链路为：

```text
affiliate_commission_list -> payment_history -> payment_summary
```

状态流转说明：

| 对象 | 状态流转 | 说明 |
| --- | --- | --- |
| 结算单 `payment_history` | `NOTWITHDRAW -> PENDING -> APPLIED/APPROVED/PAID/DECLINED/MERGED/WITHDRAWING` | 用户提现申请和后续审核/支付状态 |
| 付款汇总 `payment_summary` | `PENDING/DECLINED -> APPLIED -> APPROVED/DECLINED -> PAID` | 财务汇总单审核与执行流程 |
| 佣金明细 `affiliate_commission_list` | `INIT -> CALCULATED -> FINISHED` | 佣金计算完成度 |
| 提现状态 | `UNAPPLIED -> APPLIED -> PAID` | 单笔佣金是否已进入提现并最终支付 |

### 5.2 接口清单

| 接口名称 | 方法 | 路径 | 请求模型 | 返回模型 | 说明 |
| --- | --- | --- | --- | --- | --- |
| 结算中心 Dashboard | `GET` | `/admin/settlement/dashboard` | `adminId` | `ApiResponse<SettlementDashboardValue>` | 结算聚合看板 |
| 佣金单列表 | `GET` | `/admin/affinex/commissionStatement` | `SettlementCommissionStatementQuery` | `ApiResponse<SettlementCommissionStatementListValue>` | 周期佣金单列表 |
| 佣金单详情 | `GET` | `/admin/affinex/getCommissionStatementDetail` | `statementId` | `ApiResponse<SettlementCommissionStatementRow>` | 单个佣金单头信息 |
| 佣金单明细分页 | `GET` | `/admin/affinex/getCommissionStatementItemPage` | `SettlementCommissionStatementItemPageQuery` | `ApiResponse<SettlementCommissionStatementItemPageValue>` | 单个佣金单下的佣金行 |
| 交易记录 | `GET` | `/admin/affinex/customerTrade` | `SettlementTransactionRecordQuery` | `ApiResponse<SettlementTransactionRecordListValue>` | 原始交易明细 |
| KOL 佣金明细 | `GET` | `/admin/affinex/userCommission` | `SettlementUserCommissionQuery` | `ApiResponse<SettlementUserCommissionListValue>` | 订单级佣金明细 |
| 结算单列表 | `GET` | `/payment/history/details_admin` | `SettlementStatementQuery` | `ApiResponse<value>` | 旧支付历史表的后台查询 |
| 结算单佣金明细 | `GET` | `/payment/commissions_admin` | `paymentId + 分页` | `ApiResponse<SettlementPaymentCommissionValue>` | 指定结算单的佣金行 |
| 更新结算单 | `PUT` | `/payment/history/admin` | `SettlementUpdateStatementPayload` | `ApiResponse<{success,errCode,message}>` | 更新结算单状态或支付信息 |
| 付款汇总列表 | `GET` | `/admin/payment_summary` | `SettlementPaymentSummaryQuery` | `ApiResponse<{total,items?,paymentSummary?,summary?}>` | 兼容新旧返回结构，前端统一归一化为 `SettlementPaymentSummaryListValue` |
| 付款汇总详情 | `GET` | `/admin/payment_summary_info` | `id` | `ApiResponse<SettlementPaymentSummaryRow>` | 获取单个汇总单详情，`paymentFile` 会统一归一化为对象数组 |
| 创建付款汇总 | `POST` | `/admin/affinex/createPaymentSummary` | `SettlementCreatePaymentSummaryPayload` | `ApiResponse<SettlementCreatePaymentSummaryValue>` | 批量结算单生成汇总单 |
| 合并付款汇总 | `POST` | `/admin/payment_summary` | `SettlementMergePaymentSummaryPayload` | `ApiResponse<{success,code,message}>` | 旧汇总合并接口，`paymentIds` 实际按逗号拼接字符串提交 |
| 更新付款汇总 | `PUT` | `/admin/payment_summary` | `SettlementUpdatePaymentSummaryPayload` | `ApiResponse<{success,code,message}>` | 审核、执行支付、补充附件；按字段增量更新，`PAID` 需要 `payoutDate`，且 `paymentMethods` 本次传值或库内已有值 |
| 管理端文件上传 | `POST` | `/resource-api/op/resource/v1/file/upload` | `multipart/form-data` | `ApiResponse<AdminUploadedFile[]>` | 上传打款凭证等文件 |

### 5.3 数据模型

#### 5.3.1 Dashboard

##### `SettlementDashboardMetric`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `count` | `number` | 否 | 数量 |
| `amount` | `string` | 否 | 金额 |

##### `SettlementDashboardValue`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `pendingApply` | `SettlementDashboardMetric` | 否 | 待申请 |
| `pendingReview` | `SettlementDashboardMetric` | 否 | 待审核 |
| `pendingPayout` | `SettlementDashboardMetric` | 否 | 待打款 |
| `paid` | `SettlementDashboardMetric` | 否 | 已付款 |
| `declined` | `SettlementDashboardMetric` | 否 | 已拒绝 |
| `totalPayableAmount` | `string` | 否 | 总待支付金额 |

#### 5.3.2 佣金单

##### `SettlementCommissionStatementQuery`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `page` | `number` | 否 | 页码 |
| `pageSize` | `number` | 否 | 页大小 |
| `statementId` | `number \| string` | 否 | 佣金单 ID |
| `settlementId` | `number \| string` | 否 | 汇总/结算 ID |
| `affiliateCode` | `string` | 否 | KOL 编码 |
| `referralCode` | `string` | 否 | 推广码 |
| `affiliateName` | `string` | 否 | KOL 名称 |
| `email` | `string` | 否 | 邮箱 |
| `ownerName` | `string` | 否 | Owner 名称 |
| `status` | `string[]` | 否 | 状态数组，按重复 query 传递 |
| `periodStartDateFrom` | `string` | 否 | 统计周期开始时间下限 |
| `periodStartDateTo` | `string` | 否 | 统计周期开始时间上限 |
| `periodEndDateFrom` | `string` | 否 | 统计周期结束时间下限 |
| `periodEndDateTo` | `string` | 否 | 统计周期结束时间上限 |
| `applicationTimeFrom` | `string` | 否 | 申请时间下限 |
| `applicationTimeTo` | `string` | 否 | 申请时间上限 |
| `auditTimeFrom` | `string` | 否 | 审核时间下限 |
| `auditTimeTo` | `string` | 否 | 审核时间上限 |
| `settlementTimeFrom` | `string` | 否 | 结算时间下限 |
| `settlementTimeTo` | `string` | 否 | 结算时间上限 |
| `payableAmountMin` | `string` | 否 | 应付金额下限 |
| `payableAmountMax` | `string` | 否 | 应付金额上限 |
| `sortBy` | `string` | 否 | 排序字段 |
| `sortOrder` | `"asc" \| "desc" \| string` | 否 | 排序方向 |
| `trafficApprovedBy` | `string` | 否 | 审批人/数据范围附加筛选 |

##### `SettlementCommissionStatementRow`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `statementId` | `number \| string` | 否 | 佣金单 ID |
| `settlementId` | `number \| string` | 否 | 结算汇总 ID |
| `affiliateId` | `string` | 否 | KOL ID |
| `affiliateCode` | `string` | 否 | KOL 编码 |
| `referralCode` | `string` | 否 | 推广码 |
| `affiliateName` | `string` | 否 | KOL 名称 |
| `email` | `string` | 否 | 邮箱 |
| `ownerName` | `string` | 否 | Owner 名称 |
| `periodStartDate` | `string` | 否 | 周期开始时间 |
| `periodEndDate` | `string` | 否 | 周期结束时间 |
| `periodLabel` | `string` | 否 | 周期展示文案 |
| `originCommissionAmount` | `string` | 否 | 原始佣金金额 |
| `awardDeductionAmount` | `string` | 否 | 奖励扣减金额 |
| `manualAdjustmentAmount` | `string` | 否 | 人工调整金额 |
| `payableAmount` | `string` | 否 | 应付金额 |
| `status` | `string` | 否 | 状态 |
| `applicationTime` | `string` | 否 | 申请时间 |
| `auditTime` | `string` | 否 | 审核时间 |
| `settlementTime` | `string` | 否 | 结算时间 |

##### `SettlementCommissionStatementSummary`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `originCommissionTotal` | `string` | 否 | 原始佣金合计 |
| `awardDeductionTotal` | `string` | 否 | 奖励扣减合计 |
| `manualAdjustmentTotal` | `string` | 否 | 人工调整合计 |
| `payableTotal` | `string` | 否 | 应付金额合计 |

##### `SettlementCommissionStatementListValue`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `page` | `number` | 否 | 当前页 |
| `pageSize` | `number` | 否 | 页大小 |
| `total` | `number` | 否 | 总条数 |
| `items` | `SettlementCommissionStatementRow[]` | 否 | 列表数据 |
| `summary` | `SettlementCommissionStatementSummary` | 否 | 汇总信息 |

##### `SettlementCommissionStatementItemPageQuery`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `page` | `number` | 否 | 页码 |
| `pageSize` | `number` | 否 | 页大小 |
| `statementId` | `number \| string` | 否 | 佣金单 ID |
| `paymentId` | `number \| string` | 否 | 支付单 ID，兼容旧口径 |
| `search` | `string` | 否 | 搜索关键字，通常搜客户/账号/订单/品种 |
| `sortBy` | `countDate \| commission \| awardUsd \| openValueUsd \| orderId \| statementId \| string` | 否 | 排序字段 |
| `sortOrder` | `asc \| desc \| string` | 否 | 排序方向 |
| `trafficApprovedBy` | `string` | 否 | 数据权限附加筛选 |

##### `SettlementCommissionStatementItemPageValue`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `page` | `number` | 否 | 当前页 |
| `pageSize` | `number` | 否 | 页大小 |
| `total` | `number` | 否 | 总条数 |
| `items` | `SettlementUserCommissionRow[]` | 否 | 佣金行列表 |
| `summary` | `SettlementUserCommissionSummary` | 否 | 汇总信息 |

#### 5.3.3 交易记录

##### `SettlementTransactionRecordQuery`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `page` | `number` | 否 | 页码 |
| `pageSize` | `number` | 否 | 页大小 |
| `customerId` | `string` | 否 | 客户 ID |
| `spAccount` | `string` | 否 | SP 账户 |
| `affiliateCode` | `string` | 否 | KOL 编码 |
| `referralCode` | `string` | 否 | 推广码 |
| `affiliateName` | `string` | 否 | KOL 名称 |
| `email` | `string` | 否 | 邮箱 |
| `ownerName` | `string` | 否 | Owner 名称 |
| `orderNo` | `string` | 否 | 订单号 |
| `orderId` | `string` | 否 | 订单 ID |
| `symbolCode` | `string` | 否 | 品种代码 |
| `symbolType` | `string` | 否 | 品种类型 |
| `orderType` | `string[]` | 否 | 订单类型数组 |
| `orderStatus` | `string[]` | 否 | 订单状态数组 |
| `openSystem` | `string` | 否 | 开仓系统 |
| `currency` | `string` | 否 | 货币 |
| `openTimeFrom` | `string` | 否 | 开仓时间下限 |
| `openTimeTo` | `string` | 否 | 开仓时间上限 |
| `closeTimeFrom` | `string` | 否 | 平仓时间下限 |
| `closeTimeTo` | `string` | 否 | 平仓时间上限 |
| `openValueUsdMin` | `string` | 否 | 开仓金额 USD 下限 |
| `openValueUsdMax` | `string` | 否 | 开仓金额 USD 上限 |
| `profitMin` | `string` | 否 | 盈亏下限 |
| `profitMax` | `string` | 否 | 盈亏上限 |
| `orderSpreadAwardUsdMin` | `string` | 否 | 点差奖励下限 |
| `orderSpreadAwardUsdMax` | `string` | 否 | 点差奖励上限 |
| `sortBy` | `openTime \| closeTime \| openValueUsd \| profit \| orderSpreadAwardUsd \| orderId \| string` | 否 | 排序字段 |
| `sortOrder` | `asc \| desc \| string` | 否 | 排序方向 |
| `trafficApprovedBy` | `string` | 否 | 数据范围附加筛选 |

##### `SettlementTransactionRecordRow`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `customerId` | `string` | 否 | 客户 ID |
| `spAccount` | `string` | 否 | SP 账户 |
| `affiliateId` | `string` | 否 | KOL ID |
| `affiliateCode` | `string` | 否 | KOL 编码 |
| `referralCode` | `string` | 否 | 推广码 |
| `affiliateName` | `string` | 否 | KOL 名称 |
| `email` | `string` | 否 | 邮箱 |
| `ownerName` | `string` | 否 | Owner 名称 |
| `orderNo` | `string` | 否 | 订单号 |
| `orderId` | `string` | 否 | 订单 ID |
| `symbolCode` | `string` | 否 | 品种代码 |
| `symbolType` | `string` | 否 | 品种类型 |
| `orderType` | `string` | 否 | 订单类型 |
| `orderStatus` | `string` | 否 | 订单状态 |
| `lots` | `string` | 否 | 手数 |
| `volume` | `string` | 否 | 数量/成交量 |
| `openSystem` | `string` | 否 | 开仓系统 |
| `openTime` | `string` | 否 | 开仓时间 |
| `closeTime` | `string` | 否 | 平仓时间 |
| `openPrice` | `string` | 否 | 开仓价 |
| `closePrice` | `string` | 否 | 平仓价 |
| `currency` | `string` | 否 | 币种 |
| `margin` | `string` | 否 | 保证金 |
| `profit` | `string` | 否 | 盈亏 |
| `swaps` | `string` | 否 | 隔夜费 |
| `leverage` | `string` | 否 | 杠杆 |
| `openingSpreadCost` | `string` | 否 | 开仓点差成本 |
| `closingSpreadCost` | `string` | 否 | 平仓点差成本 |
| `openValueUsd` | `string` | 否 | 开仓金额 USD |
| `openingPrice` | `string` | 否 | 开仓参考价 |
| `currencyType` | `string` | 否 | 币种类型 |
| `openingSpreadCostUsd` | `string` | 否 | 开仓点差成本 USD |
| `closingSpreadCostUsd` | `string` | 否 | 平仓点差成本 USD |
| `orderSpreadAwardUsd` | `string` | 否 | 点差奖励 USD |

##### `SettlementTransactionRecordSummary`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `totalLots` | `string` | 否 | 总手数 |
| `totalVolume` | `string` | 否 | 总成交量 |
| `totalOpenValueUsd` | `string` | 否 | 总开仓金额 USD |
| `totalProfit` | `string` | 否 | 总盈亏 |
| `totalOpeningSpreadCostUsd` | `string` | 否 | 总开仓点差成本 USD |
| `totalClosingSpreadCostUsd` | `string` | 否 | 总平仓点差成本 USD |
| `totalOrderSpreadAwardUsd` | `string` | 否 | 总点差奖励 USD |

##### `SettlementTransactionRecordListValue`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `page` | `number` | 否 | 当前页 |
| `pageSize` | `number` | 否 | 页大小 |
| `total` | `number` | 否 | 总条数 |
| `items` | `SettlementTransactionRecordRow[]` | 否 | 列表数据 |
| `summary` | `SettlementTransactionRecordSummary` | 否 | 汇总数据 |

#### 5.3.4 KOL 佣金明细

##### `SettlementUserCommissionQuery`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `page` | `number` | 否 | 页码 |
| `pageSize` | `number` | 否 | 页大小 |
| `statementId` | `number \| string` | 否 | 佣金单 ID |
| `affiliateCode` | `string` | 否 | KOL 编码 |
| `referralCode` | `string` | 否 | 推广码 |
| `affiliateName` | `string` | 否 | KOL 名称 |
| `email` | `string` | 否 | 邮箱 |
| `ownerName` | `string` | 否 | Owner 名称 |
| `customerId` | `string` | 否 | 客户 ID |
| `spAccount` | `string` | 否 | SP 账户 |
| `orderNo` | `string` | 否 | 订单号 |
| `orderId` | `string` | 否 | 订单 ID |
| `symbolCode` | `string` | 否 | 品种代码 |
| `currencyType` | `string` | 否 | 币种类型 |
| `status` | `string[]` | 否 | 佣金状态数组 |
| `withdrawStatus` | `string[]` | 否 | 提现状态数组 |
| `countDateFrom` | `string` | 否 | 计佣日期下限 |
| `countDateTo` | `string` | 否 | 计佣日期上限 |
| `commissionMin` | `string` | 否 | 佣金下限 |
| `commissionMax` | `string` | 否 | 佣金上限 |
| `awardUsdMin` | `string` | 否 | 奖励金额下限 |
| `awardUsdMax` | `string` | 否 | 奖励金额上限 |
| `openValueUsdMin` | `string` | 否 | 开仓金额下限 |
| `openValueUsdMax` | `string` | 否 | 开仓金额上限 |
| `sortBy` | `countDate \| commission \| awardUsd \| openValueUsd \| orderId \| statementId \| string` | 否 | 排序字段 |
| `sortOrder` | `asc \| desc \| string` | 否 | 排序方向 |
| `trafficApprovedBy` | `string` | 否 | 数据范围附加筛选 |

##### `SettlementUserCommissionRow`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `number \| string` | 否 | 佣金行 ID |
| `statementId` | `number \| string` | 否 | 佣金单 ID |
| `affiliateId` | `string` | 否 | KOL ID |
| `affiliateCode` | `string` | 否 | KOL 编码 |
| `referralCode` | `string` | 否 | 推广码 |
| `affiliateName` | `string` | 否 | KOL 名称 |
| `email` | `string` | 否 | 邮箱 |
| `ownerName` | `string` | 否 | Owner 名称 |
| `customerId` | `string` | 否 | 客户 ID |
| `spAccount` | `string` | 否 | SP 账户 |
| `orderNo` | `string` | 否 | 订单号 |
| `orderId` | `string` | 否 | 订单 ID |
| `symbolCode` | `string` | 否 | 品种代码 |
| `currencyType` | `string` | 否 | 币种类型 |
| `volume` | `string` | 否 | 交易量 |
| `openValueUsd` | `string` | 否 | 开仓金额 USD |
| `spreadPercentage` | `string` | 否 | 点差比例 |
| `speed` | `string` | 否 | 当前 speed |
| `originSpeed` | `string` | 否 | 原始 speed |
| `commission` | `string` | 否 | 实际佣金 |
| `originCommission` | `string` | 否 | 原始佣金 |
| `awardUsd` | `string` | 否 | 奖励金额 USD |
| `originAwardUsd` | `string` | 否 | 原始奖励金额 USD |
| `status` | `INIT \| CALCULATED \| FINISHED \| string` | 否 | 佣金状态 |
| `withdrawStatus` | `UNAPPLIED \| APPLIED \| PAID \| string` | 否 | 提现状态 |
| `countDate` | `string` | 否 | 计佣日期 |
| `createTime` | `string` | 否 | 创建时间 |
| `updateTime` | `string` | 否 | 更新时间 |

##### `SettlementUserCommissionSummary`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `totalCommission` | `string` | 否 | 总佣金 |
| `totalOriginCommission` | `string` | 否 | 原始总佣金 |
| `totalAwardUsd` | `string` | 否 | 总奖励 USD |
| `totalOriginAwardUsd` | `string` | 否 | 原始总奖励 USD |
| `totalVolume` | `string` | 否 | 总成交量 |
| `totalOpenValueUsd` | `string` | 否 | 总开仓金额 USD |

##### `SettlementUserCommissionListValue`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `page` | `number` | 否 | 当前页 |
| `pageSize` | `number` | 否 | 页大小 |
| `total` | `number` | 否 | 总条数 |
| `items` | `SettlementUserCommissionRow[]` | 否 | 列表数据 |
| `summary` | `SettlementUserCommissionSummary` | 否 | 汇总数据 |

#### 5.3.5 结算单与付款汇总

##### `SettlementStatementQuery`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `affiliateId` | `string` | 否 | KOL 编码或 ID，页面作为 Affiliate Code 使用 |
| `name` | `string` | 否 | KOL 名称 |
| `trafficApprovedBy` | `string` | 否 | 审核人/数据范围 |
| `status` | `string` | 否 | 结算单状态 |
| `dateRange` | `string` | 否 | 日期快捷值，页面里 `0/1/2` 表示本周/上周/本月 |
| `currentPage` | `number` | 否 | 当前页 |
| `pageSize` | `number` | 否 | 页大小 |
| `startDate` | `string` | 否 | 申请时间起始 |
| `endDate` | `string` | 否 | 申请时间结束 |
| `paymentId` | `string` | 否 | 结算单 ID |
| `periodStartDate` | `string` | 否 | 周期开始时间 |
| `periodEndDate` | `string` | 否 | 周期结束时间 |
| `paymentSummaryId` | `number` | 否 | 汇总单 ID |
| `includeNotWithdraw` | `boolean` | 否 | 是否包含 `NOTWITHDRAW` |

##### `SettlementStatementRow`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `number \| string` | 否 | 结算单 ID |
| `affiliateId` | `string` | 否 | KOL 编码/ID |
| `name` | `string` | 否 | KOL 名称 |
| `medium` | `string` | 否 | 推广媒介 |
| `email` | `string` | 否 | 邮箱 |
| `paidAmount` | `string` | 否 | 结算金额 |
| `applicationDate` | `string` | 否 | 申请时间 |
| `status` | `string` | 否 | 结算单状态 |
| `payoutDate` | `string` | 否 | 打款时间 |
| `oldAffiliateId` | `string` | 否 | 旧 Affiliate ID |
| `datePeriod` | `string` | 否 | 周期文案 |
| `owner` | `string` | 否 | Owner |
| `paymentMethods` | `string` | 否 | 支付方式 |
| `awardAmount` | `number \| string` | 否 | 奖励金额 |
| `adjustmentsAmount` | `number \| string` | 否 | 人工调整金额 |
| `originAmount` | `number \| string` | 否 | 原始金额 |
| `receiverAccount` | `string` | 否 | 收款账号 |
| `note` | `string` | 否 | 备注 |
| `receipts` | `SettlementAttachment[]` | 否 | 付款附件 |
| `paymentSummaryId` | `number` | 否 | 关联汇总单 ID |

##### `SettlementAttachment`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `code` | `string` | 否 | 附件编码/名称 |
| `path` | `string` | 否 | 附件路径 |

##### `SettlementStatementListValue`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `total` | `number` | 是 | 总条数 |
| `items` | `SettlementStatementRow[]` | 是 | 列表数据 |
| `summaryAmount` | `string` | 否 | 汇总金额 |

##### `SettlementPaymentCommissionRow`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `traderLiveAccount` | `string` | 否 | 交易账号 |
| `date` | `string` | 否 | 日期 |
| `instrument` | `string` | 否 | 品种 |
| `spread` | `number \| string` | 否 | 点差 |
| `tier` | `string` | 否 | 档位 |
| `commission` | `number \| string` | 否 | 佣金 |
| `affiliateCode` | `string` | 否 | KOL 编码 |
| `affiliateEmail` | `string` | 否 | KOL 邮箱 |
| `kolOwnerName` | `string` | 否 | Owner 名称 |
| `tradeTime` | `string` | 否 | 交易时间 |
| `awardUsd` | `number \| string` | 否 | 奖励 USD |
| `originCommission` | `number \| string` | 否 | 原始佣金 |

##### `SettlementPaymentCommissionValue`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `total` | `number` | 否 | 总条数 |
| `paymentCommissions` | `SettlementPaymentCommissionRow[]` | 否 | 佣金明细 |

##### `SettlementPaymentSummaryQuery`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `affiliateId` | `string` | 否 | KOL 编码 |
| `status` | `string` | 否 | 汇总单状态 |
| `dateRange` | `string` | 否 | 日期快捷筛选值，通常与 `startDate/endDate` 二选一使用 |
| `page` | `number` | 否 | 页码，默认 `1` |
| `pageSize` | `number` | 否 | 页大小，默认 `20` |
| `startDate` | `string` | 否 | 创建时间起始 |
| `endDate` | `string` | 否 | 创建时间结束 |
| `trafficApprovedBy` | `string` | 否 | 数据范围附加筛选 |

##### `付款汇总接口兼容说明`

`GET /admin/payment_summary` 当前兼容两套后端返回结构，前端会统一转换为 `SettlementPaymentSummaryListValue`：

```json
{
  "success": true,
  "value": {
    "total": 12,
    "items": [
      {
        "id": 1001,
        "affiliateCode": "KOL001",
        "payableAmount": "123.45"
      }
    ],
    "paymentSummary": [
      {
        "affiliateId": "TOTAL",
        "payableAmount": "1234.56"
      }
    ],
    "summary": {
      "amountPayableSum": "1234.56"
    }
  }
}
```

兼容规则如下：

| 规则 | 说明 |
| --- | --- |
| 列表数据来源 | 优先读取 `value.items`，为空时回退读取 `value.paymentSummary` |
| 旧口径汇总行 | 当后端只返回 `paymentSummary` 时，前端会过滤 `affiliateId = TOTAL` 的汇总行，不展示在列表 `items` 中 |
| 汇总金额来源 | `summaryAmount` 优先取 `value.summary.amountPayableSum`，缺失时回退取旧 `TOTAL` 行的 `payableAmount` |
| 附件字段兼容 | 读取 `paymentFile` 时兼容对象数组、JSON 字符串、单个 URL 字符串或单对象，前端最终统一归一化为 `SettlementPaymentFile[]`；写回 `PUT /admin/payment_summary` 时仅提交对象数组 |

##### `SettlementPaymentFile`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `string \| number` | 否 | 文件 ID |
| `name` | `string` | 否 | 文件名 |
| `size` | `number` | 否 | 文件大小 |
| `path` | `string` | 否 | 文件路径 |
| `type` | `string` | 否 | 文件 MIME/类型，兼容后端 `type` / `contentType` |
| `url` | `string` | 否 | 访问 URL，兼容后端 `url` / `downloadUrl` |
| `role` | `string` | 否 | 上传人角色 |
| `mail` | `string` | 否 | 上传人邮箱 |
| `username` | `string` | 否 | 上传人用户名 |

##### `SettlementPaymentSummaryHistoryRow`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `datePeriod` | `string` | 否 | 周期 |
| `originAmount` | `number \| string` | 否 | 原始金额 |
| `awardAmount` | `number \| string` | 否 | 奖励金额 |
| `paidAmount` | `string` | 否 | 支付金额 |

##### `SettlementPaymentSummaryRow`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `number` | 否 | 汇总单 ID |
| `affiliateId` | `string` | 否 | KOL ID |
| `affiliateCode` | `string` | 否 | KOL 编码 |
| `payableAmount` | `string` | 否 | 应付金额 |
| `adjustmentsAmount` | `number \| string` | 否 | 人工调整金额 |
| `status` | `string` | 否 | 汇总单状态 |
| `payoutDate` | `string` | 否 | 打款时间 |
| `note` | `string` | 否 | 备注 |
| `applicationDate` | `string` | 否 | 申请时间 |
| `paymentMethods` | `string` | 否 | 支付方式 |
| `paymentFile` | `SettlementPaymentFile[]` | 否 | 付款附件；前端读取时会将历史字符串格式统一归一化为对象数组，提交更新时只使用对象数组 |
| `paymentHistoryList` | `SettlementPaymentSummaryHistoryRow[]` | 否 | 关联结算历史 |
| `medium` | `string` | 否 | 推广媒介 |
| `name` | `string` | 否 | KOL 名称 |
| `email` | `string` | 否 | 邮箱 |
| `owner` | `string` | 否 | Owner |
| `originAmount` | `number \| string` | 否 | 原始金额 |

##### `SettlementPaymentSummaryListValue`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `total` | `number` | 是 | 总条数 |
| `items` | `SettlementPaymentSummaryRow[]` | 是 | 列表数据 |
| `summaryAmount` | `string` | 否 | 汇总金额，优先取 `summary.amountPayableSum`，兼容旧 `TOTAL` 行回退值 |

##### `SettlementUpdateStatementPayload`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `number` | 是 | 结算单 ID |
| `status` | `string` | 否 | 目标状态 |
| `payoutDate` | `string` | 否 | 打款时间 |
| `paymentMethods` | `string` | 否 | 支付方式 |
| `adjustmentsAmount` | `string \| number` | 否 | 调整金额 |

##### `SettlementCreatePaymentSummaryPayload`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `paymentIds` | `Array<number \| string>` | 是 | 待汇总的结算单 ID 集合 |
| `adjustmentsAmount` | `string` | 否 | 人工调整金额 |
| `note` | `string` | 否 | 备注 |
| `paymentMethods` | `string` | 否 | 支付方式 |
| `paymentFile` | `SettlementPaymentFile[]` | 否 | 附件集合 |

##### `SettlementCreatePaymentSummaryValue`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `settlementId` | `number` | 否 | 新创建的汇总/结算 ID |

##### `SettlementMergePaymentSummaryPayload`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `paymentIds` | `string` | 是 | 待合并汇总单 ID 集合，调用层会将数组按英文逗号拼接后提交，例如 `101,102,103` |
| `adminId` | `number \| string` | 否 | 操作管理员 ID，旧接口兼容字段 |

##### `SettlementUpdatePaymentSummaryPayload`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `number` | 是 | 汇总单 ID |
| `status` | `string` | 否 | 目标状态 |
| `payoutDate` | `string` | 否 | 打款日期 |
| `paymentMethods` | `string` | 否 | 支付方式 |
| `note` | `string` | 否 | 备注 |
| `paymentFile` | `SettlementPaymentFile[]` | 否 | 附件集合；提交时必须传完整对象数组，不再使用旧字符串格式 |
| `adjustmentsAmount` | `string \| number` | 否 | 人工调整金额，可传数值或字符串金额 |

更新行为说明：

- `PUT /admin/payment_summary` 只会更新本次实际传入且满足后端校验的字段，未传字段不会被前端用空值覆盖提交。
- 仅变更状态时，可只传 `id + status`，例如 `APPLIED`、`APPROVED`、`DECLINED`。
- 当状态改为 `PAID` 时，前端必须至少提交 `id`、`status`、`payoutDate`、`paymentMethods`。
- 只有用户实际修改了附件时才提交 `paymentFile`；如果不打算更新附件，就不要传该字段。

`PAID` 请求示例：

```json
{
  "id": 123,
  "status": "PAID",
  "payoutDate": "2026-05-11",
  "paymentMethods": "bank transfer",
  "paymentFile": [
    {
      "id": "6cd65737d07248ebbe8fbff063927890",
      "name": "7975e616322c47bf99824751a6086f8c.json",
      "size": 4495,
      "path": "/uploads/20260511/7975e616322c47bf99824751a6086f8c.json",
      "type": "application/json",
      "url": "https://demo-resource.mistorebox.com/uploads/20260511/7975e616322c47bf99824751a6086f8c.json",
      "role": "KOL_ADMIN",
      "mail": "vela-admin@yuanqutech.com",
      "username": "vela-admin"
    }
  ]
}
```

仅状态流转示例：

```json
{
  "id": 123,
  "status": "APPROVED"
}
```

##### `AdminUploadedFile`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `number \| string` | 否 | 文件 ID |
| `originalName` | `string` | 否 | 原始文件名 |
| `storedName` | `string` | 否 | 存储文件名 |
| `name` | `string` | 否 | 文件名兼容字段 |
| `path` | `string` | 否 | 存储路径 |
| `contentType` | `string` | 否 | MIME 类型 |
| `type` | `string` | 否 | 类型兼容字段 |
| `size` | `number` | 否 | 文件大小 |
| `url` | `string` | 否 | 访问 URL |
| `downloadUrl` | `string` | 否 | 下载 URL |

---

## 6. 营销中心

### 6.1 响应结构说明

营销中心接口不是 `value` 包裹，常见原始响应结构如下：

#### 列表型

```json
{
  "success": true,
  "message": "ok",
  "items": [],
  "total": 0,
  "errCode": 0,
  "nonce": "..."
}
```

#### 详情/新增/修改型

```json
{
  "success": true,
  "message": "ok",
  "item": {},
  "errCode": 0,
  "nonce": "..."
}
```

### 6.2 状态与枚举

#### `MarketingTaxonomyType`

| 值 | 说明 |
| --- | --- |
| `TAXONOMY_TYPE_LANGUAGE` | 语言 |
| `TAXONOMY_TYPE_CHANNEL` | 渠道 |
| `TAXONOMY_TYPE_SCOPE` | 适用范围 |
| `TAXONOMY_TYPE_MATERIAL_CATEGORY` | 素材分类 |
| `TAXONOMY_TYPE_ACTIVITY_CATEGORY` | 活动分类 |

#### `MarketingContentStatus`

| 值 | 说明 |
| --- | --- |
| `CONTENT_STATUS_UNSPECIFIED` | 未指定 |
| `CONTENT_STATUS_DRAFT` | 草稿 |
| `CONTENT_STATUS_PENDING_REVIEW` | 待审核 |
| `CONTENT_STATUS_REJECTED` | 已驳回 |
| `CONTENT_STATUS_APPROVED` | 已通过审核 |
| `CONTENT_STATUS_PUBLISHED` | 已发布 |
| `CONTENT_STATUS_OFFLINE` | 已下线 |

#### `MarketingReviewDecision`

| 值 | 说明 |
| --- | --- |
| `REVIEW_DECISION_UNSPECIFIED` | 未指定 |
| `REVIEW_DECISION_APPROVE` | 通过 |
| `REVIEW_DECISION_REJECT` | 驳回 |

### 6.3 接口清单

| 接口名称 | 方法 | 路径 | 请求模型 | 返回模型 | 说明 |
| --- | --- | --- | --- | --- | --- |
| 营销工作台汇总 | `GET` | `/admin/marketing/workbench/summary` | 无 | `MarketingWorkbenchSummaryEnvelope` | 素材/活动状态汇总 |
| 分类列表 | `GET` | `/admin/marketing/taxonomies` | `type, includeDisabled` | `items: MarketingTaxonomyItem[]` | 查询分类字典 |
| 新增分类 | `POST` | `/admin/marketing/taxonomies` | `MarketingCreateTaxonomyPayload` | `item: MarketingTaxonomyItem` | 新增分类 |
| 更新分类 | `PUT` | `/admin/marketing/taxonomies/{id}` | `MarketingUpdateTaxonomyPayload` | `item: MarketingTaxonomyItem` | 更新分类 |
| 删除分类 | `POST` | `/admin/marketing/taxonomies/{id}:delete` | `id` | `item: MarketingTaxonomyItem` | 逻辑删除分类 |
| 素材列表 | `GET` | `/admin/marketing/materials` | `MarketingMaterialsQuery` | `items: MarketingMaterial[]` | 查询素材 |
| 素材详情 | `GET` | `/admin/marketing/materials/{id}` | `id` | `item: MarketingMaterial` | 查询素材详情 |
| 新增素材 | `POST` | `/admin/marketing/materials` | `MarketingCreateMaterialPayload` | `item: MarketingMaterial` | 新增素材 |
| 更新素材 | `PUT` | `/admin/marketing/materials/{id}` | `MarketingUpdateMaterialPayload` | `item: MarketingMaterial` | 更新素材 |
| 删除素材 | `POST` | `/admin/marketing/materials/{id}:delete` | `id` | `item: MarketingMaterial` | 逻辑删除素材 |
| 提交素材审核 | `POST` | `/admin/marketing/materials/{id}:submit_review` | `MarketingCommentPayload` | `item: MarketingMaterial` | 提交审核 |
| 审核素材 | `POST` | `/admin/marketing/materials/{id}:review` | `MarketingReviewPayload` | `item: MarketingMaterial` | 审核素材 |
| 发布素材 | `POST` | `/admin/marketing/materials/{id}:publish` | `id` | `item: MarketingMaterial` | 发布素材 |
| 下线素材 | `POST` | `/admin/marketing/materials/{id}:offline` | `MarketingCommentPayload` | `item: MarketingMaterial` | 下线素材 |
| 活动列表 | `GET` | `/admin/marketing/activities` | `MarketingActivitiesQuery` | `items: MarketingActivity[]` | 查询活动 |
| 活动详情 | `GET` | `/admin/marketing/activities/{id}` | `id` | `item: MarketingActivity` | 查询活动详情 |
| 新增活动 | `POST` | `/admin/marketing/activities` | `MarketingCreateActivityPayload` | `item: MarketingActivity` | 新增活动 |
| 更新活动 | `PUT` | `/admin/marketing/activities/{id}` | `MarketingUpdateActivityPayload` | `item: MarketingActivity` | 更新活动 |
| 删除活动 | `POST` | `/admin/marketing/activities/{id}:delete` | `id` | `item: MarketingActivity` | 逻辑删除活动 |
| 提交活动审核 | `POST` | `/admin/marketing/activities/{id}:submit_review` | `MarketingCommentPayload` | `item: MarketingActivity` | 提交审核 |
| 审核活动 | `POST` | `/admin/marketing/activities/{id}:review` | `MarketingReviewPayload` | `item: MarketingActivity` | 审核活动 |
| 发布活动 | `POST` | `/admin/marketing/activities/{id}:publish` | `id` | `item: MarketingActivity` | 发布活动 |
| 下线活动 | `POST` | `/admin/marketing/activities/{id}:offline` | `MarketingCommentPayload` | `item: MarketingActivity` | 下线活动 |
| 生成单条推广链接 | `POST` | `/admin/marketing/activity_links:generate` | `MarketingGenerateLinkPayload` | `item: MarketingActivityPromotionLink` | 生成活动推广链接 |
| 批量生成推广链接 | `POST` | `/admin/marketing/activity_links:batch_generate` | `MarketingBatchGenerateLinksPayload` | `items: MarketingActivityPromotionLink[]` | 批量生成活动推广链接 |
| 推广链接列表 | `GET` | `/admin/marketing/activity_links` | `MarketingLinksQuery` | `items: MarketingActivityPromotionLink[]` | 查询推广链接 |
| 审核记录列表 | `GET` | `/admin/marketing/reviews` | `MarketingAuditQuery` | `items: MarketingReviewRecord[]` | 查询审核记录 |
| 操作日志列表 | `GET` | `/admin/marketing/operation_logs` | `MarketingAuditQuery` | `items: MarketingOperationLog[]` | 查询操作日志 |
| 营销文件上传 | `POST` | `/admin/files/upload` | `multipart/form-data` | `item: MarketingFileObject` | 上传文件 |
| 文件对象列表 | `GET` | `/admin/file_objects` | `MarketingFileObjectsQuery` | `items: MarketingFileObject[]` | 查询文件对象 |
| 文件对象详情 | `GET` | `/admin/file_objects/{id}` | `id` | `item: MarketingFileObject` | 查询文件对象详情 |
| 删除文件对象 | `POST` | `/admin/file_objects/{id}:delete` | `id` | `success:boolean` | 删除文件对象 |

### 6.4 数据模型

#### `MarketingTaxonomyItem`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `number` | 否 | 主键 ID |
| `type` | `MarketingTaxonomyType` | 否 | 分类类型 |
| `code` | `string` | 否 | 分类编码 |
| `name` | `string` | 否 | 分类名称 |
| `locale` | `string` | 否 | 语言地区 |
| `sort` | `number` | 否 | 排序号 |
| `enabled` | `boolean` | 否 | 是否启用 |
| `createdAt` | `string` | 否 | 创建时间 |
| `updatedAt` | `string` | 否 | 更新时间 |

#### `MarketingFileRef`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `number` | 否 | 文件 ID |
| `originalName` | `string` | 否 | 原始文件名 |
| `storedName` | `string` | 否 | 存储文件名 |
| `contentType` | `string` | 否 | MIME 类型 |
| `size` | `number` | 否 | 文件大小 |
| `url` | `string` | 否 | 访问地址 |
| `downloadUrl` | `string` | 否 | 下载地址 |

#### `MarketingFileObject`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `number` | 否 | 文件对象 ID |
| `originalName` | `string` | 否 | 原始文件名 |
| `storedName` | `string` | 否 | 存储文件名 |
| `ext` | `string` | 否 | 文件扩展名 |
| `size` | `number` | 否 | 文件大小 |
| `contentType` | `string` | 否 | MIME 类型 |
| `storageProvider` | `string` | 否 | 存储服务商 |
| `url` | `string` | 否 | 访问地址 |
| `downloadUrl` | `string` | 否 | 下载地址 |
| `createdAt` | `string` | 否 | 创建时间 |

#### `MarketingMaterial`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `number` | 否 | 素材 ID |
| `title` | `string` | 否 | 标题 |
| `description` | `string` | 否 | 描述 |
| `materialType` | `string` | 否 | 素材类型 |
| `legacyMaterialType` | `string` | 否 | 旧版素材类型 |
| `language` | `MarketingTaxonomyItem` | 否 | 语言 |
| `category` | `MarketingTaxonomyItem` | 否 | 分类 |
| `channels` | `MarketingTaxonomyItem[]` | 否 | 渠道 |
| `scopes` | `MarketingTaxonomyItem[]` | 否 | 适用范围 |
| `file` | `MarketingFileRef` | 否 | 素材文件 |
| `cover` | `MarketingFileRef` | 否 | 封面文件 |
| `cooperationSampleUrl` | `string` | 否 | 合作示例 URL |
| `copyCode` | `string` | 否 | 文案代码 |
| `size` | `string` | 否 | 尺寸说明 |
| `fileType` | `string` | 否 | 文件类型说明 |
| `status` | `MarketingContentStatus` | 否 | 内容状态 |
| `rejectReason` | `string` | 否 | 驳回原因 |
| `createdAt` | `string` | 否 | 创建时间 |
| `updatedAt` | `string` | 否 | 更新时间 |
| `publishedAt` | `string` | 否 | 发布时间 |
| `offlineAt` | `string` | 否 | 下线时间 |

#### `MarketingActivity`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `number` | 否 | 活动 ID |
| `title` | `string` | 否 | 标题 |
| `description` | `string` | 否 | 描述 |
| `language` | `MarketingTaxonomyItem` | 否 | 语言 |
| `category` | `MarketingTaxonomyItem` | 否 | 分类 |
| `channels` | `MarketingTaxonomyItem[]` | 否 | 渠道 |
| `scopes` | `MarketingTaxonomyItem[]` | 否 | 适用范围 |
| `cover` | `MarketingFileRef` | 否 | 封面 |
| `carousel` | `boolean` | 否 | 是否轮播 |
| `landingUrl` | `string` | 否 | 落地页 URL |
| `status` | `MarketingContentStatus` | 否 | 内容状态 |
| `rejectReason` | `string` | 否 | 驳回原因 |
| `createdAt` | `string` | 否 | 创建时间 |
| `updatedAt` | `string` | 否 | 更新时间 |
| `publishedAt` | `string` | 否 | 发布时间 |
| `offlineAt` | `string` | 否 | 下线时间 |

#### `MarketingReviewRecord`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `number` | 否 | 审核记录 ID |
| `contentType` | `MarketingContentType` | 否 | 内容类型：素材/活动 |
| `contentId` | `number` | 否 | 内容 ID |
| `fromStatus` | `MarketingContentStatus` | 否 | 审核前状态 |
| `toStatus` | `MarketingContentStatus` | 否 | 审核后状态 |
| `decision` | `MarketingReviewDecision` | 否 | 审核决定 |
| `reviewerId` | `string` | 否 | 审核人 ID |
| `reviewerName` | `string` | 否 | 审核人名称 |
| `comment` | `string` | 否 | 审核意见 |
| `createdAt` | `string` | 否 | 创建时间 |

#### `MarketingOperationLog`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `number` | 否 | 操作日志 ID |
| `contentType` | `MarketingContentType` | 否 | 内容类型 |
| `contentId` | `number` | 否 | 内容 ID |
| `action` | `string` | 否 | 动作类型 |
| `operatorId` | `string` | 否 | 操作人 ID |
| `operatorName` | `string` | 否 | 操作人名称 |
| `detail` | `string` | 否 | 操作详情 |
| `createdAt` | `string` | 否 | 创建时间 |

#### `MarketingWorkbenchStatusSummary`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `total` | `number` | 是 | 总数 |
| `draft` | `number` | 是 | 草稿数 |
| `pendingReview` | `number` | 是 | 待审核数 |
| `rejected` | `number` | 是 | 驳回数 |
| `approved` | `number` | 是 | 通过数 |
| `published` | `number` | 是 | 发布数 |
| `offline` | `number` | 是 | 下线数 |

#### `MarketingWorkbenchSummaryValue`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `materials` | `MarketingWorkbenchStatusSummary` | 是 | 素材状态汇总 |
| `activities` | `MarketingWorkbenchStatusSummary` | 是 | 活动状态汇总 |

#### `MarketingActivityPromotionLink`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `number` | 否 | 链接 ID |
| `activityId` | `number` | 否 | 活动 ID |
| `affiliateId` | `string` | 否 | KOL ID |
| `affiliateName` | `string` | 否 | KOL 名称 |
| `channel` | `MarketingTaxonomyItem` | 否 | 渠道对象 |
| `longUrl` | `string` | 否 | 长链接 |
| `shortUrl` | `string` | 否 | 短链接 |
| `enabled` | `boolean` | 否 | 是否启用 |
| `createdAt` | `string` | 否 | 创建时间 |

#### 常用请求模型

##### `MarketingCreateMaterialPayload`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `title` | `string` | 是 | 标题 |
| `description` | `string` | 是 | 描述 |
| `materialType` | `string` | 是 | 素材类型 |
| `legacyMaterialType` | `string` | 是 | 旧素材类型 |
| `languageId` | `number` | 是 | 语言 ID |
| `categoryId` | `number` | 是 | 分类 ID |
| `channelIds` | `number[]` | 是 | 渠道 ID 集合 |
| `scopeIds` | `number[]` | 是 | 适用范围 ID 集合 |
| `fileId` | `number` | 否 | 素材文件 ID |
| `coverFileId` | `number` | 否 | 封面文件 ID |
| `cooperationSampleUrl` | `string` | 否 | 合作示例 URL |
| `copyCode` | `string` | 否 | 文案代码 |
| `size` | `string` | 否 | 尺寸 |
| `fileType` | `string` | 否 | 文件类型 |

##### `MarketingCreateActivityPayload`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `title` | `string` | 是 | 标题 |
| `description` | `string` | 是 | 描述 |
| `languageId` | `number` | 是 | 语言 ID |
| `categoryId` | `number` | 是 | 分类 ID |
| `channelIds` | `number[]` | 是 | 渠道 ID 集合 |
| `scopeIds` | `number[]` | 是 | 范围 ID 集合 |
| `coverFileId` | `number` | 否 | 封面文件 ID |
| `carousel` | `boolean` | 是 | 是否轮播 |
| `landingUrl` | `string` | 是 | 落地页地址 |

##### `MarketingReviewPayload`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `number` | 是 | 内容 ID |
| `decision` | `MarketingReviewDecision` | 是 | 审核结果 |
| `comment` | `string` | 否 | 审核意见 |

##### `MarketingCommentPayload`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `number` | 是 | 内容 ID |
| `comment` | `string` | 否 | 附加备注 |

##### `MarketingCreateTaxonomyPayload`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `type` | `MarketingTaxonomyType` | 是 | 分类类型 |
| `code` | `string` | 是 | 分类编码 |
| `name` | `string` | 是 | 分类名称 |
| `locale` | `string` | 否 | 语言地区 |
| `sort` | `number` | 否 | 排序号 |
| `enabled` | `boolean` | 是 | 是否启用 |

##### `MarketingGenerateLinkPayload`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `activityId` | `number` | 是 | 活动 ID |
| `affiliateId` | `string` | 是 | KOL ID |
| `affiliateName` | `string` | 否 | KOL 名称 |
| `channelId` | `number` | 是 | 渠道 ID |
| `forceRegenerate` | `boolean` | 是 | 是否强制重新生成 |

##### `MarketingBatchGenerateLinksPayload`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `activityId` | `number` | 是 | 活动 ID |
| `affiliateIds` | `string[]` | 是 | KOL ID 集合 |
| `channelId` | `number` | 是 | 渠道 ID |
| `forceRegenerate` | `boolean` | 是 | 是否强制重新生成 |

---

## 7. Affinex 分析中心

### 7.1 模块资源编码

| 资源编码 | 说明 | 实际接口 |
| --- | --- | --- |
| `KOL_ANALYTICS_KOL_CONTRIBUTION` | KOL 贡献度分析 | `/admin/affinex/analytics/kolContribution` |
| `KOL_ANALYTICS_USER_CONVERSION` | 用户转化分析 | `/admin/affinex/analytics/userConversion` |
| `KOL_ANALYTICS_USER_RETENTION` | 用户留存分析 | `/admin/affinex/analytics/userRetention` |
| `KOL_ANALYTICS_PRODUCT` | 产品分析 | `/admin/affinex/analytics/product` |
| `KOL_ANALYTICS_GEO` | 地域分析 | `/admin/affinex/analytics/geo` |
| `KOL_ANALYTICS_CHANNEL_SOURCE` | 渠道来源分析 | `/admin/affinex/analytics/channelSource` |
| `KOL_ANALYTICS_TEAM_HIERARCHY` | 团队层级分析 | `/admin/affinex/analytics/teamHierarchy` |
| `KOL_ANALYTICS_RISK_EXCEPTION` | 风险异常分析 | `/admin/affinex/analytics/riskException` |
| `KOL_ANALYTICS_TREND_COMPARISON` | 趋势对比分析 | `/admin/affinex/analytics/trendComparison` |
| `KOL_ANALYTICS_DASHBOARD_CONFIG` | 看板配置 | `/admin/affinex/analytics/dashboardConfig` |

### 7.2 推广链接汇总响应结构

推广链接汇总接口原始响应不是 `value` 包裹，而是：

```json
{
  "success": true,
  "message": "ok",
  "summary": {}
}
```

### 7.3 接口清单

| 接口名称 | 方法 | 路径 | 请求模型 | 返回模型 | 说明 |
| --- | --- | --- | --- | --- | --- |
| 推广链接汇总 | `GET` | `/admin/affinex/promotionLinkSummary` | `PromotionLinkSummaryQuery` | `summary: PromotionLinkSummaryValue` | 推广链接总览 |
| KOL 贡献度分析 | `GET` | `/admin/affinex/analytics/kolContribution` | `AnalyticsQuery` | `ApiResponse<KolContributionAnalyticsValue>` | 排行+趋势 |
| 用户转化分析 | `GET` | `/admin/affinex/analytics/userConversion` | `AnalyticsQuery` | `ApiResponse<UserConversionAnalyticsValue>` | 漏斗+趋势 |
| 用户留存分析 | `GET` | `/admin/affinex/analytics/userRetention` | `AnalyticsQuery` | `ApiResponse<UserRetentionAnalyticsValue>` | 留存概览+分群 |
| 产品分析 | `GET` | `/admin/affinex/analytics/product` | `AnalyticsQuery` | `ApiResponse<ProductAnalyticsValue>` | 品种维度分析 |
| 地域分析 | `GET` | `/admin/affinex/analytics/geo` | `AnalyticsQuery` | `ApiResponse<GeoAnalyticsValue>` | 国家维度分析 |
| 渠道来源分析 | `GET` | `/admin/affinex/analytics/channelSource` | `AnalyticsQuery` | `ApiResponse<ChannelSourceAnalyticsValue>` | 渠道/系统分析 |
| 团队层级分析 | `GET` | `/admin/affinex/analytics/teamHierarchy` | `AnalyticsQuery` | `ApiResponse<TeamHierarchyAnalyticsValue>` | Owner 团队分析 |
| 风险异常分析 | `GET` | `/admin/affinex/analytics/riskException` | `AnalyticsQuery` | `ApiResponse<RiskExceptionAnalyticsValue>` | 风险异常面板 |
| 趋势对比分析 | `GET` | `/admin/affinex/analytics/trendComparison` | `AnalyticsQuery` | `ApiResponse<TrendComparisonAnalyticsValue>` | 当前区间与对比区间 |
| 获取看板配置 | `GET` | `/admin/affinex/analytics/dashboardConfig` | `resourceCode` | `ApiResponse<AnalyticsDashboardConfig>` | 获取页面组件配置 |
| 更新看板配置 | `PUT` | `/admin/affinex/analytics/dashboardConfig` | `resourceCode + widgets` | `ApiResponse<AnalyticsDashboardConfig>` | 保存组件显示配置 |

### 7.4 数据模型

#### `PromotionLinkSummaryQuery`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `startDate` | `string` | 否 | 开始日期 |
| `endDate` | `string` | 否 | 结束日期 |
| `affiliateId` | `string` | 否 | 可选 KOL ID；为空时统计当前权限范围内全部已审批 KOL |

#### `SummaryDateRange`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `startDate` | `string` | 是 | 开始日期 |
| `endDate` | `string` | 是 | 结束日期 |

#### `PromotionLinkSummaryValue`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `dateRange` | `SummaryDateRange` | 是 | 汇总周期 |
| `inventory` | `PromotionLinkInventorySummary` | 是 | 链接库存汇总 |
| `attribution` | `PromotionLinkAttributionSummary` | 是 | 归因汇总 |
| `performance` | `PromotionLinkPerformanceSummary` | 是 | 业绩汇总 |

#### `PromotionLinkInventorySummary`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `approvedKolCount` | `number` | 是 | 已审批 KOL 数 |
| `defaultLinkCount` | `number` | 是 | 默认短链数 |
| `activeDefaultLinkCount` | `number` | 是 | 生效中的默认短链数 |
| `activityLinkCount` | `number` | 是 | 活动链接数 |
| `enabledActivityLinkCount` | `number` | 是 | 启用中的活动链接数 |
| `totalLinkCount` | `number` | 是 | 总链接数 |
| `totalActiveLinkCount` | `number` | 是 | 总生效链接数 |

#### `PromotionLinkAttributionSummary`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `callbackAttributionEventCount` | `number` | 是 | 回调归因事件数 |
| `callbackAttributionUserCount` | `number` | 是 | 归因用户数 |

#### `PromotionLinkPerformanceSummary`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `registrationCount` | `number` | 是 | 注册人数 |
| `firstDepositUserCount` | `number` | 是 | 首存人数 |
| `successfulDepositAmountUsd` | `number` | 是 | 首存/成功入金金额 USD |
| `tradeUserCount` | `number` | 是 | 交易人数 |
| `tradeVolume` | `number` | 是 | 交易量 |
| `tradeAmountUsd` | `number` | 是 | 交易额 USD |
| `earnedCommissionUsd` | `number` | 是 | 已赚佣金 USD |
| `paidCommissionUsd` | `number` | 是 | 已付佣金 USD |

#### `AnalyticsQuery`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `startDate` | `string` | 否 | 当前区间开始日期 |
| `endDate` | `string` | 否 | 当前区间结束日期 |
| `affiliateId` | `string` | 否 | KOL ID |
| `affiliateCode` | `string` | 否 | KOL 编码 |
| `topN` | `number` | 否 | 排行类接口取前 N 条 |
| `compareStartDate` | `string` | 否 | 对比区间开始日期，仅趋势对比页使用 |
| `compareEndDate` | `string` | 否 | 对比区间结束日期，仅趋势对比页使用 |

#### `AnalyticsSummary`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `dateRange` | `SummaryDateRange` | 是 | 当前统计周期 |
| `visibleAffiliateCount` | `number` | 是 | 当前权限下可见 KOL 数 |
| `approvedAffiliateCount` | `number` | 是 | 已审批 KOL 数 |
| `registrationCount` | `number` | 是 | 注册数 |
| `firstDepositUserCount` | `number` | 是 | 首存人数 |
| `depositAmountUsd` | `number` | 是 | 入金金额 USD |
| `tradeUserCount` | `number` | 是 | 交易人数 |
| `tradeVolume` | `number` | 是 | 交易量 |
| `tradeAmountUsd` | `number` | 是 | 交易额 USD |
| `earnedCommissionUsd` | `number` | 是 | 已赚佣金 USD |
| `paidCommissionUsd` | `number` | 是 | 已付佣金 USD |

#### `AnalyticsTrendPoint`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `date` | `string` | 是 | 日期 |
| `callbackUserCount` | `number` | 是 | 归因用户数 |
| `registrationCount` | `number` | 是 | 注册数 |
| `firstDepositUserCount` | `number` | 是 | 首存人数 |
| `tradeUserCount` | `number` | 是 | 交易人数 |
| `tradeAmountUsd` | `number` | 是 | 交易额 USD |
| `earnedCommissionUsd` | `number` | 是 | 已赚佣金 USD |

#### 典型维度对象

##### `KolContributionItem`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `affiliateId` | `string` | KOL ID |
| `affiliateCode` | `string` | KOL 编码 |
| `affiliateName` | `string` | KOL 名称 |
| `ownerName` | `string` | Owner |
| `countryCode` | `string` | 国家 |
| `activeLinkCount` | `number` | 生效链接数 |
| `registrationCount` | `number` | 注册数 |
| `firstDepositUserCount` | `number` | 首存人数 |
| `tradeUserCount` | `number` | 交易人数 |
| `tradeAmountUsd` | `number` | 交易额 USD |
| `earnedCommissionUsd` | `number` | 已赚佣金 USD |
| `contributionShare` | `number` | 贡献占比 |

##### `UserConversionFunnel`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `callbackUserCount` | `number` | 回调用户数 |
| `registrationCount` | `number` | 注册数 |
| `firstDepositUserCount` | `number` | 首存人数 |
| `tradeUserCount` | `number` | 交易人数 |
| `callbackToRegistrationRate` | `number` | 回调到注册转化率 |
| `registrationToFirstDepositRate` | `number` | 注册到首存转化率 |
| `firstDepositToTradeRate` | `number` | 首存到交易转化率 |
| `overallTradeRate` | `number` | 总交易转化率 |

##### `UserRetentionOverview`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `averageRetention1dRate` | `number` | 1 日平均留存率 |
| `averageRetention7dRate` | `number` | 7 日平均留存率 |
| `averageRetention30dRate` | `number` | 30 日平均留存率 |

##### `UserRetentionItem`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `cohortDate` | `string` | Cohort 日期 |
| `registeredUserCount` | `number` | 注册人数 |
| `retained1dUserCount` | `number` | 1 日留存人数 |
| `retained7dUserCount` | `number` | 7 日留存人数 |
| `retained30dUserCount` | `number` | 30 日留存人数 |
| `retention1dRate` | `number` | 1 日留存率 |
| `retention7dRate` | `number` | 7 日留存率 |
| `retention30dRate` | `number` | 30 日留存率 |

##### `ProductAnalyticsItem`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `symbolCode` | `string` | 品种代码 |
| `symbolType` | `string` | 品种类型 |
| `tradeUserCount` | `number` | 交易人数 |
| `orderCount` | `number` | 订单数 |
| `tradeVolume` | `number` | 交易量 |
| `tradeAmountUsd` | `number` | 交易额 USD |
| `earnedCommissionUsd` | `number` | 已赚佣金 USD |
| `averageOrderValueUsd` | `number` | 平均订单金额 USD |

##### `GeoAnalyticsItem`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `countryCode` | `string` | 国家编码 |
| `registrationCount` | `number` | 注册数 |
| `firstDepositUserCount` | `number` | 首存人数 |
| `tradeUserCount` | `number` | 交易人数 |
| `depositAmountUsd` | `number` | 入金金额 USD |
| `tradeAmountUsd` | `number` | 交易额 USD |
| `earnedCommissionUsd` | `number` | 已赚佣金 USD |

##### `ChannelSourceItem`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `channel` | `string` | 渠道 |
| `channelType` | `string` | 渠道类型 |
| `registrationCount` | `number` | 注册数 |
| `firstDepositUserCount` | `number` | 首存人数 |
| `tradeUserCount` | `number` | 交易人数 |
| `depositAmountUsd` | `number` | 入金金额 USD |
| `tradeAmountUsd` | `number` | 交易额 USD |

##### `ChannelSourceSystemItem`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `system` | `string` | 操作系统 |
| `device` | `string` | 设备类型 |
| `registrationCount` | `number` | 注册数 |
| `tradeUserCount` | `number` | 交易人数 |

##### `TeamHierarchyItem`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `ownerAdminId` | `string` | Owner 管理员 ID |
| `ownerName` | `string` | Owner 名称 |
| `affiliateCount` | `number` | KOL 数 |
| `approvedAffiliateCount` | `number` | 已审批 KOL 数 |
| `activeLinkCount` | `number` | 生效链接数 |
| `registrationCount` | `number` | 注册数 |
| `firstDepositUserCount` | `number` | 首存人数 |
| `tradeUserCount` | `number` | 交易人数 |
| `earnedCommissionUsd` | `number` | 已赚佣金 USD |
| `paidCommissionUsd` | `number` | 已付佣金 USD |

##### `RiskExceptionOverview`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `pendingTrafficCount` | `number` | 待流量审核数 |
| `rejectedTrafficCount` | `number` | 流量拒绝数 |
| `pendingKycCount` | `number` | 待 KYC 审核数 |
| `rejectedKycCount` | `number` | KYC 拒绝数 |
| `declinedPaymentCount` | `number` | 打款拒绝数 |
| `declinedPaymentAmountUsd` | `number` | 拒绝打款金额 USD |
| `callbackWithoutRegistrationCount` | `number` | 有回调无注册数 |
| `registrationWithoutDepositCount` | `number` | 有注册无入金数 |
| `firstDepositWithoutTradeCount` | `number` | 有首存无交易数 |

##### `RiskExceptionItem`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `category` | `string` | 异常分类 |
| `label` | `string` | 异常标签 |
| `count` | `number` | 数量 |
| `amountUsd` | `number` | 涉及金额 USD |

##### `TrendComparisonMetric`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `metricCode` | `string` | 指标编码 |
| `label` | `string` | 指标名称 |
| `currentValue` | `number` | 当前区间值 |
| `compareValue` | `number` | 对比区间值 |
| `diffValue` | `number` | 差值 |
| `diffRate` | `number` | 差异比例 |

##### `TrendComparisonPoint`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `label` | `string` | 对齐标签 |
| `currentDate` | `string` | 当前日期 |
| `compareDate` | `string` | 对比日期 |
| `currentRegistrationCount` | `number` | 当前注册数 |
| `compareRegistrationCount` | `number` | 对比注册数 |
| `currentTradeUserCount` | `number` | 当前交易人数 |
| `compareTradeUserCount` | `number` | 对比交易人数 |
| `currentTradeAmountUsd` | `number` | 当前交易额 USD |
| `compareTradeAmountUsd` | `number` | 对比交易额 USD |
| `currentEarnedCommissionUsd` | `number` | 当前已赚佣金 USD |
| `compareEarnedCommissionUsd` | `number` | 对比已赚佣金 USD |

#### 看板配置

##### `DashboardWidgetConfig`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `widgetCode` | `string` | 是 | 组件编码 |
| `title` | `string` | 是 | 组件标题 |
| `visible` | `boolean` | 是 | 是否显示 |
| `sort` | `number` | 是 | 排序号 |

##### `AnalyticsDashboardConfig`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `resourceCode` | `string` | 是 | 分析页面资源编码 |
| `defaultDatePreset` | `last7d \| last30d \| last90d \| ""` | 是 | 默认时间预设 |
| `widgets` | `DashboardWidgetConfig[]` | 是 | 组件配置列表 |
| `updatedAt` | `string` | 是 | 更新时间 |

---

## 8. 系统配置

### 8.1 接口清单

| 接口名称 | 方法 | 路径 | 请求模型 | 返回模型 | 说明 |
| --- | --- | --- | --- | --- | --- |
| 获取文件存储配置 | `GET` | `/admin/file_storage/config` | 无 | `item: FileStorageConfig` | 查询文件存储配置 |
| 更新文件存储配置 | `PUT` | `/admin/file_storage/config` | `UpdateFileStorageConfigPayload` | `item: FileStorageConfig` | 更新文件存储配置 |

### 8.2 原始响应结构

```json
{
  "success": true,
  "message": "ok",
  "item": {
    "provider": "local",
    "publicBaseUrl": "http://localhost:8090",
    "localRootDir": "F:/workSpace2028/file",
    "updatedAt": "2026-05-07 12:00:00"
  }
}
```

### 8.3 数据模型

#### `FileStorageConfig`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `provider` | `string` | 是 | 存储提供方，当前页面支持 `local`、`oss`、`minio` |
| `publicBaseUrl` | `string` | 是 | 外部访问基础 URL |
| `localRootDir` | `string` | 是 | 本地存储根目录 |
| `updatedAt` | `string` | 是 | 更新时间 |

#### `UpdateFileStorageConfigPayload`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `provider` | `string` | 是 | 存储提供方 |
| `publicBaseUrl` | `string` | 否 | 对外访问基础 URL |
| `localRootDir` | `string` | 否 | 本地根目录 |

---

## 9. 补充说明

### 9.1 当前项目里存在的两套后端风格

| 风格 | 典型模块 | 说明 |
| --- | --- | --- |
| 标准 `value` 包裹 | 登录、KOL 管理、结算中心、Affinex 分析大多数接口 | 适合直接产出 Swagger/OpenAPI |
| 顶层 `item/items/summary` | 营销中心、文件存储配置、推广链接汇总 | 建议后续后端统一返回结构，降低前端适配成本 |

### 9.2 建议后续补充的 OpenAPI 信息

当前代码里以下信息尚未完全由类型系统覆盖，若要形成正式后端接口文档，建议补充：

1. 各状态字段的后端字典说明与中英文文案。
2. 金额字段的精度、币种和四舍五入规则。
3. 日期字段时区口径，尤其是结算中心交易明细页目前页面说明为 `UTC+0`。
4. 权限过滤字段 `trafficApprovedBy`、`adminId`、`ownerName` 的真实后端含义。
5. 营销中心顶层响应结构是否计划统一为 `value` 包裹。
