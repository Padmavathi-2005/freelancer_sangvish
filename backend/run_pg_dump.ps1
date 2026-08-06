$env:PGPASSWORD="sangvish"
& "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" -U postgres -h localhost -p 5432 -d freelancer_db -F p -f freelancer_database.sql
Write-Host "✅ Official PostgreSQL 18 Dump Created Successfully!"
