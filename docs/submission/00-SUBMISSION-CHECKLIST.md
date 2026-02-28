# ScanProof — Hackathon Submission Checklist

Use this as the final gate before clicking submit.

## 1) Required Deliverables

- [ ] Functional Android APK is built and installable
- [ ] Public GitHub repository URL is final
- [ ] Demo video URL is uploaded and accessible
- [ ] Pitch deck URL (or PDF) is uploaded and accessible

## 2) APK Validation

- [ ] `app-debug.apk` installs on clean Android device/emulator
- [ ] `app-release.apk` installs on clean Android device/emulator
- [ ] App launch succeeds without crash
- [ ] Wallet connect flow works end-to-end
- [ ] Core proof flows work end-to-end

### APK Paths

- Debug: `android/app/build/outputs/apk/debug/app-debug.apk`
- Release: `android/app/build/outputs/apk/release/app-release.apk`

## 3) Core Demo Path (must pass)

- [ ] Connect wallet via MWA
- [ ] Create proof
- [ ] Scan/verify proof
- [ ] Run notarize checker flow
- [ ] Run quest claim flow
- [ ] Verify ticket/pass validity (signature + expiration)

## 4) Repo Quality

- [ ] README is up-to-date and accurate
- [ ] Screenshots render correctly in README
- [ ] No secrets committed in git history
- [ ] Setup instructions run on a clean machine
- [ ] Test/typecheck commands complete

## 5) Release Safety

- [ ] Release signing config verified (not debug signing)
- [ ] App version name/code are set intentionally
- [ ] Basic crash smoke test done on target Android version(s)

## 6) Submission Form Copy/Paste

- [ ] Project name entered: `ScanProof`
- [ ] One-line pitch entered
- [ ] Problem statement entered
- [ ] Why now / why Seeker entered
- [ ] Tech summary entered
- [ ] Links verified one last time

## Final Sign-Off

- [ ] All blocking items complete
- [ ] Team confirms final submission
- [ ] Timestamp of final review: `____________________`
