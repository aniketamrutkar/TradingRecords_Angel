# 🔒 Security Guidelines

## ⚠️ CRITICAL: Files to NEVER Commit

### 🚨 **data/config.json** - NEVER COMMIT!
This file contains:
- TOTP secrets (equivalent to your 2FA device)
- Account passwords
- Private API keys

**If exposed publicly, attackers can:**
- Generate TOTP codes for your accounts
- Login to your Angel Broking accounts
- Access your trading data
- Potentially execute trades

### 🚨 **logs/** directory - NEVER COMMIT!
Log files may contain:
- Generated TOTP codes
- API responses with sensitive data
- Error messages with account information

## ✅ Safe Files to Commit

### ✅ Template Files
- `data/config.template.json` - Template with placeholder values
- All JavaScript files (no secrets embedded)
- Documentation files
- Shell scripts (no hardcoded credentials)

### ✅ Generated Data (Optional)
- `data/response-*.json` - API responses (check for sensitive data first)
- `bkp/` folder - Generated reports (usually safe)

## 🛡️ Security Best Practices

### 1. Use .gitignore
```bash
# Already configured in .gitignore
data/config.json
logs/
*.log
```

### 2. Check Before Committing
```bash
# Always check what you're committing
git status
git diff --cached

# Never add config.json
git add . --dry-run
```

### 3. If You Accidentally Commit Secrets

**🚨 IMMEDIATE ACTION REQUIRED:**

```bash
# Remove from git history (if just committed)
git reset --soft HEAD~1
git reset HEAD data/config.json

# If already pushed - CHANGE ALL CREDENTIALS:
# 1. Change Angel Broking passwords
# 2. Reset 2FA (get new TOTP secrets)  
# 3. Regenerate API keys if possible
```

### 4. Environment Variables Alternative

For extra security, consider using environment variables:

```bash
# Create .env file (also add to .gitignore)
JPW_CLIENT_CODE=J77302
JPW_PASSWORD=your_password
JPW_TOTP_SECRET=your_secret
# ... etc
```

### 5. Private Repository Option

If you need to store config:
- Use a **private repository** (not public)
- Still use .gitignore for extra protection
- Enable GitHub's secret scanning alerts

## 🔍 Regular Security Checks

### Monthly Review
- [ ] Check .gitignore is working
- [ ] Verify no secrets in commit history
- [ ] Rotate TOTP secrets if needed
- [ ] Update passwords

### Before Each Commit
- [ ] Run `git status` to check staged files
- [ ] Ensure `data/config.json` is not staged
- [ ] Review diff for any hardcoded secrets

## 📞 If Security is Compromised

1. **Immediately change** all Angel Broking passwords
2. **Reset 2FA** and get new TOTP secrets
3. **Run** `npm run setup` to update config
4. **Monitor** your accounts for unauthorized access
5. **Consider** creating new API keys if available

---

**Remember: Security is not optional when dealing with financial data!** 🛡️
