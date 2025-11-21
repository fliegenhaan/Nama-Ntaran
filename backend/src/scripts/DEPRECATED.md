# ⚠️ DEPRECATED SCRIPTS

**Status**: These scripts are DEPRECATED and should NOT be used.

**Last Updated**: November 21, 2025

---

## 🚫 Deprecated Files

All scripts in this directory (`backend/src/scripts/`) are **deprecated** and have been replaced with modern Supabase-based alternatives.

### Legacy Scripts (DO NOT USE):

1. **`migrate.ts`** ❌
   - **Problem**: Uses legacy PostgreSQL pool
   - **Replacement**: Use `database/migrations/` and `database/run-migration.ts`
   - **Why deprecated**: Direct pool access is not recommended

2. **`seed.ts`** ❌
   - **Problem**: Uses legacy PostgreSQL pool
   - **Replacement**: Use `database/seeders/` (40 seeders available)
   - **Why deprecated**: New seeders use Supabase client with better error handling

3. **`importSchools.ts`** ❌
   - **Problem**: Uses legacy PostgreSQL pool, manual CSV parsing
   - **Replacement**: Use `database/seeders/02-seed-schools.ts`
   - **Why deprecated**: New seeder has better validation and batch processing

---

## ✅ Modern Alternatives

### For Migrations:

```bash
# Run all migrations
cd database
npm run migrate

# Or directly
npx ts-node database/run-migration.ts
```

### For Seeding:

```bash
# Run all seeders (01-40)
cd database/seeders
npm run seed

# Run specific seeder
npx ts-node database/seeders/02-seed-schools.ts
```

### Available Seeders:

**Core Data (01-24)**:
- `01-seed-users.ts` - Admin, government, schools, caterings
- `02-seed-schools.ts` - All schools with geocoding
- `03-seed-caterings.ts` - Catering vendors
- `04-seed-deliveries.ts` - Delivery records
- ... (20 more core seeders)

**Nice-to-Have (25-40)**:
- `25-seed-historical-deliveries.ts` - Historical data
- `26-seed-regional-statistics.ts` - Regional stats
- ... (15 more optional seeders)

**See**: `doc/SEEDING_DATA_SPECIFICATION.txt` for complete list

---

## 🗑️ Migration Guide

If you have code that imports from these scripts:

### Before (DEPRECATED):
```typescript
import { pool } from '../config/database.js';
await pool.query('SELECT * FROM schools');
```

### After (CORRECT):
```typescript
import { supabase } from '../config/database.js';
const { data, error } = await supabase.from('schools').select('*');
```

### Transaction Example:

**Before (DEPRECATED)**:
```typescript
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query('INSERT INTO ...');
  await client.query('COMMIT');
} finally {
  client.release();
}
```

**After (CORRECT)**:
```typescript
// Supabase handles transactions internally
const { data, error } = await supabase
  .from('table')
  .insert([{ ... }]);
```

---

## 📋 Checklist for Removal

These scripts will be removed in the next major version. Before removal:

- [x] Create modern Supabase-based alternatives (database/seeders/)
- [x] Document replacement paths
- [x] Remove pool export from database.ts
- [x] Add deprecation warnings
- [ ] Verify no production code uses these scripts
- [ ] Delete deprecated files

---

## 🔗 References

- **Seeding Documentation**: `doc/SEEDING_DATA_SPECIFICATION.txt`
- **Migration Guide**: `database/migrations/README.md`
- **Database Config**: `backend/src/config/database.ts`

---

**Note**: If you need to run these scripts for any reason, they will need to be updated to use their own Pool instances, as the shared pool has been removed from `database.ts`.
