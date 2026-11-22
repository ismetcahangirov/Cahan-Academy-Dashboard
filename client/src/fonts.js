// Self-hosted fonts (@fontsource, bundled by Vite, font-display: swap).
// Coverage of Azerbaijani (əƏğĞıİşŞçÇöÖüÜ) and Cyrillic is proven by scripts/font-coverage.py;
// keep its FONTS list in sync with these imports.
import '@fontsource/eb-garamond/400.css';
import '@fontsource/eb-garamond/400-italic.css';
import '@fontsource/eb-garamond/500.css';
import '@fontsource/eb-garamond/600.css';
import '@fontsource/eb-garamond/700.css';
import '@fontsource/cormorant-sc/500.css';
import '@fontsource/cormorant-sc/600.css';
import '@fontsource/cormorant-sc/700.css';
// Cahan Display: the academy's own title face (woff2 in public/fonts/cahan-display, coverage proven
// by docs/brand/font/cahan-display build; all Azerbaijani + Cyrillic + ₼ №).
import './styles/cahan-display.css';
