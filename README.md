# Recipes

## Deployment

### RDS

Until a better migration story is written:

```
psql -f database/schema.sql -h <url> -p 5432 -U <username>
```

The URL, username and password are stored in AWS ECS.
