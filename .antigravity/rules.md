# Layihə Qaydaları

## PR və Test Qaydası
Hər mərhələni tamamladıqdan sonra, PR açmadan əvvəl mütləq aşağıdakı testləri icra et:

1. **Backend Testləri:**
   ```bash
   cd server && npm run test
   ```
2. **Frontend Testləri:**
   ```bash
   cd client && npm run test
   ```

### Şərtlər:
- ✅ Testlər keçirsə → PR aç.
- ❌ Testlər keçməzsə → Əvvəlcə xətaları düzəlt, sonra yenidən test et.
- ⚠️ Bu qayda istisnasız hər mərhələyə aiddir.
