# Changelog

## [1.7.1](https://github.com/sousadiego11/easyqueue/compare/v1.7.0...v1.7.1) (2026-07-06)


### Bug Fixes

* trigger release ([6b48218](https://github.com/sousadiego11/easyqueue/commit/6b48218e99b916a9a006bdc2cbedaf1d3541dae4))

## [1.7.0](https://github.com/sousadiego11/easyqueue/compare/v1.6.0...v1.7.0) (2026-07-06)


### Features

* add connection creation to gallery ([b5bc1e9](https://github.com/sousadiego11/easyqueue/commit/b5bc1e9683d7a7fa50381ec2dc0a9005c5864809))
* add error feedback for connection error ([7558bb7](https://github.com/sousadiego11/easyqueue/commit/7558bb76892720d313939d7278b6692d865d3ced))
* add possibility to delete connections ([482a74c](https://github.com/sousadiego11/easyqueue/commit/482a74c64b24c574f442cc3f3b208bb964d4d452))
* create provider for jetstream and create test environments for providers ([be33706](https://github.com/sousadiego11/easyqueue/commit/be3370671540b37234151977391a5ca49e117557))


### Bug Fixes

* add connection validation for azure service bus ([64c809d](https://github.com/sousadiego11/easyqueue/commit/64c809df9618808088b87b453cc6852311d2e696))
* adjust linux build to add path and correct icons ([127b8bc](https://github.com/sousadiego11/easyqueue/commit/127b8bce6d87cc3033dae9b24fc34dc0713e2ec0))
* adjust modal to reset its state after closing ([2af77dd](https://github.com/sousadiego11/easyqueue/commit/2af77ddc2cd957fdef65859fd5582f99b3b0b1bd))
* handle errors from loading messages ([5deeec0](https://github.com/sousadiego11/easyqueue/commit/5deeec040b1828c1c7068112507253b881b9354e))

## [1.6.0](https://github.com/sousadiego11/easyqueue/compare/v1.5.0...v1.6.0) (2026-06-29)


### Features

* create agents rules for new packages ([8e3943a](https://github.com/sousadiego11/easyqueue/commit/8e3943ac3e989cf9757af828760d96fc38218cf0))
* create provider for redis streams ([324f65f](https://github.com/sousadiego11/easyqueue/commit/324f65f7842e1e5f3c120180e918ad6c4034043e))
* **docs:** add redis streams supported for LP ([0b5b476](https://github.com/sousadiego11/easyqueue/commit/0b5b4766da6b48880f456fd1fec678795050e86a))
* implement provider azure service bus and integration ([963cbb7](https://github.com/sousadiego11/easyqueue/commit/963cbb7bfb5b086a6419e7b7d30812c5b6526df9))
* integrate desktop with redis streams provider ([495e544](https://github.com/sousadiego11/easyqueue/commit/495e544db5ff8f58460c667225929e53f5a0413d))
* **tests:** implement tests for all providers for same behaviour ([03b24be](https://github.com/sousadiego11/easyqueue/commit/03b24bedb62a85ee5c86965109a87ae790ce4451))


### Bug Fixes

* change fallback version on docs to the current package root version ([f5dd56d](https://github.com/sousadiego11/easyqueue/commit/f5dd56d4531016b62ea9fd113c25a057c1d8970a))

## [1.5.0](https://github.com/sousadiego11/easyqueue/compare/v1.4.0...v1.5.0) (2026-06-27)


### Features

* add lightbox to preview images with quality ([19ac846](https://github.com/sousadiego11/easyqueue/commit/19ac846b68421b3b430a01392af23362936fdcc5))

## [1.4.0](https://github.com/sousadiego11/easyqueue/compare/v1.3.0...v1.4.0) (2026-06-20)


### Features

* release landing page ([78a9d70](https://github.com/sousadiego11/easyqueue/commit/78a9d7034a92936ad46492a27a79a3f24626b3b8))

## [1.3.0](https://github.com/sousadiego11/easyqueue/compare/v1.2.0...v1.3.0) (2026-06-19)


### Features

* add alert dialog for message removal ([7c71922](https://github.com/sousadiego11/easyqueue/commit/7c71922b3c0e236e4c259dcda263d25ca64b18f0))
* implement release single message and all consume messages ([d3b431a](https://github.com/sousadiego11/easyqueue/commit/d3b431ade6373cb5037eda25975297ef05783f15))


### Bug Fixes

* adjust queue purging from rabbit provider, delete all consume messages ([d3b431a](https://github.com/sousadiego11/easyqueue/commit/d3b431ade6373cb5037eda25975297ef05783f15))
* sqs purge messages only that are consumed ([be0958c](https://github.com/sousadiego11/easyqueue/commit/be0958c97e5470553eb40808069527f2a58a0e54))

## [1.2.0](https://github.com/sousadiego11/easyqueue/compare/v1.1.1...v1.2.0) (2026-06-18)


### Features

* add empty state and loading feedbacks ([371f12a](https://github.com/sousadiego11/easyqueue/commit/371f12a95adc65c09b9f749a356e1b656128c80a))
* add filters and sorting for messages table ([0f7a891](https://github.com/sousadiego11/easyqueue/commit/0f7a89165602473a66d17499a6084ad3a301b4ac))
* add logo on root folter ([b8d23de](https://github.com/sousadiego11/easyqueue/commit/b8d23de1221790c037358a7b4748b6c7fa96a9fa))
* add possibility to send headers on publish ([efa0305](https://github.com/sousadiego11/easyqueue/commit/efa03050dbc88d090c1c8f62cef6a45ec2f41774))
* add sqs provider and adjust rabbit to destructive consuming ([8c3dbff](https://github.com/sousadiego11/easyqueue/commit/8c3dbffc433fcd1c984ef77913800b38f738e7d9))
* encrypt connections file to avoid easy peeking ([85eb4e5](https://github.com/sousadiego11/easyqueue/commit/85eb4e597f50a46c3ddaaaf194aaa1bba2e89d50))
* implement connection toggle ([0fd7235](https://github.com/sousadiego11/easyqueue/commit/0fd7235484780a484081e92b2d3108411f98098b))
* implement purge queue ([9813cb8](https://github.com/sousadiego11/easyqueue/commit/9813cb8711b9e5ff1f77dbf768adb818e7978280))
* toast feedback for connection toggle ([d324804](https://github.com/sousadiego11/easyqueue/commit/d32480410718a646051d9b81c370bf288b43ca6a))


### Bug Fixes

* add artifact name to linux on electron builder ([2f0ce4d](https://github.com/sousadiego11/easyqueue/commit/2f0ce4d862330c6f69fcd2be91a9b19bf7f1d4d6))
* add icon to electron builder ([441ad56](https://github.com/sousadiego11/easyqueue/commit/441ad562b44d59fec973f234960acfeb3a31aecb))
* add packagename to deb on electronbuilder ([07f38dd](https://github.com/sousadiego11/easyqueue/commit/07f38dd6cb50488fafe38d74097d0e630f557470))
* add version to desktop packagejson ([031037b](https://github.com/sousadiego11/easyqueue/commit/031037bddecf73a967d399240b21bb7b46529a52))
* adjust icons generation and in devmode ([4c8c1be](https://github.com/sousadiego11/easyqueue/commit/4c8c1befaf97e92094dd52458d9b12a3a98548ed))
* adjust release please ([29c0fb4](https://github.com/sousadiego11/easyqueue/commit/29c0fb48132b9c423e16b45060bd147232356cb4))
* adjust silent failed check and agents instructions ([1dc0b86](https://github.com/sousadiego11/easyqueue/commit/1dc0b862afd2ba8fca9ba0df189a64b32fed4bee))
* generate platform icons for builds ([bab85b1](https://github.com/sousadiego11/easyqueue/commit/bab85b1672ba952ab4c0dcc8c9db0057f76a5218))
* pnpm version on test workflow ([aed30f5](https://github.com/sousadiego11/easyqueue/commit/aed30f59370d57a318a07912a3654fd76a276de7))
* rerender current connection on toggle ([49144b4](https://github.com/sousadiego11/easyqueue/commit/49144b4dd78056069178369f9be9acd464760891))
* set input for version in build workflow ([99d04e3](https://github.com/sousadiego11/easyqueue/commit/99d04e30cf2fcafa82f2c6a0563f9fe1719f336e))
* upload artifacts to github release ([4682302](https://github.com/sousadiego11/easyqueue/commit/4682302ecc52ba13d5b778f490eeeb13d8c1675d))

## [1.1.1](https://github.com/sousadiego11/easyqueue/compare/v1.1.0...v1.1.1) (2026-06-18)


### Bug Fixes

* adjust release please ([29c0fb4](https://github.com/sousadiego11/easyqueue/commit/29c0fb48132b9c423e16b45060bd147232356cb4))

## [1.1.0](https://github.com/sousadiego11/easyqueue/compare/v1.0.0...v1.1.0) (2026-06-18)


### Features

* add empty state and loading feedbacks ([371f12a](https://github.com/sousadiego11/easyqueue/commit/371f12a95adc65c09b9f749a356e1b656128c80a))
* add filters and sorting for messages table ([0f7a891](https://github.com/sousadiego11/easyqueue/commit/0f7a89165602473a66d17499a6084ad3a301b4ac))
* add logo on root folter ([b8d23de](https://github.com/sousadiego11/easyqueue/commit/b8d23de1221790c037358a7b4748b6c7fa96a9fa))
* add possibility to send headers on publish ([efa0305](https://github.com/sousadiego11/easyqueue/commit/efa03050dbc88d090c1c8f62cef6a45ec2f41774))
* add sqs provider and adjust rabbit to destructive consuming ([8c3dbff](https://github.com/sousadiego11/easyqueue/commit/8c3dbffc433fcd1c984ef77913800b38f738e7d9))
* encrypt connections file to avoid easy peeking ([85eb4e5](https://github.com/sousadiego11/easyqueue/commit/85eb4e597f50a46c3ddaaaf194aaa1bba2e89d50))
* implement connection toggle ([0fd7235](https://github.com/sousadiego11/easyqueue/commit/0fd7235484780a484081e92b2d3108411f98098b))
* implement purge queue ([9813cb8](https://github.com/sousadiego11/easyqueue/commit/9813cb8711b9e5ff1f77dbf768adb818e7978280))
* toast feedback for connection toggle ([d324804](https://github.com/sousadiego11/easyqueue/commit/d32480410718a646051d9b81c370bf288b43ca6a))


### Bug Fixes

* add artifact name to linux on electron builder ([2f0ce4d](https://github.com/sousadiego11/easyqueue/commit/2f0ce4d862330c6f69fcd2be91a9b19bf7f1d4d6))
* add icon to electron builder ([441ad56](https://github.com/sousadiego11/easyqueue/commit/441ad562b44d59fec973f234960acfeb3a31aecb))
* add packagename to deb on electronbuilder ([07f38dd](https://github.com/sousadiego11/easyqueue/commit/07f38dd6cb50488fafe38d74097d0e630f557470))
* add version to desktop packagejson ([031037b](https://github.com/sousadiego11/easyqueue/commit/031037bddecf73a967d399240b21bb7b46529a52))
* adjust icons generation and in devmode ([4c8c1be](https://github.com/sousadiego11/easyqueue/commit/4c8c1befaf97e92094dd52458d9b12a3a98548ed))
* adjust silent failed check and agents instructions ([1dc0b86](https://github.com/sousadiego11/easyqueue/commit/1dc0b862afd2ba8fca9ba0df189a64b32fed4bee))
* generate platform icons for builds ([bab85b1](https://github.com/sousadiego11/easyqueue/commit/bab85b1672ba952ab4c0dcc8c9db0057f76a5218))
* pnpm version on test workflow ([aed30f5](https://github.com/sousadiego11/easyqueue/commit/aed30f59370d57a318a07912a3654fd76a276de7))
* rerender current connection on toggle ([49144b4](https://github.com/sousadiego11/easyqueue/commit/49144b4dd78056069178369f9be9acd464760891))
* set input for version in build workflow ([99d04e3](https://github.com/sousadiego11/easyqueue/commit/99d04e30cf2fcafa82f2c6a0563f9fe1719f336e))
* upload artifacts to github release ([4682302](https://github.com/sousadiego11/easyqueue/commit/4682302ecc52ba13d5b778f490eeeb13d8c1675d))
