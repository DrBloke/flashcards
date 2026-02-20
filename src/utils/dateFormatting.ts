import { html } from "lit";
import "@awesome.me/webawesome/dist/components/format-date/format-date.js";

export function formatDueDate(
  targetDate: Date | number | string,
  baseDate: Date = new Date(),
) {
  const target = new Date(targetDate);
  const base = new Date(baseDate);

  const targetTime = target.getTime();
  const baseTime = base.getTime();
  const diffMs = baseTime - targetTime;

  // Determine if it's strictly overdue
  if (diffMs > 0) {
    if (diffMs < 60 * 60 * 1000) {
      // Less than an hour overdue
      const mins = Math.round(diffMs / (60 * 1000));
      return html`By ${mins} min${mins !== 1 ? "s" : ""}`;
    } else if (diffMs < 24 * 60 * 60 * 1000) {
      // Less than 24 hours overdue
      const hours = Math.round(diffMs / (60 * 60 * 1000));
      return html`By ${hours} hour${hours !== 1 ? "s" : ""}`;
    } else {
      // More than 24 hours overdue
      return html`Since
        <wa-format-date
          date=${target.toISOString()}
          hour="numeric"
          minute="numeric"
          time-zone="UTC"
        ></wa-format-date>
        on
        <wa-format-date
          date=${target.toISOString()}
          weekday="long"
          day="numeric"
          month="long"
        ></wa-format-date>`;
    }
  }

  // Future or exactly now
  const targetStrDate = target.toLocaleDateString();
  const baseStrDate = base.toLocaleDateString();

  const tomorrow = new Date(base);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStrDate = tomorrow.toLocaleDateString();

  if (targetStrDate === baseStrDate) {
    return html`Today at
      <wa-format-date
        date=${target.toISOString()}
        hour="numeric"
        minute="numeric"
        time-zone="UTC"
      ></wa-format-date>`;
  } else if (targetStrDate === tomorrowStrDate) {
    return html`Tomorrow at
      <wa-format-date
        date=${target.toISOString()}
        hour="numeric"
        minute="numeric"
      ></wa-format-date>`;
  } else {
    // Two or more days away
    return html`<wa-format-date
        date=${target.toISOString()}
        weekday="long"
        day="numeric"
        month="long"
      ></wa-format-date>
      at
      <wa-format-date
        date=${target.toISOString()}
        hour="numeric"
        minute="numeric"
        time-zone="UTC"
      ></wa-format-date>`;
  }
}
