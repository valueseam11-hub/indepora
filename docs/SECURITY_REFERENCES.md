# Security and Railway References

This implementation uses the following primary-source guidance. These are implementation references, not a security certification.

## Session and password handling

- OWASP, [Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html): session IDs should be generated with a CSPRNG and sufficient entropy; use secure cookie attributes; set idle/absolute expiration; invalidate sessions server-side. For database disclosure resistance, store a verifier/hash rather than the raw session token.
- OWASP, [Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html): use Argon2id for new password storage, with the stated baseline of 19 MiB memory, two iterations, and parallelism one; tune based on the deployed runtime.
- OWASP, [CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html): use a server-validated anti-CSRF defense for state-changing cookie-authenticated requests; SameSite cookies are defense in depth, and origin checks/custom headers can strengthen API protection.

## Railway PostgreSQL connection

- Railway, [PostgreSQL service](https://docs.railway.com/databases/postgresql): PostgreSQL services expose `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, and `DATABASE_URL`; connect from another service using references rather than public TCP exposure.
- Railway, [Using Variables](https://docs.railway.com/variables): cross-service reference syntax is `${{SERVICE_NAME.VAR}}`; a database URL can therefore be referenced as `${{Postgres.DATABASE_URL}}`. Railway notes that variable changes are staged and must be deployed.

## Product-specific security boundaries

- The app uses one owner account and no public sign-up. The first owner is bootstrapped once with a deployment secret; the bootstrap path is disabled after creation.
- Analysis routes are authenticated and non-persistent. Only the explicit Save action writes a full input/report snapshot to Postgres.
- Veiled/unknown lineage remains `UNKNOWN`; it is not converted to dependence. The supplied Charter can affect only the operational Standing/decision.
- Access logs contain route template, request ID, status, and timing; they do not include request bodies, claim/evidence text, query values, passwords, or session tokens.
