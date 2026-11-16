/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
// plane imports
import type { TAuthErrorInfo } from "@plane/constants";
import { E_PASSWORD_STRENGTH, EErrorAlertType, EAuthErrorCodes } from "@plane/constants";

/**
 * @description Password strength levels
 */
export enum PasswordStrength {
  EMPTY = "empty",
  WEAK = "weak",
  FAIR = "fair",
  GOOD = "good",
  STRONG = "strong",
}

/**
 * Calculate password strength based on various criteria
 */
export const getPasswordStrength = (password: string): E_PASSWORD_STRENGTH => {
  if (!password || password === "" || password.length <= 0) {
    return E_PASSWORD_STRENGTH.EMPTY;
  }

  if (password.length < 8) {
    return E_PASSWORD_STRENGTH.LENGTH_NOT_VALID;
  }

  // Check all criteria
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()\-_+=\[\]{}|;:'",.<>?/]/.test(password);

  if (hasUpperCase && hasLowerCase && hasDigit && hasSpecialChar) {
    return E_PASSWORD_STRENGTH.STRENGTH_VALID;
  }

  return E_PASSWORD_STRENGTH.STRENGTH_NOT_VALID;
};

export type PasswordCriteria = {
  key: string;
  label: string;
  isValid: boolean;
};

/**
 * Get password criteria for validation display
 */
