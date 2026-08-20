# Notification Event Service Template

Use this when one domain notification event may notify users through in-app rows, email jobs, or both. Event services represent domain notification events, not delivery mechanisms: name them for the event, not for actions like `SendEmail` or `CreateNotification`. Do not add this layer for a simple in-app-only row with no expected second channel; call the existing notification create service directly.

## Stack Assumptions

- TypeScript backend service classes with async `perform()` methods.
- A notification row model/table already exists for in-app notifications.
- A mailer, queue, or background job API exists for email delivery.
- User notification preferences may enable or disable each channel per recipient and event type.
- Transaction boundaries, model imports, and queue adapters are project-local and must be substituted.

## Placeholders

- `{EventServiceName}`: PascalCase event service class, e.g. `ResourcePublished`.
- `{EventType}`: notification event enum/key, e.g. `RESOURCE_PUBLISHED`.
- `{SourceType}`: notification source enum/key, e.g. `RESOURCE`.
- `{SourceModel}`: source domain model type.
- `{RecipientModel}`: recipient user model type.
- `{ActorModel}`: actor/current-user model type.
- `{NotificationModel}`: in-app notification model type.
- `{NotificationCreateService}`: existing in-app notification creation service.
- `{NotificationPreferenceService}`: helper that resolves per-recipient channel preferences.
- `{EventMailer}`: email mailer/job object for this event.
- `{event-mailers}`: kebab-case/alias path segment for event mailers.
- `{eventHref}`: route or URL shown from the in-app row/email.

## Boring Current Approach

Keep the event service as a coordinator. It owns event-specific recipients and user-facing copy, then delegates channel effects to private methods. It should not become a generic notification framework.

### Delivery Options

```typescript
export type NotificationDeliveryOptions = {
  inApp?: boolean
  email?: boolean
}

export const DEFAULT_NOTIFICATION_DELIVERY_OPTIONS: Required<NotificationDeliveryOptions> = {
  inApp: true,
  email: true,
}
```

### Single Recipient Event Service

```typescript
import { {EventMailer} } from "@/mailers/{event-mailers}"
import { {ActorModel}, {NotificationModel}, {RecipientModel}, {SourceModel} } from "@/models"
import { {NotificationCreateService}, {NotificationPreferenceService} } from "@/services"
import {
  DEFAULT_NOTIFICATION_DELIVERY_OPTIONS,
  type NotificationDeliveryOptions,
} from "@/services/notifications/delivery-options"

export class {EventServiceName} {
  private deliveryOptions: Required<NotificationDeliveryOptions>

  constructor(
    private source: {SourceModel},
    private recipient: {RecipientModel},
    private actor: {ActorModel},
    options: NotificationDeliveryOptions = {}
  ) {
    this.deliveryOptions = { ...DEFAULT_NOTIFICATION_DELIVERY_OPTIONS, ...options }
  }

  async perform(): Promise<{NotificationModel} | undefined> {
    let notification: {NotificationModel} | undefined

    if (await this.shouldCreateInAppNotification(this.recipient)) {
      notification = await this.createInAppNotification(this.recipient)
    }

    if (await this.shouldEnqueueEmailNotification(this.recipient)) {
      await this.enqueueEmailNotification(this.recipient)
    }

    return notification
  }

  private async shouldCreateInAppNotification(recipient: {RecipientModel}): Promise<boolean> {
    if (!this.deliveryOptions.inApp) return false

    return {NotificationPreferenceService}.isChannelEnabled(recipient, "{EventType}", "in_app")
  }

  private async shouldEnqueueEmailNotification(recipient: {RecipientModel}): Promise<boolean> {
    if (!this.deliveryOptions.email) return false

    return {NotificationPreferenceService}.isChannelEnabled(recipient, "{EventType}", "email")
  }

  private async createInAppNotification(recipient: {RecipientModel}): Promise<{NotificationModel}> {
    return {NotificationCreateService}.perform(
      {
        eventType: "{EventType}",
        sourceType: "{SourceType}",
        sourceId: this.source.id,
        title: "Notification title",
        subtitle: "Notification subtitle.",
        href: {eventHref},
        userId: recipient.id,
      },
      this.actor
    )
  }

  private async enqueueEmailNotification(recipient: {RecipientModel}): Promise<void> {
    await {EventMailer}.performLater(this.source, recipient, this.actor)
  }
}

export default {EventServiceName}
```

### Multiple Recipient Event Service With Attributes

Use an `attributes` argument for notification-row-like copy fields. Keep domain models as explicit constructor arguments.

