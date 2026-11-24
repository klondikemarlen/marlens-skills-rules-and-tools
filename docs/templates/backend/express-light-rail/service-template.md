# Service Template

Use for reusable domain work, multi-step mutations, or transaction boundaries.

Follow [Create-Service Input Boundaries](../../../references/code-organization-reference.md#create-service-input-boundaries) for positional parent context, model-backed payloads, and guard and derivation ownership.

For required transactions, follow [Database Transaction Entry Point](../../../references/express-light-rail-backend-concepts-reference.md#database-transaction-entry-point): use the project's established database owner (`import db from "@/models"` and `db.transaction(...)` where supported), not a scoped model's `.sequelize`. This includes required read-only snapshots; preserve options, callback awaiting, scoped queries, and propagation. Do not add transactions or redirect an integration's work to an unrelated database.

When controller helpers already resolve request sorting, consume their supplied order unchanged under [Controller-Owned Request Ordering](../../../references/express-light-rail-backend-concepts-reference.md#controller-owned-request-ordering). Domain operations that independently own ordering retain it.

The list example assumes owner-only visibility, ID ordering, and no other filters. In the paired controller, use the project's existing pagination resolver with its normal validation, defaults, and caps. Preserve the actual application's policy scope, ordering, and filters.

## Template

```ts
import { Project } from "./models"

type CreateProjectAttributes = {
  name: string
}

export async function listProjectsForUser(userId: string, limit: number, offset: number) {
  return Project.findAll({
    where: { ownerId: userId },
    order: [["id", "ASC"]],
    limit,
    offset,
  })
}

export async function findProjectForUser(userId: string, projectId: string) {
  // Scope by user or policy before returning sensitive data.
}

export async function createProjectForUser(userId: string, attributes: CreateProjectAttributes) {
  if (!attributes.name) {
    // Replace with the project’s standard validation error.
    throw new Error("Name is required")
  }

  // Use the project’s transaction helper when multiple writes must succeed together.
}
```

## Scoped Creation in a Transaction

An invoice and its fee line must be created atomically. This example assumes the caller has already authorized invoice creation for the account and supplies create-policy-filtered attributes. Events and fees are visible within that authorized account; their booking links are immutable in this example. Use the actual application's authorization scope and any required transaction isolation or locks.

```ts
import type { CreationAttributes } from "sequelize"
import { isNil } from "lodash"

import { ValidationError } from "@/errors"
import db, { Event, Fee, Invoice, InvoiceFee } from "@/models"

type CreateInvoiceAttributes = Partial<
  Pick<CreationAttributes<Invoice>, "eventId" | "currency" | "notes"> & {
    feeId: number
  }
>

class CreateInvoiceService {
  constructor(
    private readonly accountId: number,
    private readonly attributes: CreateInvoiceAttributes
  ) {}

  async perform() {
    const { eventId, currency, feeId, ...optionalAttributes } = this.attributes

    if (isNil(eventId)) {
      throw new ValidationError("Event is required")
    }
    if (isNil(currency)) {
      throw new ValidationError("Currency is required")
    }
    if (isNil(feeId)) {
      throw new ValidationError("Fee is required")
    }

    return db.transaction(async (transaction) => {
      const event = await Event.findOne({
        where: {
          id: eventId,
          accountId: this.accountId,
        },
        transaction,
      })
      if (isNil(event)) {
        throw new ValidationError("Event is not available for this account")
      }

      const { bookingId } = event
      const fee = await Fee.findOne({
        where: {
          id: feeId,
          accountId: this.accountId,
          bookingId,
        },
        transaction,
      })
      if (isNil(fee)) {
        throw new ValidationError("Fee is not available for this booking")
      }

      const invoice = await Invoice.create(
        {
          ...optionalAttributes,
          accountId: this.accountId,
          eventId,
          bookingId,
          currency,
        },
        {
          transaction,
        }
      )
      await InvoiceFee.create(
        {
          invoiceId: invoice.id,
          feeId: fee.id,
        },
        {
          transaction,
        }
      )

      return invoice
    })
  }
}
```

At the authorized call site, pass the required account ID before the invoice inputs; `eventId` and `feeId` are child selections, not replacements for the parent context:

```ts
const invoice = await new CreateInvoiceService(accountId, permittedAttributes).perform()
```

In the target project, use the existing service entrypoint and errors. Replace explicit transaction options only where the installed ORM and project configuration guarantee propagation. Keep independently meaningful validators; move only input-only guards that can reject before the transaction without changing the operation's error contract.

To exercise this example, omit a required input and confirm the service rejects without opening a transaction. With complete input, confirm the invoice uses the selected event's booking and its fee line uses the selected fee. Select a fee from a different booking or an event outside the authorized account and confirm rejection with neither write persisted. Fail the line write and confirm the invoice rolls back.

## Checklist

- [ ] Accepts primitive ids and validated attributes, not Express request/response objects.
- [ ] Owns business rules, not HTTP status codes.
- [ ] Puts required positional parent context before child inputs without changing its representation or the authorization boundary.
- [ ] Uses one outer `Partial` when model and service-only inputs share a partial contract, without changing required caller inputs or policy permissions.
- [ ] Derives dependent facts from the scoped record and validates independent selections against those facts.
- [ ] Keeps straightforward service-owned input guards before the transaction and state-dependent checks inside their required transaction.
- [ ] Uses the established database entry point for required multi-write or snapshot transactions, preserving scoped queries and transaction semantics.
- [ ] Returns the shape the serializer expects.
