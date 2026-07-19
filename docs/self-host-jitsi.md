# Self-host Jitsi — Quraşdırma Rehbəri

> **Məqsəd:** meet.jit.si embed 5-dəqiqə limitini aradan qaldırmaq üçün öz Jitsi serverini qurmaq.
> **Nəticə:** $0 (Oracle Cloud "Always Free" VM), **limitsiz**, müəllim/admin **JWT ilə həmişə moderator**.
>
> Tətbiq kodu artıq buna hazırdır — yalnız 3 env dəyişəni təyin olunur (`JITSI_DOMAIN`, `JITSI_JWT_APP_ID`, `JITSI_JWT_SECRET`). Kod dəyişikliyi lazım deyil.

---

## Tələblər

1. **Oracle Cloud hesabı** (pulsuz) — https://cloud.oracle.com — "Always Free" VM verir.
   - Tövsiyə: **Ampere A1** (ARM), 1–2 OCPU, 6 GB RAM — pulsuz, Jitsi üçün kifayət.
   - Alternativ: istənilən Ubuntu 22.04 VPS (~$5/ay Hetzner/DigitalOcean).
2. **Domen/subdomen** — məs. `meet.cahanacademy.az` (DNS-i idarə edə bildiyiniz).
3. VM üçün SSH açarı.

---

## Addım 1 — VM yarat (Oracle Always Free)

1. Oracle Cloud → **Compute → Instances → Create Instance**.
2. Image: **Canonical Ubuntu 22.04**.
3. Shape: **Ampere (VM.Standard.A1.Flex)**, 2 OCPU / 6 GB (Always Free hüdudunda).
4. SSH açarınızı əlavə edin.
5. Yaradın, **Public IP**-ni qeyd edin.

---

## Addım 2 — Portları aç

**Oracle tərəfində** (VCN → Security List → Ingress Rules) bu portları açın (Source `0.0.0.0/0`):

