# Express Sequelize CRUD Resource Rail Template

Use this when a downstream API already follows an Express controller, Sequelize model, policy, service, and serializer rail. Copy only the sections the target project actually needs.

## Placeholders

- `{ResourceName}`: PascalCase singular model, e.g. `FundingRegion`.
- `{ResourceNames}`: PascalCase plural controller/policy namespace.
- `{resourceName}` / `{resourceNames}`: camelCase response keys.
- `{resource-name}` / `{resource-names}`: kebab-case file and route segments.
- `{ResourceNamePolicy}`: policy class.
- `{IndexSerializer}` / `{ShowSerializer}` / `{ReferenceSerializer}`: response serializers.
- `{CreateService}` / `{UpdateService}` / `{DestroyService}`: mutation services.
- `{EnsureService}`: optional owning-domain lookup-or-create service for reuse-intended lifecycles.
- `{searchField}`: searchable model field.
- `{lookupField}`: reuse-identity field for the optional ensure slice, distinct from search where needed.
- `{requiredAssociation}`: association to reload for show/edit responses, if any.

## Model Slice

```ts
export class {ResourceName} extends BaseModel<
  InferAttributes<{ResourceName}>,
  InferCreationAttributes<{ResourceName}>
> {
  @Attribute(DataTypes.INTEGER)
  @PrimaryKey
  @AutoIncrement
  declare id: CreationOptional<number>

  @Attribute(DataTypes.STRING(200))
  @NotNull
  declare {searchField}: string

  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>
  declare deletedAt: CreationOptional<Date | null>

  static establishScopes() {
    this.addSearchScope(["{searchField}"])
  }
}
```

## Controller Slice

```ts
export class {ResourceNames}Controller extends BaseController<{ResourceName}> {
  async index() {
    const where = this.buildWhere()
    const scopes = this.buildFilterScopes()
    const order = this.buildOrder([["{searchField}", "ASC"]])
    const scopedResources = {ResourceNamePolicy}.applyScope(scopes, this.currentUser)
    const totalCount = await scopedResources.count({ where })
    const resources = await scopedResources.findAll({
      where,
      order,
      limit: this.pagination.limit,
      offset: this.pagination.offset,
    })

    return this.response.json({
      {resourceNames}: {IndexSerializer}.perform(resources),
      totalCount,
    })
  }

  async show() {
    const resource = await this.load{ResourceName}()
    if (!resource) return this.response.status(404).json({ message: "Not found" })

    const policy = this.buildPolicy(resource)
    if (!policy.show()) return this.response.status(403).json({ message: "Not authorized" })

    return this.response.json({ {resourceName}: {ShowSerializer}.perform(resource), policy })
  }

  async create() {
    const policy = this.buildPolicy()
    if (!policy.create()) return this.response.status(403).json({ message: "Not authorized" })

    const resource = await {CreateService}.perform(policy.permitAttributesForCreate(this.request.body), this.currentUser)
    return this.response.status(201).json({ {resourceName}: {ShowSerializer}.perform(resource), policy })
  }

  async update() {
    const resource = await this.load{ResourceName}()
    if (!resource) return this.response.status(404).json({ message: "Not found" })

    const policy = this.buildPolicy(resource)
    if (!policy.update()) return this.response.status(403).json({ message: "Not authorized" })

    const updated = await {UpdateService}.perform(resource, policy.permitAttributes(this.request.body), this.currentUser)
    return this.response.json({ {resourceName}: {ShowSerializer}.perform(updated), policy })
  }

  async destroy() {
    const resource = await this.load{ResourceName}()
    if (!resource) return this.response.status(404).json({ message: "Not found" })

    const policy = this.buildPolicy(resource)
    if (!policy.destroy()) return this.response.status(403).json({ message: "Not authorized" })

    await {DestroyService}.perform(resource, this.currentUser)
    return this.response.status(204).send()
  }
}
```

## Policy Slice

```ts
export class {ResourceNamePolicy} extends PolicyFactory({ResourceName}) {
  static applyScope(scopes: unknown[], currentUser: User) {
    if (!currentUser.isSystemAdmin) return this.NO_RECORDS_SCOPE
    return {ResourceName}.scope(scopes)
  }

  create() { return this.currentUser.isSystemAdmin }
  show() { return this.currentUser.isSystemAdmin }
  update() { return this.currentUser.isSystemAdmin }
  destroy() { return this.currentUser.isSystemAdmin }

  permitAttributes(attributes: Record<string, unknown>) {
    return pick(attributes, ["{searchField}"])
  }

  permitAttributesForCreate(attributes: Record<string, unknown>) {
    return this.permitAttributes(attributes)
  }
}
```

