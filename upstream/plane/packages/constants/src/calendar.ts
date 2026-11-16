/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TCalendarLayouts } from "@plane/types";
import { EStartOfTheWeek } from "@plane/types";

export const MONTHS_LIST: {
  [monthNumber: number]: {
    shortTitle: string;
    title: string;
  };
} = {
  1: {
    shortTitle: "Jan",
    title: "1月",
  },
  2: {
    shortTitle: "Feb",
    title: "2月",
  },
  3: {
    shortTitle: "Mar",
    title: "3月",
  },
  4: {
    shortTitle: "Apr",
    title: "4月",
  },
  5: {
    shortTitle: "May",
    title: "5月",
  },
  6: {
    shortTitle: "Jun",
    title: "6月",
  },
  7: {
    shortTitle: "Jul",
    title: "7月",
  },
  8: {
    shortTitle: "Aug",
    title: "8月",
  },
  9: {
    shortTitle: "Sep",
    title: "9月",
  },
  10: {
    shortTitle: "Oct",
    title: "10月",
  },
  11: {
    shortTitle: "Nov",
    title: "11月",
  },
  12: {
    shortTitle: "Dec",
    title: "12月",
  },
};

export const DAYS_LIST: {
  [dayIndex: number]: {
    shortTitle: string;
    title: string;
    value: EStartOfTheWeek;
  };
} = {
  1: {
    shortTitle: "Sun",
    title: "星期日",
    value: EStartOfTheWeek.SUNDAY,
  },
  2: {
    shortTitle: "Mon",
    title: "星期一",
    value: EStartOfTheWeek.MONDAY,
  },
  3: {
    shortTitle: "Tue",
    title: "星期二",
    value: EStartOfTheWeek.TUESDAY,
  },
  4: {
    shortTitle: "Wed",
    title: "星期三",
    value: EStartOfTheWeek.WEDNESDAY,
  },
  5: {
    shortTitle: "Thu",
    title: "星期四",
    value: EStartOfTheWeek.THURSDAY,
  },
  6: {
    shortTitle: "Fri",
    title: "星期五",
    value: EStartOfTheWeek.FRIDAY,
  },
  7: {
    shortTitle: "Sat",
    title: "星期六",
    value: EStartOfTheWeek.SATURDAY,
  },
};

export const CALENDAR_LAYOUTS: {
  [layout in TCalendarLayouts]: {
    key: TCalendarLayouts;
    title: string;
  };
} = {
  month: {
    key: "month",
    title: "月视图",
  },
  week: {
    key: "week",
    title: "周视图",
  },
};
