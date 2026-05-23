# I18n Manual Validation Checklist

- Switch from English to Chinese from the top navigation language switcher.
- Refresh the page and confirm the selected language persists.
- Clear `ai-agent-marketplace-language` from localStorage, set the browser language to Chinese, and confirm the first visit defaults to Chinese.
- Clear `ai-agent-marketplace-language`, set the browser language to a non-Chinese language, and confirm the first visit defaults to English.
- Open `/marketplace` and confirm category labels switch language.
- Open `/agents/website-customer-support-agent` and confirm title, short description, description, features, FAQ, setup instructions, and data permission notes switch language.
- Confirm English prices show USD first, for example `$499 / ¥3,599`.
- Confirm Chinese prices show CNY first, for example `¥3,599 / $499`.
- Confirm `custom_quote` agents show `Custom quote` in English and `定制报价` in Chinese.
- Confirm the language switcher remains visible and usable on a narrow mobile viewport.
