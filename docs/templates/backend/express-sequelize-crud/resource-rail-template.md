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
- `{searchField}`: searchable model field.
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
    return db.transaction(async () => {
      const resource = await {ResourceName}.create(this.attributes)
      return resource.reload({ include: ["{requiredAssociation}"] })
    })
  }
}
```

Use matching update and destroy services when the mutation has transaction, audit, validation, association reload, or side-effect behavior. Direct model calls are enough for trivial project-local paths.

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
- [ ] Serializers expose only fields used by list/detail/reference clients.
- [ ] Tests cover allowed, forbidden, missing, invalid, and successful mutation paths.
