# 🔧 TOTP Login Troubleshooting Guide

## Current Issue
The automated system is generating TOTP codes but Angel Broking login is failing with "Invalid totp".

## Current Generated Codes
- **Mummy Account**: 503203
- **Papa Account**: 629652

## 🔍 Step-by-Step Troubleshooting

### Step 1: Verify TOTP Codes Match Your Authenticator App

**Check your authenticator app RIGHT NOW:**
1. Open Google Authenticator / Authy / Microsoft Authenticator
2. Find the Angel Broking entries for both accounts
3. Compare the 6-digit codes with our generated codes above

**If codes DON'T match:**
- The TOTP secrets in `config.json` are incorrect
- You need to get the correct base32 secrets from Angel Broking
- Run `node setup-totp.js` to reconfigure

**If codes DO match:**
- The TOTP generation is correct
- The issue might be with API parameters or timing
- Continue to Step 2

### Step 2: Test Manual Login

Run the manual login test:
```bash
node manual-login-test.js
```

This will:
- Let you enter codes from your authenticator app
- Show detailed API request/response information
- Help identify if the issue is TOTP or API-related

### Step 3: Check TOTP Secret Format

The secrets should be in base32 format, like:
```
CZNAVEKWXYEAXOZISJI7IMBF7E
KHSU3FP4ESPGGX7JCJ6SYTUDZU
```

**Common Issues:**
- Spaces in the secret (remove them)
- Wrong case (should be uppercase)
- Missing characters (secrets are usually 16-32 characters)
- Wrong encoding (must be base32, not base64 or hex)

### Step 4: Verify Angel Broking Account Details

Check in `config.json`:
```json
{
  "mummy": {
    "clientcode": "J77302",
    "password": "3816",
    "privateKey": "TUOTya6a"
  },
  "papa": {
    "clientcode": "W1573",
    "password": "3816", 
    "privateKey": "VqJ4o4G6"
  }
}
```

**Verify:**
- Client codes are correct
- Passwords are correct
- Private keys match your Postman collection

### Step 5: Test Different TOTP Configurations

Angel Broking might use different TOTP settings. Test with:

```bash
node debug-totp.js
```

This tests:
- SHA1 vs SHA256 algorithms
- 6 vs 8 digit codes
- Different time windows

### Step 6: Check API Access

The error might not be TOTP-related. Common issues:
- **Rate limiting**: Too many failed attempts
- **IP blocking**: Angel Broking blocking your IP
- **API changes**: Endpoints or headers changed
- **Account status**: Accounts might be locked/disabled

## 🚨 Common Solutions

### Solution 1: Get Fresh TOTP Secrets

1. Log into Angel Broking web portal
2. Go to Settings → Security → Two-Factor Authentication
3. Disable 2FA temporarily
4. Re-enable 2FA
5. When setting up, look for "Manual Entry" or "Can't scan QR?"
6. Copy the base32 secret key
7. Update `config.json` with new secrets

### Solution 2: Test with Postman First

1. Open your Angel.postman_collection.json
2. Update TOTP values manually with codes from your app
3. Test login in Postman
4. If Postman works, the issue is in our automation
5. If Postman fails, the issue is with account/API access

### Solution 3: Check Account Status

1. Try logging into Angel Broking web portal manually
2. Verify both accounts are active and not locked
3. Check if 2FA is properly enabled
4. Ensure no recent security changes

## 🧪 Quick Tests

### Test Current TOTP Generation
```bash
node test-ist-totp.js
```

### Test Manual Login
```bash
node manual-login-test.js
```

### Test Different TOTP Configs
```bash
node debug-totp.js
```

### Test with Original Fetch Script
```bash
# Get codes from your app, then run:
node fetch-trade-data.js [mummy_code] [papa_code]
```

## 📞 Next Steps

1. **First**: Compare TOTP codes with your authenticator app
2. **If they match**: Run `node manual-login-test.js`
3. **If they don't match**: Run `node setup-totp.js` to reconfigure
4. **If manual test fails**: Check account status and API access
5. **If manual test works**: The automation logic needs adjustment

## 🔒 Security Notes

- Never share your TOTP secrets
- Keep `config.json` secure and private
- The secrets are equivalent to your physical authenticator device
- If compromised, immediately disable and reset 2FA in Angel Broking

---

**Current Status**: Investigating TOTP validation failure
**Next Action**: Compare generated codes with authenticator app