```typescript
type {EventServiceName}NotificationAttributes = {
  title: string
  subtitle: string
}

export class {EventServiceName} {
  private deliveryOptions: Required<NotificationDeliveryOptions>

  constructor(
    private source: {SourceModel},
    private recipients: {RecipientModel}[],
    private attributes: {EventServiceName}NotificationAttributes,
    private actor: {ActorModel},
    options: NotificationDeliveryOptions = {}
  ) {
    this.deliveryOptions = { ...DEFAULT_NOTIFICATION_DELIVERY_OPTIONS, ...options }
  }

  async perform(): Promise<{NotificationModel}[]> {
    const notifications: {NotificationModel}[] = []

    for (const recipient of this.recipients) {
      if (await this.shouldCreateInAppNotification(recipient)) {
        notifications.push(await this.createInAppNotification(recipient, this.attributes))
      }

      if (await this.shouldEnqueueEmailNotification(recipient)) {
        await this.enqueueEmailNotification(recipient, this.attributes)
      }
    }

    return notifications
  }

  private async shouldCreateInAppNotification(recipient: {RecipientModel}): Promise<boolean> {
    if (!this.deliveryOptions.inApp) return false

    return {NotificationPreferenceService}.isChannelEnabled(recipient, "{EventType}", "in_app")
  }

  private async shouldEnqueueEmailNotification(recipient: {RecipientModel}): Promise<boolean> {
    if (!this.deliveryOptions.email) return false

    return {NotificationPreferenceService}.isChannelEnabled(recipient, "{EventType}", "email")
  }

  private async createInAppNotification(
    recipient: {RecipientModel},
    attributes: {EventServiceName}NotificationAttributes
  ): Promise<{NotificationModel}> {
    return {NotificationCreateService}.perform(
      {
        ...attributes,
        eventType: "{EventType}",
        sourceType: "{SourceType}",
        sourceId: this.source.id,
        href: {eventHref},
        userId: recipient.id,
      },
      this.actor
    )
  }

  private async enqueueEmailNotification(
    recipient: {RecipientModel},
    attributes: {EventServiceName}NotificationAttributes
  ): Promise<void> {
    const { title, subtitle } = attributes

    await {EventMailer}.performLater(this.source, recipient, title, subtitle, this.actor)
  }
}
```

## Integration Checklist

1. Add or confirm the event type in the notification event enum/config.
2. Add UI labels or preference labels for the event if users can configure it.
3. Add or confirm the mailer/job when email delivery is supported.
4. Export the event service from the nearest services index.
5. Replace separate in-app/email calls with one event-service call.
6. Keep `options: NotificationDeliveryOptions = {}` as the final constructor argument.
7. Add focused service tests for observable delivery contracts:
   - default options create an in-app notification row when preferences allow it
   - default options enqueue email when preferences allow it
   - `inApp: false` does not create an in-app row
   - `email: false` does not enqueue email
   - disabled recipient preferences suppress the matching channel
   - enabled recipient preferences allow the matching channel
   - multi-recipient events only notify intended recipients

## Outbox Architecture Note

Do not start here. The direct event-service coordinator above is enough while the system only needs immediate in-app rows plus email jobs and does not need shared delivery lifecycle state.

Promote to a notification outbox when another feature needs one or more of:

- delivery status or retry tracking
- unified in-app/email audit history
- delayed delivery or digest delivery
- deduplication across notification sources
- richer per-recipient skip reasons
- a clean boundary between domain notification intent and channel delivery effects

### Heavier Outbox Shape

```text
notification_events
  id
  event_type
  source_type
  source_id
  actor_id
  title
  subtitle
  href
  payload
  created_at

notification_event_recipients
  id
  notification_event_id
  recipient_id

notification_deliveries
  id
  notification_event_id
  recipient_id
  channel                  # in_app | email | push | sms | ...
  status                   # pending | sent | failed | skipped
  skipped_reason
  attempt_count
  last_error
  next_attempt_at
  sent_at
  created_at
  updated_at
```

A delivery consumer then:

1. Loads pending notification events.
2. Expands recipients.
3. Applies event preferences, user-level email settings, and channel delivery options.
4. Creates concrete channel effects: in-app rows, mailer jobs, or other channel jobs.
5. Records sent, skipped, failed, retry, and audit state in delivery rows.

### Outbox Verification Checklist

- Creating the domain event writes one durable notification event/intention row.
- Intended recipients are recorded exactly once.
- Preference-disabled channels create skipped deliveries or no deliveries according to the project contract.
- Enabled in-app delivery creates visible in-app notification rows.
- Enabled email delivery enqueues exactly the expected email job per recipient.
- Retryable failures preserve enough state to retry without duplicating successful channel effects.
- Non-retryable skips record a reason visible to maintainers.
- Consumers are idempotent when re-run for the same pending event.
