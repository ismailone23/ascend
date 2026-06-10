import dayjs from "dayjs";

export const dates = Array.from({ length: 30 }, (_, i) =>
  dayjs().subtract(15, "day").add(i, "day"),
);