export const getPasswordCriteria = (password: string): PasswordCriteria[] => [
  {
    key: "length",
    label: "至少 8 个字符",
    isValid: password.length >= 8,
  },
  {
    key: "uppercase",
    label: "至少包含 1 个大写字母",
    isValid: /[A-Z]/.test(password),
  },
  {
    key: "lowercase",
    label: "至少包含 1 个小写字母",
    isValid: /[a-z]/.test(password),
  },
  {
    key: "number",
    label: "至少包含 1 个数字",
    isValid: /[0-9]/.test(password),
  },
  {
    key: "special",
    label: "至少包含 1 个特殊字符",
    isValid: /[!@#$%^&*()\-_+=\[\]{}|;:'",.<>?/]/.test(password),
  },
];

// Error code messages
const errorCodeMessages: {
  [key in EAuthErrorCodes]: { title: string; message: (email?: string) => ReactNode };
} = {
  // global
  [EAuthErrorCodes.INSTANCE_NOT_CONFIGURED]: {
    title: "实例尚未配置",
    message: () => "实例尚未配置，请联系管理员。",
  },
  [EAuthErrorCodes.SIGNUP_DISABLED]: {
    title: "已禁用注册",
    message: () => "已禁用注册，请联系管理员。",
  },
  [EAuthErrorCodes.INVALID_PASSWORD]: {
    title: "密码无效",
    message: () => "密码无效，请重试。",
  },
  [EAuthErrorCodes.PASSWORD_TOO_WEAK]: {
    title: "密码强度不足",
    message: () => "请使用强度更高的密码。",
  },
  [EAuthErrorCodes.SMTP_NOT_CONFIGURED]: {
    title: "邮件服务尚未配置",
    message: () => "邮件服务尚未配置，请联系管理员。",
  },
  // email check in both sign up and sign in
  [EAuthErrorCodes.INVALID_EMAIL]: {
    title: "邮箱地址无效",
    message: () => "邮箱地址无效，请重试。",
  },
  [EAuthErrorCodes.EMAIL_REQUIRED]: {
    title: "请输入邮箱",
    message: () => "请输入邮箱，请重试。",
  },
  // sign up
  [EAuthErrorCodes.USER_ALREADY_EXIST]: {
    title: "用户已存在",
    message: () => "此账户已注册，请登录。",
  },
  [EAuthErrorCodes.REQUIRED_EMAIL_PASSWORD_SIGN_UP]: {
    title: "请输入邮箱和密码",
    message: () => "请输入邮箱和密码，请重试。",
  },
  [EAuthErrorCodes.AUTHENTICATION_FAILED_SIGN_UP]: {
    title: "身份验证失败",
    message: () => "身份验证失败，请重试。",
  },
  [EAuthErrorCodes.INVALID_EMAIL_SIGN_UP]: {
    title: "邮箱地址无效",
    message: () => "邮箱地址无效，请重试。",
  },
  [EAuthErrorCodes.MAGIC_SIGN_UP_EMAIL_CODE_REQUIRED]: {
    title: "请输入邮箱和验证码",
    message: () => "请输入邮箱和验证码，请重试。",
  },
  [EAuthErrorCodes.INVALID_EMAIL_MAGIC_SIGN_UP]: {
    title: "邮箱地址无效",
    message: () => "邮箱地址无效，请重试。",
  },
  // sign in
  [EAuthErrorCodes.BOT_USER_LOGIN_FORBIDDEN]: {
    title: "不允许登录",
    message: () => "此账户无法登录，请使用个人账户。",
  },
  [EAuthErrorCodes.USER_ACCOUNT_DEACTIVATED]: {
    title: "用户账户已停用",
    message: () => "用户账户已停用，请联系管理员。",
  },
  [EAuthErrorCodes.USER_DOES_NOT_EXIST]: {
    title: "用户不存在",
    message: () => "未找到账户，请先创建账户。",
  },
  [EAuthErrorCodes.REQUIRED_EMAIL_PASSWORD_SIGN_IN]: {
    title: "请输入邮箱和密码",
    message: () => "请输入邮箱和密码，请重试。",
  },
  [EAuthErrorCodes.AUTHENTICATION_FAILED_SIGN_IN]: {
    title: "身份验证失败",
    message: () => "身份验证失败，请重试。",
  },
  [EAuthErrorCodes.INVALID_EMAIL_SIGN_IN]: {
    title: "邮箱地址无效",
    message: () => "邮箱地址无效，请重试。",
  },
  [EAuthErrorCodes.MAGIC_SIGN_IN_EMAIL_CODE_REQUIRED]: {
    title: "请输入邮箱和验证码",
    message: () => "请输入邮箱和验证码，请重试。",
  },
  [EAuthErrorCodes.INVALID_EMAIL_MAGIC_SIGN_IN]: {
    title: "邮箱地址无效",
    message: () => "邮箱地址无效，请重试。",
  },
  // Both Sign in and Sign up
  [EAuthErrorCodes.INVALID_MAGIC_CODE_SIGN_IN]: {
    title: "身份验证失败",
    message: () => "验证码无效，请重试。",
  },
  [EAuthErrorCodes.INVALID_MAGIC_CODE_SIGN_UP]: {
    title: "身份验证失败",
    message: () => "验证码无效，请重试。",
  },
  [EAuthErrorCodes.EXPIRED_MAGIC_CODE_SIGN_IN]: {
    title: "验证码已过期",
    message: () => "验证码已过期，请重试。",
  },
  [EAuthErrorCodes.EXPIRED_MAGIC_CODE_SIGN_UP]: {
    title: "验证码已过期",
    message: () => "验证码已过期，请重试。",
  },
  [EAuthErrorCodes.EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_IN]: {
    title: "验证码已过期",
    message: () => "验证码已过期，请重试。",
  },
  [EAuthErrorCodes.EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_UP]: {
    title: "验证码已过期",
    message: () => "验证码已过期，请重试。",
  },
  // Oauth
  [EAuthErrorCodes.OAUTH_NOT_CONFIGURED]: {
    title: "第三方身份验证尚未配置",
    message: () => "第三方身份验证尚未配置，请联系管理员。",
  },
  [EAuthErrorCodes.GOOGLE_NOT_CONFIGURED]: {
    title: "谷歌登录尚未配置",
    message: () => "谷歌登录尚未配置，请联系管理员。",
  },
  [EAuthErrorCodes.GITHUB_NOT_CONFIGURED]: {
    title: "代码托管平台登录尚未配置",
    message: () => "代码托管平台登录尚未配置，请联系管理员。",
  },
  [EAuthErrorCodes.GITLAB_NOT_CONFIGURED]: {
    title: "代码托管平台登录尚未配置",
    message: () => "代码托管平台登录尚未配置，请联系管理员。",
  },
  [EAuthErrorCodes.GOOGLE_OAUTH_PROVIDER_ERROR]: {
    title: "谷歌身份验证服务出错",
    message: () => "谷歌身份验证服务出错，请重试。",
  },
  [EAuthErrorCodes.GITHUB_OAUTH_PROVIDER_ERROR]: {
    title: "代码托管平台身份验证服务出错",
    message: () => "代码托管平台身份验证服务出错，请重试。",
  },
  [EAuthErrorCodes.GITLAB_OAUTH_PROVIDER_ERROR]: {
    title: "代码托管平台身份验证服务出错",
    message: () => "代码托管平台身份验证服务出错，请重试。",
  },
  // Reset Password
  [EAuthErrorCodes.INVALID_PASSWORD_TOKEN]: {
    title: "密码重置令牌无效",
    message: () => "密码重置令牌无效，请重试。",
  },
  [EAuthErrorCodes.EXPIRED_PASSWORD_TOKEN]: {
    title: "密码重置令牌已过期",
    message: () => "密码重置令牌已过期，请重试。",
  },
  // Change password
  [EAuthErrorCodes.MISSING_PASSWORD]: {
    title: "请输入密码",
    message: () => "请输入密码，请重试。",
  },
  [EAuthErrorCodes.INCORRECT_OLD_PASSWORD]: {
    title: "旧密码不正确",
    message: () => "旧密码不正确，请重试。",
  },
  [EAuthErrorCodes.INVALID_NEW_PASSWORD]: {
    title: "新密码无效",
    message: () => "新密码无效，请重试。",
  },
  // set password
  [EAuthErrorCodes.PASSWORD_ALREADY_SET]: {
    title: "已设置密码",
    message: () => "已设置密码，请重试。",
  },
  // admin
  [EAuthErrorCodes.ADMIN_ALREADY_EXIST]: {
    title: "管理员已存在",
    message: () => "管理员已存在，请重试。",
  },
  [EAuthErrorCodes.REQUIRED_ADMIN_EMAIL_PASSWORD_FIRST_NAME]: {
    title: "请输入邮箱、密码和名字",
    message: () => "请输入邮箱、密码和名字，请重试。",
  },
  [EAuthErrorCodes.INVALID_ADMIN_EMAIL]: {
    title: "管理员邮箱无效",
    message: () => "管理员邮箱无效，请重试。",
  },
  [EAuthErrorCodes.INVALID_ADMIN_PASSWORD]: {
    title: "管理员密码无效",
    message: () => "管理员密码无效，请重试。",
  },
  [EAuthErrorCodes.REQUIRED_ADMIN_EMAIL_PASSWORD]: {
    title: "请输入邮箱和密码",
    message: () => "请输入邮箱和密码，请重试。",
  },
  [EAuthErrorCodes.ADMIN_AUTHENTICATION_FAILED]: {
    title: "身份验证失败",
    message: () => "身份验证失败，请重试。",
  },
  [EAuthErrorCodes.ADMIN_USER_ALREADY_EXIST]: {
    title: "管理员用户已存在",
    message: () => "管理员用户已存在，请登录。",
  },
  [EAuthErrorCodes.ADMIN_USER_DOES_NOT_EXIST]: {
    title: "管理员用户不存在",
    message: () => "管理员用户不存在，请登录其他账户。",
  },
  [EAuthErrorCodes.MAGIC_LINK_LOGIN_DISABLED]: {
    title: "已禁用邮件链接登录",
    message: () => "已禁用邮件链接登录，请使用密码登录。",
  },
  [EAuthErrorCodes.PASSWORD_LOGIN_DISABLED]: {
    title: "已禁用密码登录",
    message: () => "已禁用密码登录，请使用邮件链接登录。",
  },
  [EAuthErrorCodes.ADMIN_USER_DEACTIVATED]: {
    title: "管理员用户已停用",
    message: () => "管理员账户已停用，请联系管理员。",
  },
  [EAuthErrorCodes.RATE_LIMIT_EXCEEDED]: {
    title: "请求过于频繁",
    message: () => "请求过于频繁，请稍后重试。",
  },
};

// Error handler
export const authErrorHandler = (errorCode: EAuthErrorCodes, email?: string): TAuthErrorInfo | undefined => {
  const bannerAlertErrorCodes = [
    EAuthErrorCodes.INSTANCE_NOT_CONFIGURED,
    EAuthErrorCodes.INVALID_EMAIL,
    EAuthErrorCodes.EMAIL_REQUIRED,
    EAuthErrorCodes.SIGNUP_DISABLED,
    EAuthErrorCodes.INVALID_PASSWORD,
    EAuthErrorCodes.SMTP_NOT_CONFIGURED,
    EAuthErrorCodes.USER_ALREADY_EXIST,
    EAuthErrorCodes.AUTHENTICATION_FAILED_SIGN_UP,
    EAuthErrorCodes.REQUIRED_EMAIL_PASSWORD_SIGN_UP,
    EAuthErrorCodes.INVALID_EMAIL_SIGN_UP,
    EAuthErrorCodes.INVALID_EMAIL_MAGIC_SIGN_UP,
    EAuthErrorCodes.MAGIC_SIGN_UP_EMAIL_CODE_REQUIRED,
    EAuthErrorCodes.USER_DOES_NOT_EXIST,
    EAuthErrorCodes.AUTHENTICATION_FAILED_SIGN_IN,
    EAuthErrorCodes.REQUIRED_EMAIL_PASSWORD_SIGN_IN,
    EAuthErrorCodes.INVALID_EMAIL_SIGN_IN,
    EAuthErrorCodes.INVALID_EMAIL_MAGIC_SIGN_IN,
    EAuthErrorCodes.MAGIC_SIGN_IN_EMAIL_CODE_REQUIRED,
    EAuthErrorCodes.INVALID_MAGIC_CODE_SIGN_IN,
    EAuthErrorCodes.INVALID_MAGIC_CODE_SIGN_UP,
    EAuthErrorCodes.EXPIRED_MAGIC_CODE_SIGN_IN,
    EAuthErrorCodes.EXPIRED_MAGIC_CODE_SIGN_UP,
    EAuthErrorCodes.EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_IN,
    EAuthErrorCodes.EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_UP,
    EAuthErrorCodes.OAUTH_NOT_CONFIGURED,
    EAuthErrorCodes.GOOGLE_NOT_CONFIGURED,
    EAuthErrorCodes.GITHUB_NOT_CONFIGURED,
    EAuthErrorCodes.GITLAB_NOT_CONFIGURED,
    EAuthErrorCodes.GOOGLE_OAUTH_PROVIDER_ERROR,
    EAuthErrorCodes.GITHUB_OAUTH_PROVIDER_ERROR,
    EAuthErrorCodes.GITLAB_OAUTH_PROVIDER_ERROR,
    EAuthErrorCodes.INVALID_PASSWORD_TOKEN,
    EAuthErrorCodes.EXPIRED_PASSWORD_TOKEN,
    EAuthErrorCodes.INCORRECT_OLD_PASSWORD,
    EAuthErrorCodes.INVALID_NEW_PASSWORD,
    EAuthErrorCodes.PASSWORD_ALREADY_SET,
    EAuthErrorCodes.ADMIN_ALREADY_EXIST,
    EAuthErrorCodes.REQUIRED_ADMIN_EMAIL_PASSWORD_FIRST_NAME,
    EAuthErrorCodes.INVALID_ADMIN_EMAIL,
    EAuthErrorCodes.INVALID_ADMIN_PASSWORD,
    EAuthErrorCodes.REQUIRED_ADMIN_EMAIL_PASSWORD,
    EAuthErrorCodes.ADMIN_AUTHENTICATION_FAILED,
    EAuthErrorCodes.ADMIN_USER_ALREADY_EXIST,
    EAuthErrorCodes.ADMIN_USER_DOES_NOT_EXIST,
    EAuthErrorCodes.BOT_USER_LOGIN_FORBIDDEN,
    EAuthErrorCodes.USER_ACCOUNT_DEACTIVATED,
  ];

  if (bannerAlertErrorCodes.includes(errorCode))
    return {
      type: EErrorAlertType.BANNER_ALERT,
      code: errorCode,
      title: errorCodeMessages[errorCode]?.title || "错误",
      message: errorCodeMessages[errorCode]?.message(email) || "操作失败，请重试。",
    };

  return undefined;
};
