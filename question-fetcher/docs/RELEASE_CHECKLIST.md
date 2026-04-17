# Release Checklist

## Pre-Release
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] High-risk flows smoke tested
- [ ] Firestore rules/index updates validated
- [ ] Payment webhook path verified
- [ ] Env vars documented and present

## Security
- [ ] No secrets committed
- [ ] Admin endpoints protected
- [ ] Input validation present on changed routes

## Operations
- [ ] Monitoring/alerts checked
- [ ] Budget limits reviewed
- [ ] Rollback plan written

## Post-Release
- [ ] Error logs checked after deploy
- [ ] Payment and auth events sanity-checked
- [ ] Cost impact logged in `docs/COST_TRACKING.md`
