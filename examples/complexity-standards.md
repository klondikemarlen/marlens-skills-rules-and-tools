# Complexity Standards

## Task

“Add a required date-only field to a browser form.”

## Without This Package

```tsx
<DatePicker
  id="starts-on"
  required
  value={form.startsOn}
  onChange={(date) => form.setValue("startsOn", toIsoDate(date))}
/>
```

The wrapper adds component state, date conversion, and a dependency boundary for a standard form control.

## With This Package's Complexity Standards

```html
<label for="starts-on">Starts on</label>
<input
  id="starts-on"
  name="startsOn"
  type="date"
  required
/>
```

## Why

The browser owns date entry and submits an ISO `YYYY-MM-DD` value. The labelled native control makes the input, validation, and ownership visible at the form boundary. Introduce a custom component only when the product requires behavior a native date input cannot provide, such as a date range or unavailable-date calendar.

## Check

Exercise the form with a valid date and verify the submitted value is `YYYY-MM-DD`. Verify the form rejects an empty required value before submission.

Source: [`Complexity Standards`](../AGENTS.md#complexity-standards).
