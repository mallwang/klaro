# 1.0.0 (2026-06-16)


### Bug Fixes

* **ui:** polish app shell, spending overview, and backend reliability ([#18](https://github.com/mallwang/klaro/issues/18)) ([4e153cb](https://github.com/mallwang/klaro/commit/4e153cb76591bebbbbf60e4ab1c479c04997e8ee))


### Features

* **admin:** overhaul Manage Accounts page layout and UX polish ([#31](https://github.com/mallwang/klaro/issues/31)) ([fa0a685](https://github.com/mallwang/klaro/commit/fa0a685a77009e37de7c100040b0399870a103ce))
* **auth:** add forgot password flow ([#24](https://github.com/mallwang/klaro/issues/24)) ([efff51d](https://github.com/mallwang/klaro/commit/efff51d182c13eae2692d39d0ed544aeb3f72315))
* **auth:** add multi-user accounts with sign-in and per-account data isolation ([#15](https://github.com/mallwang/klaro/issues/15)) ([4343b16](https://github.com/mallwang/klaro/commit/4343b160813135ee89cb84217bf58cb3891344f5))
* **branding,contracts:** rename app to Klaro and add logo/icon display preferences ([#29](https://github.com/mallwang/klaro/issues/29)) ([333919f](https://github.com/mallwang/klaro/commit/333919fca1ea3203c634e116cd25e8a542a9e3c4))
* **contract-form:** replace native date inputs and amount prefix with Mantine components ([#30](https://github.com/mallwang/klaro/issues/30)) ([fb3d5df](https://github.com/mallwang/klaro/commit/fb3d5dfd0d5c27ca0c6629b141440d3820993ffc))
* **contracts:** add category icons and provider logo display ([#10](https://github.com/mallwang/klaro/issues/10)) ([9ef3187](https://github.com/mallwang/klaro/commit/9ef3187825a0e438443ee4bd300f47eb16b46d7d))
* **contracts:** add name anonymization and global toggle ([#7](https://github.com/mallwang/klaro/issues/7)) ([29797e7](https://github.com/mallwang/klaro/commit/29797e7fc84b88af63141dc252a9f71261fe1311))
* **contracts:** add sortable columns to contract table ([#8](https://github.com/mallwang/klaro/issues/8)) ([802a566](https://github.com/mallwang/klaro/commit/802a56611b75ccb65dbd7e7d4a412bc6fe0a1640))
* **contracts:** add startDate, details, serviceUrl, and cancellationPeriod fields ([#5](https://github.com/mallwang/klaro/issues/5)) ([c127110](https://github.com/mallwang/klaro/commit/c127110da31025755ff06b48e2f0162efab05f88))
* **contracts:** overhaul contracts table with compact layout and pagination ([#32](https://github.com/mallwang/klaro/issues/32)) ([746fa54](https://github.com/mallwang/klaro/commit/746fa54f31d0ed5b8f0a5fc524ef7a5716855105))
* **dashboard:** add expired contracts panel with warning styling ([#9](https://github.com/mallwang/klaro/issues/9)) ([817f4c5](https://github.com/mallwang/klaro/commit/817f4c5d45de12aa77d05074aade3572d9bc3ca8))
* **dashboard:** cancellation-aware renewals panel ([#11](https://github.com/mallwang/klaro/issues/11)) ([4572e64](https://github.com/mallwang/klaro/commit/4572e64208f4cad8e28a4fda3e943863eec06465))
* **email-language:** add per-user email language preference ([#27](https://github.com/mallwang/klaro/issues/27)) ([66f19f8](https://github.com/mallwang/klaro/commit/66f19f80546e1a163464060e96711636c21c6d3f))
* **email:** add admin SMTP test and post-action notification emails ([#20](https://github.com/mallwang/klaro/issues/20)) ([093d40b](https://github.com/mallwang/klaro/commit/093d40b146af8a4fa3a23403ef3af5a1630a4dc4))
* **frontend:** add contract export to Excel/JSON and flexible import with column mapping ([#12](https://github.com/mallwang/klaro/issues/12)) ([1d7d8d2](https://github.com/mallwang/klaro/commit/1d7d8d2f00c9c08fcb398efe3e745440262af5a4))
* **frontend:** add English/German language support with instant switching ([#6](https://github.com/mallwang/klaro/issues/6)) ([7c59570](https://github.com/mallwang/klaro/commit/7c595704d3a8eda81e45f3733a73dd5b838a58d7))
* **frontend:** migrate UI from Tailwind + shadcn/ui to Mantine v7 ([#17](https://github.com/mallwang/klaro/issues/17)) ([1e648b1](https://github.com/mallwang/klaro/commit/1e648b1774fc6e2d1506f40a79f763a2e95b2c06))
* implement contract CRUD functionality ([#2](https://github.com/mallwang/klaro/issues/2)) ([1a36b76](https://github.com/mallwang/klaro/commit/1a36b76dabdc34363bb5f9249d7eca0936b6de1c))
* **infra:** add Docker packaging for homeserver hosting ([#14](https://github.com/mallwang/klaro/issues/14)) ([eb53ee4](https://github.com/mallwang/klaro/commit/eb53ee45033acb19e56589f291a17b7d60512ba6))
* **invitations:** add email-based user invitation flow ([#16](https://github.com/mallwang/klaro/issues/16)) ([cae066c](https://github.com/mallwang/klaro/commit/cae066cd174a6de8158b070d81c406b84c55c16a))
* **notifications:** add global toast notifications for authenticated pages ([#25](https://github.com/mallwang/klaro/issues/25)) ([fbfd3db](https://github.com/mallwang/klaro/commit/fbfd3db104a58d38e4a8164cf8cc1ab9aa9b5239))
* **notifications:** add weekly/monthly contract summary email ([#26](https://github.com/mallwang/klaro/issues/26)) ([07626e9](https://github.com/mallwang/klaro/commit/07626e9515c157bc974afc5ba2c7bc3629b22881))
* **profile:** add account profile settings with email verification and admin role management ([#19](https://github.com/mallwang/klaro/issues/19)) ([f504acb](https://github.com/mallwang/klaro/commit/f504acbc8f9b750c86d55fe762f9a8a16e2ed6a3))
* **profile:** add self-service account deletion with export advisory and sole-admin guard ([#21](https://github.com/mallwang/klaro/issues/21)) ([bdc7cd7](https://github.com/mallwang/klaro/commit/bdc7cd7cc27b635560357be25832867d20556ecd))
* **release:** add automated release workflow with Docker Hub publishing ([#33](https://github.com/mallwang/klaro/issues/33)) ([41ea37f](https://github.com/mallwang/klaro/commit/41ea37f4e9f011e5da3ada90cb95d19d2bc716ad))
* replace monthlyAmount with flexible billing intervals ([#3](https://github.com/mallwang/klaro/issues/3)) ([3cca494](https://github.com/mallwang/klaro/commit/3cca49473cf65151e8cdc7415298be160133413f))
* welcome dashboard with spending overview, category breakdown and upcoming renewals ([#1](https://github.com/mallwang/klaro/issues/1)) ([a3a806d](https://github.com/mallwang/klaro/commit/a3a806dff1bed6fb63cfe8bb0364623b8c8e4655))