| Port | Protokol | Təyinat |
|---|---|---|
| 22 | TCP | SSH |
| 80 | TCP | HTTP (Let's Encrypt) |
| 443 | TCP | HTTPS (Jitsi UI + signaling) |
| 10000 | UDP | Media (JVB — video/səs) |

**VM daxilində** (SSH ilə girdikdən sonra) Ubuntu firewall:
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 10000/udp
sudo ufw --force enable
```
> ⚠️ Oracle Ubuntu image-lərində `iptables` da ola bilər — lazım olsa `sudo netfilter-persistent` ilə eyni portları açın.

---

## Addım 3 — DNS

DNS provayderinizdə subdomen üçün **A record** yaradın:
```
meet.cahanacademy.az  →  <VM Public IP>
```
Yayılmanı gözləyin (`ping meet.cahanacademy.az` IP-ni göstərməlidir).

---

## Addım 4 — Jitsi Meet quraşdır

SSH ilə VM-ə girin, sonra:

```bash
# Hostname
sudo hostnamectl set-hostname meet.cahanacademy.az
echo "127.0.0.1 meet.cahanacademy.az" | sudo tee -a /etc/hosts

# Prerequisites
sudo apt update
sudo apt install -y gnupg2 nginx-full apt-transport-https curl

# Jitsi repository
curl -sL https://download.jitsi.org/jitsi-key.gpg.key | sudo sh -c 'gpg --dearmor > /usr/share/keyrings/jitsi-keyring.gpg'
echo 'deb [signed-by=/usr/share/keyrings/jitsi-keyring.gpg] https://download.jitsi.org stable/' | sudo tee /etc/apt/sources.list.d/jitsi-stable.list
sudo apt update

# Jitsi Meet — quraşdırma zamanı domen soruşacaq:
#   "meet.cahanacademy.az" yazın
#   SSL üçün "Let's Encrypt certificate" seçin
sudo apt install -y jitsi-meet
```

SSL avtomatik quraşdırılmasa:
```bash
sudo /usr/share/jitsi-meet/scripts/install-letsencrypt-cert.sh
```

İndi `https://meet.cahanacademy.az` açılmalı və test otağı işləməlidir.

---

## Addım 5 — JWT autentifikasiyanı aktivləşdir (moderator nəzarəti)

Bu addım müəllimin **həmişə moderator**, tələbənin isə iştirakçı olmasını təmin edir.

```bash
sudo apt install -y jitsi-meet-tokens
```

Sonra prosody konfiqini redaktə edin:
```bash
sudo nano /etc/prosody/conf.avail/meet.cahanacademy.az.cfg.lua
```

`VirtualHost "meet.cahanacademy.az"` bloğunda təsdiqləyin/əlavə edin:
```lua
VirtualHost "meet.cahanacademy.az"
    authentication = "token"
    app_id = "cahan_academy"                       -- = JITSI_JWT_APP_ID
    app_secret = "SIZIN_GUCLU_SECRET"              -- = JITSI_JWT_SECRET
    asap_accepted_issuers = { "cahan_academy" }     -- tokendəki iss = app_id
    asap_accepted_audiences = { "cahan_academy" }   -- tokendəki aud = app_id
    allow_empty_token = false                        -- token olmadan girişə icazə YOX
```

> **Vacib:** `app_id`/`app_secret` dəyərləri tətbiqin env-ləri (`JITSI_JWT_APP_ID`/`JITSI_JWT_SECRET`) ilə **eyni** olmalıdır. Bizim backend tokeni məhz `iss = aud = app_id`, `sub = domen` formatında yaradır — yuxarıdakı config buna uyğundur.

Güclü secret yaradın:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Servisləri yenidən başladın:
```bash
sudo systemctl restart prosody jicofo jitsi-videobridge2
```

> **Moderator claim:** Bizim token host üçün `context.user.moderator: true`, tələbə üçün `false` göndərir. Müasir Jitsi bunu tanıyır. Əgər sizin Jitsi versiyanızda moderator hələ də "ilk girən" olaraq təyin olunursa, `/etc/jitsi/meet/meet.cahanacademy.az-config.js`-də `enableUserRolesBasedOnToken: true` təyin edin və Jitsi-ni yenidən başladın. (Quraşdırma zamanı birlikdə dəqiqləşdirə bilərik.)

---

## Addım 6 — Tətbiqin env-lərini təyin et

Backend host-da (Vercel → server layihəsi → Settings → Environment Variables):
```env
JITSI_DOMAIN=meet.cahanacademy.az
JITSI_JWT_APP_ID=cahan_academy
JITSI_JWT_SECRET=SIZIN_GUCLU_SECRET   # prosody app_secret ilə EYNİ
```
Sonra backend-i yenidən deploy edin.

> Frontend-də `MeetingRoom` avtomatik olaraq backend-dən gələn `jitsiDomain` və `token`-i istifadə edir — frontend dəyişikliyi lazım deyil.

---

## Addım 7 — Yoxlama

1. **Müəllim** hesabı ilə online dərsə "Qoşul" → Jitsi otağı `meet.cahanacademy.az`-da açılır → **5 dəqiqə limiti YOXDUR** → müəllim **moderator** (mute/kick düymələri var).
2. **Tələbə** qoşulur → iştirakçı (moderator deyil), müəllimi çıxara bilmir.
3. Token olmayan kənar şəxs otağa **girə bilmir** (`allow_empty_token = false`).

---

## Qeydlər

- **Oracle Always Free** VM daimi pulsuzdur (kredit kartı doğrulama üçün istənilə bilər, amma "Always Free" resurslardan ödəniş alınmır).
- **RAM:** JVB (videobridge) yaddaş tələb edir; 6 GB RAM ~ onlarla eyni vaxtlı iştirakçıya kifayətdir. Çox böyük siniflər üçün shape-i böyüdün.
- **Yeniləmə:** `sudo apt update && sudo apt upgrade` ilə Jitsi-ni müntəzəm yeniləyin.
- **Geri dönüş:** Serveri söndürmək istəsəniz, env-ləri boşaltmaqla (`JITSI_JWT_*` boş, `JITSI_DOMAIN=meet.jit.si`) tətbiq yenidən pulsuz meet.jit.si-yə düşür (5-dəq limiti ilə).

Quraşdırma zamanı istəsəniz **birlikdə interaktiv** edə bilərik: siz SSH ilə girin, əmrləri `! <əmr>` ilə işlədin, çıxışı paylaşın — mən addım-addım yönləndirim və token/moderator hissəsini sizin versiyaya uyğunlaşdıraq.
