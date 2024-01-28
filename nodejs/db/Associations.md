# Associations

The concepts here are simplified versions of [Sequelize Assocations](https://sequelize.org/docs/v6/core-concepts/assocs/) with some additional info for our GraphQL generator framework

### belongsTo, hasOne, hasMany

A belongsTo B

- A holds the foreign key
- B can hasOne or hasMany A, depends on our need

Example 1-1 relationship: Info belongsTo User, User hasOne Info

```js
const associationInfoBelongsToUser = {
  to: 'User',
  // foreign key in THIS table Info
  foreignKey: 'userId',
  // info must belong to a user
  allowNull: false,
  // by default the framework will create association field
  //   and filters in graphql typedef `Info.user: User!`
  as: 'user',
}
const associationUserHasOneInfo = {
  to: 'User',
  // foreign key in the table Info
  foreignKey: 'userId',
  // user may or may not have info
  // for eg: user register an account first
  //   then fill in their information later
  // this usually happens when we want to separate
  //   the authentication and information parts
  allowNull: true,
  // by default the framework will create association field
  //   and filters in graphql typedef `User.info: Info`
  as: 'info',
}
```

Example 1-N relationship: User belongsTo Org, Org hasMany User

```js
const associationUserBelongsToOrg = {
  to: 'Org',
  // foreign key in THIS table User
  foreignKey: 'orgId',
  // user can optionally belong to an org
  // for eg: user register an account first
  //   then accept the invitation to join the org later
  // in a real SaaS product, they usually choose to have
  //   belongsToMany N-N for this case instead
  allowNull: true,
  // by default the framework will create association field
  //   and filters in graphql typedef `User.org: Org`
  as: 'org',
}
const associationOrgHasManyUser = {
  to: 'User',
  // foreign key in the table User
  foreignKey: 'orgId',
  // expose some filters in typedef, no field `Org.users`
  // we dont support nested array in resolver
  // see the section below to have a workaround
  as: 'users',
}
```

### belongsToMany

A belongsToMany B

- Also means B belongsToMany A
- Through a junction table
- The junction table can hold other information if needed

Example N-N relationship: User belongsToMany Org

```js
const associationUserBelongsToManyOrg = {
  to: 'Org',
  through: 'UserInOrg',
  // foreign key points to THIS table User
  foreignKey: 'userId',
  // foreign key points to the table Org
  otherKey: 'orgId',
  // by default the framework will create association field
  //   and filters in graphql typedef `User.orgs`
  as: 'orgs',
}
const associationOrgBelongsToManyUser = {
  to: 'User',
  through: 'UserInOrg',
  // foreign key points to THIS table Org
  foreignKey: 'orgId',
  // foreign key points to the table User
  otherKey: 'userId',
  // by default the framework will create association field
  //   and filters in graphql typedef `Org.users`
  as: 'users',
}
```