## Service Slice

```ts
export class {CreateService} extends BaseService {
  constructor(private attributes: Partial<CreationAttributes<{ResourceName}>>) { super() }

  async perform(): Promise<{ResourceName}> {
    const { {searchField}, ...optionalAttributes } = this.attributes
    if ({searchField} === undefined || {searchField} === null) {
      // Use the project's standard validation error.
      throw new Error("{searchField} is required")
    }

    return db.transaction(async () => {
      const resource = await {ResourceName}.create({ ...optionalAttributes, {searchField} })
      return resource.reload({ include: ["{requiredAssociation}"] })
    })
  }
}
```

Use matching update and destroy services when the mutation has transaction, audit, validation, association reload, or side-effect behavior. Direct model calls are enough for trivial project-local paths.

For the partial creation-payload pattern, guard required field presence in `perform()` before persistence, then pass the narrowed required fields alongside supported policy-filtered optional attributes. The model slice requires `{searchField}`; adapt the guards to the target model's actual required fields. Presence checks do not replace model-owned blank-text handling, normalization, format validation, or database constraints. An ensure service using this contract also accepts a partial payload and guards its lookup identity before querying; missing-record creation still goes through the create service's required-field checks.

For Sequelize 7, the managed transaction above relies on the project's automatic transaction propagation and nested reuse settings. Inspect the installed version, `disableClsTransactions`, `defaultTransactionNestMode`, and neighboring services before adopting it; see [Sequelize's managed transaction documentation](https://sequelize.org/docs/v7/querying/transactions/). With those guarantees, called services and queries join the active context without transaction parameters in constructors or helpers. Keep a multi-write service's transaction in `perform()` so it remains atomic standalone and its writes roll back if an outer transaction fails. Retain explicit transaction plumbing when propagation or reuse is unavailable; do not add transaction wrappers to ordinary lookups solely for this pattern.

When the lifecycle intentionally reuses an existing record, use an owning-domain ensure service rather than ORM `findOrCreate`. Keep the lookup explicit and delegate creation to the domain's create service:

```ts
export class {EnsureService} extends BaseService {
  constructor(private attributes: Partial<CreationAttributes<{ResourceName}>>) { super() }

  async perform(): Promise<{ResourceName}> {
    const { {lookupField} } = this.attributes
    if ({lookupField} === undefined || {lookupField} === null) {
      // Use the project's standard validation error.
      throw new Error("{lookupField} is required")
    }

    const resource = await {ResourceName}.findOne({
      where: { {lookupField} },
    })
    if (resource) return resource

    return {CreateService}.perform(this.attributes)
  }
}
```

Use the domain's real reuse identity, including compound predicates where required, and preserve its uniqueness and concurrency contract; lookup-then-create alone does not guarantee concurrent calls converge. Required-new lifecycles continue to use strict creation, not ensure or repair. See [Service Orchestration Readability](../../../references/code-organization-reference.md#service-orchestration-readability) for ownership.

## Serializer Slice

```ts
export type {ResourceName}AsIndex = Pick<{ResourceName}, "id" | "{searchField}">
export type {ResourceName}AsShow = {ResourceName}AsIndex & Pick<{ResourceName}, "createdAt" | "updatedAt">
export type {ResourceName}AsReference = Pick<{ResourceName}, "id" | "{searchField}">
```

## Verification Checklist

- [ ] Index applies policy scope, filters, sort, pagination, and returns `totalCount`.
- [ ] Show/create/update return serialized data and policy; missing records return `404`; forbidden actions return `403`.
- [ ] Mutations use services when they need transactions, reloads, audit, or side effects.
- [ ] Reuse-intended ensure returns an existing record or delegates creation; required-new creation remains strict.
- [ ] Where managed transaction context is used, project configuration supports propagation and nested reuse; multi-write failures roll back both standalone and inside an outer transaction.
- [ ] Serializers expose only fields used by list/detail/reference clients.
- [ ] Tests cover allowed, forbidden, missing, invalid, and successful mutation paths.
