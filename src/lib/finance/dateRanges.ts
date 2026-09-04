export type FinanceDateRangeKey =
  | "today"
  | "last_7_days"
  | "this_month"
  | "last_month"
  | "this_year"
  | "last_year";

export type FinanceDateRange = {
  key: FinanceDateRangeKey;
  label: string;
  start: Date;
  end: Date;
  minCreated: number;
  maxCreated: number;
};

export const financeDateRangeOptions: {
  key: FinanceDateRangeKey;
  label: string;
}[] = [
  {
    key: "today",
    label: "Today",
  },
  {
    key: "last_7_days",
    label: "Last 7 Days",
  },
  {
    key: "this_month",
    label: "This Month",
  },
  {
    key: "last_month",
    label: "Last Month",
  },
  {
    key: "this_year",
    label: "This Year",
  },
  {
    key: "last_year",
    label: "Last Year",
  },
];

function startOfDay(
  date: Date,
) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0,
    0,
    0,
    0,
  );
}

function endOfDay(
  date: Date,
) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  );
}

export function getFinanceDateRange(
  key: FinanceDateRangeKey,
  now = new Date(),
): FinanceDateRange {
  let start: Date;
  let end: Date;

  switch (key) {
    case "today": {
      start = startOfDay(now);
      end = endOfDay(now);
      break;
    }

    case "last_7_days": {
      start = startOfDay(
        new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - 6,
        ),
      );

      end = endOfDay(now);
      break;
    }

    case "this_month": {
      start = new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
        0,
        0,
        0,
        0,
      );

      end = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );

      break;
    }

    case "last_month": {
      start = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1,
        0,
        0,
        0,
        0,
      );

      end = new Date(
        now.getFullYear(),
        now.getMonth(),
        0,
        23,
        59,
        59,
        999,
      );

      break;
    }

    case "this_year": {
      start = new Date(
        now.getFullYear(),
        0,
        1,
        0,
        0,
        0,
        0,
      );

      end = new Date(
        now.getFullYear(),
        11,
        31,
        23,
        59,
        59,
        999,
      );

      break;
    }

    case "last_year": {
      start = new Date(
        now.getFullYear() - 1,
        0,
        1,
        0,
        0,
        0,
        0,
      );

      end = new Date(
        now.getFullYear() - 1,
        11,
        31,
        23,
        59,
        59,
        999,
      );

      break;
    }
  }

  const option =
    financeDateRangeOptions.find(
      (item) => item.key === key,
    );

  return {
    key,
    label: option?.label ?? key,
    start,
    end,

    minCreated: Math.floor(
      start.getTime() / 1000,
    ),

    maxCreated: Math.floor(
      end.getTime() / 1000,
    ),
  };
}